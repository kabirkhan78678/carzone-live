import * as archiverModule from 'archiver';
import { Writable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { sendEmail } from '../utils/emailService.js';
import { getEmailLogoConfig } from '../utils/user_helper.js';
import '../config/firebase.js';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads and renders the download data email template with dynamic placeholders
 */
const renderDownloadEmailTemplate = (userName, fileName, logoUrl = '') => {
    try {
        const templatePath = path.join(__dirname, '..', 'templates', 'download data template.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace(/{{userName}}/g, userName);
        html = html.replace(/{{fileName}}/g, fileName);
        html = html.replace(/{{year}}/g, new Date().getFullYear());
        html = html.replace(/{{logoUrl}}/g, logoUrl);
        return html;
    } catch (err) {
        console.warn('[userDataExport] Template load failed, using fallback HTML:', err.message);
        return null;
    }
};

/**
 * Creates a ZipArchive instance compatible across all archiver versions
 */
const getZipArchive = (options = { zlib: { level: 9 } }) => {
    if (archiverModule.ZipArchive) {
        return new archiverModule.ZipArchive(options);
    }
    if (typeof archiverModule.default === 'function') {
        return archiverModule.default('zip', options);
    }
    if (typeof archiverModule === 'function') {
        return archiverModule('zip', options);
    }
    if (archiverModule.create) {
        return archiverModule.create('zip', options);
    }
    throw new Error('Could not instantiate zip archive');
};

/**
 * Helper to safely execute query without throwing errors if tables are empty/optional
 */
const safeQuery = async (sql, params = []) => {
    try {
        const rows = await db.query(sql, params);
        return Array.isArray(rows) ? rows : [];
    } catch (err) {
        console.warn(`[userDataExport] Query warning (${sql}):`, err.message);
        return [];
    }
};

/**
 * Helper to convert array of objects into RFC-4180 compliant CSV string
 * Includes UTF-8 BOM (\uFEFF) for optimal rendering in Microsoft Excel and international spreadsheet viewers.
 */
export const convertArrayToCsv = (rows, defaultHeaders = []) => {
    const BOM = '\uFEFF';

    if (!rows || rows.length === 0) {
        if (defaultHeaders && defaultHeaders.length > 0) {
            return BOM + defaultHeaders.join(',') + '\r\n"No records found"\r\n';
        }
        return BOM + 'Status\r\n"No records found"\r\n';
    }

    const headers = Object.keys(rows[0]);
    const escapeVal = (val) => {
        if (val === null || val === undefined) return '';
        if (val instanceof Date) return val.toISOString();
        if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerLine = headers.join(',');
    const dataLines = rows.map(row => headers.map(h => escapeVal(row[h])).join(','));
    return BOM + [headerLine, ...dataLines].join('\r\n');
};

/**
 * Creates an in-memory Zip archive containing the CSV files
 * 
 * @param {Array<{name: string, content: string}>} files
 * @returns {Promise<Buffer>}
 */
export const createZipBuffer = (files) => {
    return new Promise((resolve, reject) => {
        const archive = getZipArchive({
            zlib: { level: 9 }
        });

        const buffers = [];
        const writable = new Writable({
            write(chunk, encoding, callback) {
                buffers.push(chunk);
                callback();
            }
        });

        writable.on('finish', () => {
            resolve(Buffer.concat(buffers));
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(writable);

        files.forEach(file => {
            archive.append(file.content, { name: file.name });
        });

        archive.finalize();
    });
};

/**
 * Fetches user data, formats into exactly the 7 requested CSV files, creates a zip archive, and sends via email.
 * 
 * Strict 7 CSV Categories:
 * 1. my_profile.csv                  - Complete personal, account, company, and role details
 * 2. vehicle_list.csv               - All listed cars with complete technical specs
 * 3. physical_visits.csv            - Test drives & physical showroom visits (buyer & seller)
 * 4. plan_slots.csv                 - Subscriptions, plan slots, and slot requests
 * 5. chat_history.csv               - Direct user chat conversations ONLY (no notifications)
 * 6. purchases_and_transactions.csv - Financial purchases, slot upgrades, and transactions
 * 7. saved_cars.csv                 - Wishlisted cars (excluding user's own cars)
 * 
 * @param {number|string} userId
 * @returns {Promise<{success: boolean, email: string, fileName: string}>}
 */
export const exportAndEmailUserData = async (userId) => {
    // -------------------------------------------------------------
    // 1. My Profile
    // -------------------------------------------------------------
    const userRows = await safeQuery(
        `SELECT u.id, u.fullName, u.email, u.phoneNumber, u.countryCode,
                u.whatsappNumber, u.whatsappCountryCode, u.account_type,
                CASE WHEN u.isSeller = 1 THEN 'Yes' ELSE 'No' END AS isSeller,
                u.sellerType,
                CASE WHEN u.is_activated = 1 THEN 'Yes' ELSE 'No' END AS is_activated,
                CASE WHEN u.isVerified = 1 THEN 'Yes' ELSE 'No' END AS isVerified,
                CASE WHEN u.status = 1 THEN 'Active' ELSE 'Inactive' END AS account_status,
                CASE WHEN u.isPhysicalVisitAllowed = 1 THEN 'Yes' ELSE 'No' END AS isPhysicalVisitAllowed,
                u.language, u.companyName, u.companyAddress, u.commercial_register_number,
                u.legalForm, u.vat, u.business_phone, u.businessCountryCode,
                u.websiteUrl, u.tagline, u.description, u.location, u.city, u.pincode,
                u.fullAddress, u.google_rating, u.profileImage, u.coverImage,
                CASE WHEN u.isNotification = 1 THEN 'Enabled' ELSE 'Disabled' END AS notifications_enabled,
                u.createdAt, u.updatedAt
         FROM tbl_users u
         WHERE u.id = ? LIMIT 1`,
        [userId]
    );

    if (!userRows || userRows.length === 0) {
        throw new Error('User not found');
    }
    const user = { ...userRows[0] };
    const userEmail = user.email;

    if (!userEmail) {
        throw new Error('User email not found');
    }

    const userRoles = await safeQuery(
        "SELECT role, seller_type, is_active, created_at, updated_at FROM tbl_roles WHERE user_id = ?",
        [userId]
    );
    user.assigned_roles = userRoles.map(r => r.role).filter(Boolean).join(', ') || 'User';

    // -------------------------------------------------------------
    // 2. Vehicle List (Complete Automotive Specs & Status)
    // -------------------------------------------------------------
    const listedCars = await safeQuery(
        `SELECT 
            c.id AS car_id,
            c.brandName AS brand,
            c.carModel AS model,
            c.version,
            c.selectYear AS model_year,
            c.first_registration_date,
            c.selling_price AS price_chf,
            c.totalPrice AS total_price_chf,
            c.new_price AS original_new_price_chf,
            c.carMileage AS mileage_km,
            COALESCE(c.fuelType, ft.code) AS fuel_type,
            COALESCE(c.transmission, tr.code) AS transmission,
            COALESCE(c.body_type, bt.code) AS body_type,
            COALESCE(drv.code, '') AS drive_type,
            COALESCE(c.carColor, col.color_key, c.exterior_color_custom) AS exterior_color,
            CASE WHEN c.is_metallic = 1 THEN 'Yes' ELSE 'No' END AS is_metallic_paint,
            COALESCE(c.interior_color_custom, '') AS interior_color,
            c.doors,
            c.sittingCapacity AS seats,
            c.power_kw,
            c.power_ps,
            c.cubic_capacity AS displacement_ccm,
            c.cylinders,
            c.gears,
            c.consumption AS consumption_l_per_100km,
            c.co2Emission AS co2_emission_g_per_km,
            c.energy_efficiency,
            c.euro_norm,
            c.empty_weight AS empty_weight_kg,
            c.total_weight AS total_weight_kg,
            c.braked_towing_capacity_kg,
            c.wltp_range AS electric_range_km,
            c.battery_capacity AS battery_capacity_kwh,
            c.vin_number AS vin,
            c.type_approval,
            c.registration_master_number AS stamm_number,
            COALESCE(vcond.condition_key, c.carCondition) AS car_condition,
            c.mfk_status,
            c.last_mfk_date,
            c.next_mfk_due,
            CASE WHEN c.is_swiss_vehicle = 1 THEN 'Yes' ELSE 'No' END AS is_swiss_vehicle,
            COALESCE(vas.code, CASE WHEN c.is_accident_vehicle = 1 THEN 'accident' ELSE 'no_accident' END) AS accident_status,
            CASE WHEN c.is_fresh_from_service = 1 THEN 'Yes' ELSE 'No' END AS is_fresh_from_service,
            CASE WHEN c.isLeasing = 1 THEN 'Yes' ELSE 'No' END AS is_leasing_available,
            c.leasingPrice AS monthly_leasing_price_chf,
            c.warranty_type_text AS warranty_type,
            c.warranty_number_of_months AS warranty_months,
            c.warranty_kilometer AS warranty_max_km,
            c.warranty_from,
            c.warranty_to,
            c.warranty_description,
            c.extras AS optional_equipment,
            c.carFeatures AS standard_features,
            c.location,
            c.listing_status,
            c.listing_step,
            CASE WHEN c.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS is_active,
            CASE WHEN c.is_deleted = 1 THEN 'Yes' ELSE 'No' END AS is_deleted,
            c.createdAt AS created_at,
            c.updatedAt AS updated_at
         FROM tbl_cars c
         LEFT JOIN tbl_fuel_types ft ON c.fuel_type_id = ft.id
         LEFT JOIN tbl_transmissions tr ON c.transmission_id = tr.id
         LEFT JOIN tbl_body_types bt ON c.body_type_id = bt.id
         LEFT JOIN tbl_drives drv ON c.drive_type_id = drv.id
         LEFT JOIN tbl_colors col ON (c.exterior_color_id = col.id OR c.color_id = col.id)
         LEFT JOIN tbl_vehicle_conditions vcond ON c.carCondition = vcond.id
         LEFT JOIN tbl_vehicle_accident_status vas ON c.vehicle_accident_status_id = vas.id
         WHERE c.user_id = ?
         ORDER BY c.id DESC`,
        [userId]
    );

    // -------------------------------------------------------------
    // 3. Physical Visits (Test Drives & Showroom Viewings)
    // -------------------------------------------------------------
    const physicalVisits = await safeQuery(
        `SELECT 
            pv.id AS visit_id,
            pv.car_id,
            c.brandName AS car_brand,
            c.carModel AS car_model,
            c.selectYear AS car_year,
            c.selling_price AS car_price_chf,
            CASE WHEN pv.user_id = ? THEN 'Buyer (Booked by Me)' ELSE 'Seller (My Vehicle)' END AS my_role,
            pv.user_id AS buyer_id,
            COALESCE(u_buyer.fullName, pv.full_name) AS buyer_name,
            COALESCE(pv.email, u_buyer.email) AS buyer_email,
            COALESCE(pv.phone_number, u_buyer.phoneNumber) AS buyer_phone,
            pv.seller_id,
            u_seller.fullName AS seller_name,
            u_seller.email AS seller_email,
            u_seller.phoneNumber AS seller_phone,
            pv.visit_date,
            pv.visit_time,
            pv.rescheduled_date,
            pv.rescheduled_time,
            pv.status AS seller_status,
            pv.buyer_side_status,
            pv.seller_note,
            pv.message AS buyer_message,
            pv.created_at
         FROM tbl_physical_visits pv
         LEFT JOIN tbl_cars c ON pv.car_id = c.id
         LEFT JOIN tbl_users u_seller ON pv.seller_id = u_seller.id
         LEFT JOIN tbl_users u_buyer ON pv.user_id = u_buyer.id
         WHERE pv.user_id = ? OR pv.seller_id = ?
         ORDER BY pv.id DESC`,
        [userId, userId, userId]
    );

    // -------------------------------------------------------------
    // 4. Plan Slots (Subscriptions & Custom Slot Requests)
    // -------------------------------------------------------------
    const userPlans = await safeQuery(
        `SELECT 
            up.id AS id,
            'Subscription Plan' AS entry_type,
            COALESCE(p.name, CASE WHEN up.is_basic_signup = 1 THEN 'Free Basic Signup Plan' ELSE 'Custom Dealer Plan' END) AS plan_name,
            COALESCE(p.plan_type, 'main') AS plan_type,
            COALESCE(p.duration_type, 'monthly') AS duration_type,
            COALESCE(p.price, '0.00') AS price_chf,
            up.total_slots,
            up.start_date,
            up.end_date,
            CASE WHEN up.is_active = 1 THEN 'Active' ELSE 'Inactive/Expired' END AS status,
            CASE WHEN up.is_basic_signup = 1 THEN 'Yes' ELSE 'No' END AS is_basic_signup,
            '' AS notes,
            up.created_at
         FROM tbl_user_plans up
         LEFT JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ?
         ORDER BY up.id DESC`,
        [userId]
    );

    const slotRequests = await safeQuery(
        `SELECT 
            sr.id AS id,
            'Custom Slot Request' AS entry_type,
            'Custom Additional Slots' AS plan_name,
            'additional' AS plan_type,
            COALESCE(sr.duration_type, 'monthly') AS duration_type,
            COALESCE(sr.approved_price, '0.00') AS price_chf,
            sr.requested_slots AS total_slots,
            sr.created_at AS start_date,
            NULL AS end_date,
            sr.status AS status,
            'No' AS is_basic_signup,
            CONCAT_WS(' | ', 
                IF(sr.message IS NOT NULL AND sr.message != '', CONCAT('User Request: ', sr.message), NULL),
                IF(sr.admin_message IS NOT NULL AND sr.admin_message != '', CONCAT('Admin Response: ', sr.admin_message), NULL)
            ) AS notes,
            sr.created_at
         FROM slot_requests sr
         WHERE sr.user_id = ?
         ORDER BY sr.id DESC`,
        [userId]
    );

    const combinedPlansAndSlots = [...userPlans, ...slotRequests].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // -------------------------------------------------------------
    // 5. Chat History (ACCURATE: Firestore Direct Messages + Media Attachments + MySQL Attachments)
    // -------------------------------------------------------------
    const chatHistory = [];
    const userIdsToFetch = new Set([String(userId)]);
    const seenMediaUrls = new Set();

    try {
        const firestoreDb = getFirestore();
        const strUserId = String(userId);

        // Fetch all chat threads where participants array contains the user
        const stringQuery = await firestoreDb.collection('chats').where('participants', 'array-contains', strUserId).get();
        const chatDocMap = new Map();
        stringQuery.docs.forEach(d => chatDocMap.set(d.id, d));

        // Also check if stored as number in participants array
        const numUserId = Number(userId);
        if (!isNaN(numUserId)) {
            const numQuery = await firestoreDb.collection('chats').where('participants', 'array-contains', numUserId).get();
            numQuery.docs.forEach(d => {
                if (!chatDocMap.has(d.id)) chatDocMap.set(d.id, d);
            });
        }

        // Loop over each thread and extract messages from the subcollection 'messages'
        for (const chatDoc of chatDocMap.values()) {
            const chatData = chatDoc.data() || {};
            const participants = (chatData.participants || []).map(String);
            participants.forEach(p => userIdsToFetch.add(p));
            const otherParticipantId = participants.find(p => p !== strUserId) || '';

            const msgsSnap = await chatDoc.ref.collection('messages').get();
            msgsSnap.forEach(mDoc => {
                const m = mDoc.data() || {};
                const senderId = String(m.senderId || '');
                const receiverId = String(m.otherUserId || (senderId === strUserId ? otherParticipantId : strUserId));

                if (senderId) userIdsToFetch.add(senderId);
                if (receiverId) userIdsToFetch.add(receiverId);

                const isSender = (senderId === strUserId);
                const direction = isSender ? 'Sent' : 'Received';
                const rawType = m.type || (m.mediaUrl ? 'attachment' : 'text');

                let messageText = '';
                if (m.text && m.text !== '📷 Photo') {
                    messageText = m.fileName ? `${m.text} (${m.fileName})` : m.text;
                } else if (m.fileName) {
                    messageText = `[${rawType.toUpperCase()}] ${m.fileName}`;
                } else if (m.mediaUrl) {
                    messageText = `[${rawType.toUpperCase()}] Attachment`;
                } else {
                    messageText = m.text || '';
                }

                const attachmentUrl = m.mediaUrl || '';
                if (attachmentUrl) {
                    seenMediaUrls.add(attachmentUrl);
                }

                let sentAt = '';
                if (m.createdAt && typeof m.createdAt.toDate === 'function') {
                    sentAt = m.createdAt.toDate().toISOString().replace('T', ' ').slice(0, 19);
                } else if (m.createdAt && m.createdAt._seconds) {
                    sentAt = new Date(m.createdAt._seconds * 1000).toISOString().replace('T', ' ').slice(0, 19);
                } else if (m.createdAt) {
                    sentAt = new Date(m.createdAt).toISOString().replace('T', ' ').slice(0, 19);
                }

                const readBy = Array.isArray(m.readBy) ? m.readBy.map(String) : [];
                const isRead = readBy.includes(receiverId) || readBy.length > 1;
                const readStatus = isRead ? 'Read' : (isSender ? 'Delivered' : 'Received');

                chatHistory.push({
                    message_id: mDoc.id,
                    message_type: rawType,
                    direction,
                    sender_id: senderId,
                    receiver_id: receiverId,
                    message_text: messageText,
                    attachment_url: attachmentUrl,
                    read_status: readStatus,
                    sent_at: sentAt
                });
            });
        }
    } catch (fsErr) {
        console.warn('[userDataExport] Firestore chat history fetch error:', fsErr.message);
    }

    // Resolve user names from MySQL tbl_users
    const userMap = new Map();
    if (userIdsToFetch.size > 0) {
        const idsArray = Array.from(userIdsToFetch).filter(Boolean);
        if (idsArray.length > 0) {
            const usersRows = await safeQuery('SELECT id, fullName, email FROM tbl_users WHERE id IN (?)', [idsArray]);
            for (const u of usersRows) {
                userMap.set(String(u.id), u.fullName || u.email || `User #${u.id}`);
            }
        }
    }

    // Attach sender_name and receiver_name to each Firestore message
    for (const item of chatHistory) {
        if (item.sender_id === String(userId)) {
            item.sender_name = user.fullName || 'You';
            item.receiver_name = userMap.get(item.receiver_id) || (item.receiver_id ? `User #${item.receiver_id}` : 'Other User');
        } else {
            item.sender_name = userMap.get(item.sender_id) || (item.sender_id ? `User #${item.sender_id}` : 'Other User');
            item.receiver_name = user.fullName || 'You';
        }
    }

    // Merge any MySQL chat attachments (tbl_chat_attachments and chat_attachments) not already captured from Firestore
    const attachments1 = await safeQuery(
        `SELECT 
            ca.id AS message_id,
            COALESCE(ca.attachment_type, 'attachment') AS message_type,
            'Sent' AS direction,
            ca.user_id AS sender_id,
            COALESCE(u.fullName, 'You') AS sender_name,
            '' AS receiver_id,
            'Chat Partner' AS receiver_name,
            CONCAT('[', UPPER(COALESCE(ca.attachment_type, 'FILE')), '] ', COALESCE(ca.original_name, 'Attachment')) AS message_text,
            ca.attachment_url,
            'Sent' AS read_status,
            DATE_FORMAT(ca.created_at, '%Y-%m-%d %H:%i:%s') AS sent_at
         FROM chat_attachments ca
         LEFT JOIN tbl_users u ON ca.user_id = u.id
         WHERE ca.user_id = ?`,
        [userId]
    );

    const attachments2 = await safeQuery(
        `SELECT 
            ca.id AS message_id,
            COALESCE(ca.attachment_type, 'attachment') AS message_type,
            'Sent' AS direction,
            ca.user_id AS sender_id,
            COALESCE(u.fullName, 'You') AS sender_name,
            '' AS receiver_id,
            'Chat Partner' AS receiver_name,
            CONCAT('[', UPPER(COALESCE(ca.attachment_type, 'FILE')), '] ', COALESCE(ca.original_name, 'Attachment')) AS message_text,
            ca.attachment_url,
            'Sent' AS read_status,
            DATE_FORMAT(ca.createdAt, '%Y-%m-%d %H:%i:%s') AS sent_at
         FROM tbl_chat_attachments ca
         LEFT JOIN tbl_users u ON ca.user_id = u.id
         WHERE ca.user_id = ?`,
        [userId]
    );

    for (const att of [...attachments1, ...attachments2]) {
        if (att.attachment_url && !seenMediaUrls.has(att.attachment_url)) {
            chatHistory.push(att);
            seenMediaUrls.add(att.attachment_url);
        }
    }

    // Merge any MySQL tbl_notification chat messages if not duplicate
    const mysqlChatNotifs = await safeQuery(
        `SELECT 
            n.id AS message_id,
            'text' AS message_type,
            CASE 
                WHEN n.sendFrom = ? THEN 'Sent' 
                WHEN n.sendTo = ? THEN 'Received' 
                ELSE 'Direct Message' 
            END AS direction,
            n.sendFrom AS sender_id,
            COALESCE(uSender.fullName, CASE WHEN n.sendFrom = ? THEN 'You' WHEN n.title != 'New Message' AND n.title != '' THEN n.title ELSE 'Other User' END) AS sender_name,
            n.sendTo AS receiver_id,
            COALESCE(uReceiver.fullName, CASE WHEN n.sendTo = ? THEN 'You' ELSE 'Other User' END) AS receiver_name,
            n.body AS message_text,
            '' AS attachment_url,
            CASE WHEN n.isRead = 1 THEN 'Read' ELSE 'Delivered' END AS read_status,
            DATE_FORMAT(n.createdAt, '%Y-%m-%d %H:%i:%s') AS sent_at
         FROM tbl_notification n
         LEFT JOIN tbl_users uSender ON n.sendFrom = uSender.id
         LEFT JOIN tbl_users uReceiver ON n.sendTo = uReceiver.id
         WHERE (n.sendTo = ? OR n.sendFrom = ?)
           AND n.notificationType = 'chat'
         ORDER BY n.id ASC`,
        [userId, userId, userId, userId, userId, userId]
    );

    // If chatHistory is empty or has non-duplicates from MySQL notifications, merge them
    const seenTexts = new Set(chatHistory.map(c => `${c.sender_id}_${c.message_text}`));
    for (const notif of mysqlChatNotifs) {
        const key = `${notif.sender_id}_${notif.message_text}`;
        if (!seenTexts.has(key)) {
            chatHistory.push(notif);
            seenTexts.add(key);
        }
    }

    // Sort all messages chronologically
    chatHistory.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

    // -------------------------------------------------------------
    // 6. Purchases & Financial Transactions
    // -------------------------------------------------------------
    const purchases = await safeQuery(
        `SELECT 
            p.id AS purchase_id,
            p.user_id,
            p.plan_id,
            COALESCE(pl.name, 'Slots Package') AS plan_name,
            p.plan_type,
            p.purchased_slots,
            p.prorated_price AS amount_chf,
            'CHF' AS currency,
            p.payment_status,
            COALESCE(p.transaction_id, 'N/A') AS stripe_transaction_id,
            p.purchase_date
         FROM tbl_purchases p
         LEFT JOIN tbl_plans pl ON p.plan_id = pl.id
         WHERE p.user_id = ?
         ORDER BY p.id DESC`,
        [userId]
    );

    // -------------------------------------------------------------
    // 7. Saved Cars / Wishlist (Strictly Excluding User's Own Cars)
    // -------------------------------------------------------------
    const savedCars = await safeQuery(
        `SELECT 
            w.id AS wishlist_id,
            w.carId AS car_id,
            c.brandName AS brand,
            c.carModel AS model,
            c.version,
            c.selectYear AS model_year,
            c.first_registration_date,
            c.selling_price AS price_chf,
            c.totalPrice AS total_price_chf,
            c.carMileage AS mileage_km,
            COALESCE(c.fuelType, ft.code) AS fuel_type,
            COALESCE(c.transmission, tr.code) AS transmission,
            COALESCE(c.body_type, bt.code) AS body_type,
            COALESCE(c.carColor, col.color_key, c.exterior_color_custom) AS color,
            c.power_kw,
            c.power_ps,
            c.location,
            u_seller.fullName AS seller_name,
            u_seller.phoneNumber AS seller_phone,
            w.createdAt AS saved_at
         FROM tbl_car_wishlist w
         JOIN tbl_cars c ON w.carId = c.id
         LEFT JOIN tbl_fuel_types ft ON c.fuel_type_id = ft.id
         LEFT JOIN tbl_transmissions tr ON c.transmission_id = tr.id
         LEFT JOIN tbl_body_types bt ON c.body_type_id = bt.id
         LEFT JOIN tbl_colors col ON (c.exterior_color_id = col.id OR c.color_id = col.id)
         LEFT JOIN tbl_users u_seller ON c.user_id = u_seller.id
         WHERE w.user_id = ?
           AND c.user_id != w.user_id
           AND c.is_deleted = 0
         ORDER BY w.id DESC`,
        [userId]
    );

    // -------------------------------------------------------------
    // Generate Exactly the 7 CSV Strings
    // -------------------------------------------------------------
    const profileCsv = convertArrayToCsv([user]);
    const vehicleListCsv = convertArrayToCsv(listedCars);
    const physicalVisitsCsv = convertArrayToCsv(physicalVisits);
    const planSlotsCsv = convertArrayToCsv(combinedPlansAndSlots);
    const chatHistoryCsv = convertArrayToCsv(
        chatHistory,
        ['message_id', 'message_type', 'direction', 'sender_id', 'sender_name', 'receiver_id', 'receiver_name', 'message_text', 'attachment_url', 'read_status', 'sent_at']
    );
    const purchasesCsv = convertArrayToCsv(purchases);
    const savedCarsCsv = convertArrayToCsv(savedCars);

    // Package ONLY the 7 required CSV files into the Zip Buffer
    const zipFiles = [
        { name: 'my_profile.csv', content: profileCsv },
        { name: 'vehicle_list.csv', content: vehicleListCsv },
        { name: 'physical_visits.csv', content: physicalVisitsCsv },
        { name: 'plan_slots.csv', content: planSlotsCsv },
        { name: 'chat_history.csv', content: chatHistoryCsv },
        { name: 'purchases_and_transactions.csv', content: purchasesCsv },
        { name: 'saved_cars.csv', content: savedCarsCsv }
    ];

    const zipBuffer = await createZipBuffer(zipFiles);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const fileName = `CarZone_UserData_${userId}_${dateFormatted}.zip`;

    // Build Email HTML from template
    const displayName = user.fullName || user.email || 'Valued User';
    const { logoUrl, attachments: logoAttachments } = await getEmailLogoConfig();
    const emailHtml = renderDownloadEmailTemplate(displayName, fileName, logoUrl) || `
    <!DOCTYPE html><html><body>
      <p>Hello ${displayName},</p>
      <p>Your CarZone data export is ready. Please find the ZIP file <strong>${fileName}</strong> attached to this email.</p>
      <p>Best regards,<br><strong>CarZone Team</strong></p>
    </body></html>`;

    await sendEmail({
        to: userEmail,
        subject: `Your CarZone Data Export (${fileName})`,
        html: emailHtml,
        attachments: [
            ...logoAttachments,
            {
                filename: fileName,
                content: zipBuffer,
                contentType: 'application/zip'
            }
        ]
    });

    console.log(`[userDataExport] User data ZIP successfully sent to ${userEmail} (${fileName}) containing exactly 7 CSVs.`);
    return { success: true, email: userEmail, fileName };
};
