import * as archiverModule from 'archiver';
import { Writable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import { sendEmail } from '../utils/emailService.js';
import { getEmailLogoConfig } from '../utils/user_helper.js';

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
 */
export const convertArrayToCsv = (rows, defaultHeaders = []) => {
    if (!rows || rows.length === 0) {
        if (defaultHeaders && defaultHeaders.length > 0) {
            return defaultHeaders.join(',') + '\r\n"No records found"\r\n';
        }
        return 'Status\r\n"No records found"\r\n';
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
    return [headerLine, ...dataLines].join('\r\n');
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
 * Fetches all user data across all tables, formats into CSVs, creates a zip archive, and sends via email.
 * 
 * @param {number|string} userId
 * @returns {Promise<{success: boolean, email: string, fileName: string}>}
 */
export const exportAndEmailUserData = async (userId) => {
    // 1. Fetch User Record
    const userRows = await safeQuery("SELECT * FROM tbl_users WHERE id = ? LIMIT 1", [userId]);
    if (!userRows || userRows.length === 0) {
        throw new Error('User not found');
    }
    const user = userRows[0];
    const userEmail = user.email;

    if (!userEmail) {
        throw new Error('User email not found');
    }

    // 2. User Profile (Sanitize sensitive fields)
    const safeUserProfile = { ...user };
    delete safeUserProfile.password;
    delete safeUserProfile.code;
    delete safeUserProfile.forgotPasswordOtp;
    delete safeUserProfile.remember_token;

    // 3. User Roles & Notification Settings
    const roles = await safeQuery(
        "SELECT role, seller_type, is_active, created_at, updated_at FROM tbl_roles WHERE user_id = ?",
        [userId]
    );

    const notifSettings = await safeQuery(
        `SELECT user_id, new_matching_vehicles, price_changes, favorited_vehicle_updates, 
                marketing_promotional, chat_messages, vehicle_inquiries, appointments, listing_updates 
         FROM tbl_user_notification_settings 
         WHERE user_id = ?`,
        [userId]
    );

    // 4. Seller Details (Working Hours, Team, Services, Showroom Media)
    const openingTimes = await safeQuery(
        `SELECT day, is_closed, morning_open_time, morning_close_time, afternoon_open_time, afternoon_close_time 
         FROM seller_opening_times 
         WHERE user_id = ?`,
        [userId]
    );

    const teamMembers = await safeQuery(
        `SELECT fullName, role, phoneNumber, email, languages, profilePhoto 
         FROM seller_team_members 
         WHERE user_id = ?`,
        [userId]
    );

    const services = await safeQuery(
        "SELECT service_name, isActive FROM seller_services WHERE user_id = ?",
        [userId]
    );

    const advantages = await safeQuery(
        "SELECT title FROM seller_advantages WHERE user_id = ?",
        [userId]
    );

    const showroomMedia = await safeQuery(
        `SELECT 'image' AS media_type, imageUrl AS media_url, createdAt 
         FROM seller_images WHERE user_id = ?
         UNION ALL
         SELECT 'video' AS media_type, videoUrl AS media_url, createdAt 
         FROM seller_videos WHERE user_id = ?`,
        [userId, userId]
    );

    // 5. Saved Cars / Wishlist
    const savedCars = await safeQuery(
        `SELECT w.id AS wishlist_id, w.carId, c.brandName, c.carModel, c.selectYear, 
                c.selling_price, c.totalPrice, c.carMileage, c.fuelType, c.carColor, w.createdAt AS saved_at
         FROM tbl_car_wishlist w
         LEFT JOIN tbl_cars c ON w.carId = c.id
         WHERE w.user_id = ?
         ORDER BY w.id DESC`,
        [userId]
    );

    // 6. Chat History (ACCURATE: only user direct chat messages & vehicle inquiries)
    const chatHistory = await safeQuery(
        `SELECT n.id, n.sendFrom, n.sendTo, 
                uSender.fullName AS sender_name,
                uReceiver.fullName AS receiver_name,
                n.title, n.body AS message_text, 
                n.carId, c.brandName, c.carModel,
                n.isRead, n.createdAt
         FROM tbl_notification n
         LEFT JOIN tbl_users uSender ON n.sendFrom = uSender.id
         LEFT JOIN tbl_users uReceiver ON n.sendTo = uReceiver.id
         LEFT JOIN tbl_cars c ON n.carId = c.id
         WHERE (n.sendTo = ? OR n.sendFrom = ?)
           AND (
               n.notificationType IN ('chat', 'SEND_MESSAGE', '4', 'SEND_MESSAGE_NOTIFICATION', 'car_inquiry')
               OR LOWER(n.title) LIKE '%message%'
               OR LOWER(n.title) LIKE '%chat%'
           )
         ORDER BY n.id DESC`,
        [userId, userId]
    );

    // 7. Chat Attachments (ACCURATE: unified from chat_attachments and tbl_chat_attachments)
    const att1 = await safeQuery(
        "SELECT id, user_id, attachment_url, attachment_type, original_name, file_size, created_at FROM chat_attachments WHERE user_id = ?",
        [userId]
    );
    const att2 = await safeQuery(
        "SELECT id, user_id, attachment_url, attachment_type, original_name, file_size, createdAt AS created_at FROM tbl_chat_attachments WHERE user_id = ?",
        [userId]
    );
    const chatAttachments = [...att1, ...att2].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 8. General Notifications & Alerts (Filtered for user)
    const userNotifications = await safeQuery(
        `SELECT n.id, n.title, n.body, n.notificationType, n.carId, c.brandName, c.carModel, n.isRead, n.createdAt
         FROM tbl_notification n
         LEFT JOIN tbl_cars c ON n.carId = c.id
         WHERE n.sendTo = ?
           AND n.notificationType NOT IN ('chat', 'SEND_MESSAGE', '4', 'SEND_MESSAGE_NOTIFICATION', 'car_inquiry')
         ORDER BY n.id DESC
         LIMIT 100`,
        [userId]
    );

    // 9. Activity - Recently Viewed Cars
    const recentlyViewed = await safeQuery(
        `SELECT rv.id, rv.car_id, c.brandName, c.carModel, c.selectYear, c.selling_price, c.totalPrice, rv.viewed_at
         FROM tbl_recently_viewed rv
         LEFT JOIN tbl_cars c ON rv.car_id = c.id
         WHERE rv.user_id = ?
         ORDER BY rv.id DESC`,
        [userId]
    );

    // 10. Physical Visits / Test Drives
    const physicalVisits = await safeQuery(
        `SELECT pv.id, pv.car_id, c.brandName, c.carModel, pv.seller_id, pv.user_id, 
                pv.full_name, pv.email, pv.phone_number, pv.visit_date, pv.visit_time, 
                pv.status, pv.message, pv.created_at
         FROM tbl_physical_visits pv
         LEFT JOIN tbl_cars c ON pv.car_id = c.id
         WHERE pv.user_id = ? OR pv.seller_id = ?
         ORDER BY pv.id DESC`,
        [userId, userId]
    );

    // 11. Saved Searches & Saved Reels
    const savedSearches = await safeQuery(
        "SELECT id, search_name, filters, is_active, created_at, updated_at FROM tbl_saved_searches WHERE user_id = ?",
        [userId]
    );

    const savedReels = await safeQuery(
        `SELECT sr.id, sr.userId, sr.carId, c.brandName, c.carModel, sr.reelType, sr.createdAt
         FROM tbl_saved_car_reels sr
         LEFT JOIN tbl_cars c ON sr.carId = c.id
         WHERE sr.userId = ?
         ORDER BY sr.id DESC`,
        [userId]
    );

    const userUploadedReels = await safeQuery(
        "SELECT id, user_id, reel_url, thumbnail, captions, is_active, createdAt FROM users_reels WHERE user_id = ? ORDER BY id DESC",
        [userId]
    );

    // 12. Purchase Agreements (Sales Contracts)
    const userPhone = user.phoneNumber || '';
    const purchaseAgreements = await safeQuery(
        `SELECT pa.id, pa.status, pa.seller_user_id, pa.buyer_full_name, pa.buyer_phone, 
                pa.make, pa.model, pa.vin, pa.purchase_price, pa.handover_date, pa.created_at
         FROM purchase_agreements pa
         WHERE pa.seller_user_id = ? OR (pa.buyer_phone = ? AND pa.buyer_phone != '')
         ORDER BY pa.id DESC`,
        [userId, userPhone]
    );

    // 13. Purchases & Financial Transactions
    const purchases = await safeQuery(
        `SELECT p.id, p.user_id, p.plan_id, pl.name AS plan_name, p.purchased_slots, 
                p.prorated_price, p.purchase_date, p.payment_status, p.plan_type, p.transaction_id
         FROM tbl_purchases p
         LEFT JOIN tbl_plans pl ON p.plan_id = pl.id
         WHERE p.user_id = ?
         ORDER BY p.id DESC`,
        [userId]
    );

    // 14. Active Plans & Slot Requests
    const userPlans = await safeQuery(
        `SELECT up.id, up.user_id, up.plan_id, up.start_date, up.end_date, up.total_slots, 
                up.is_active, p.name AS plan_name, p.price AS plan_price
         FROM tbl_user_plans up
         LEFT JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ?
         ORDER BY up.id DESC`,
        [userId]
    );

    const slotRequests = await safeQuery(
        `SELECT id, user_id, requested_slots, message, status, approved_price, duration_type, created_at 
         FROM slot_requests 
         WHERE user_id = ?
         ORDER BY id DESC`,
        [userId]
    );

    // 15. User Listed Cars
    const listedCars = await safeQuery(
        `SELECT id, brandName, carModel, selectYear, selling_price, totalPrice, 
                carMileage, fuelType, transmission, body_type, listing_status, is_active, createdAt AS created_at 
         FROM tbl_cars 
         WHERE user_id = ? 
         ORDER BY id DESC`,
        [userId]
    );

    // 16. Support, Help Requests, App Feedback & Reported Listings
    const supportTickets = await safeQuery(
        "SELECT id, user_id, issue, admin_response, status, created_at FROM tbl_support WHERE user_id = ? ORDER BY id DESC",
        [userId]
    );

    const helpRequests = await safeQuery(
        "SELECT id, user_id, full_name, email, description, created_at FROM tbl_help_support WHERE user_id = ? OR email = ? ORDER BY id DESC",
        [userId, userEmail]
    );

    const appFeedbacks = await safeQuery(
        "SELECT id, seller_id, rating, message, created_at FROM tbl_app_feedback WHERE seller_id = ? ORDER BY id DESC",
        [userId]
    );

    const reportedCars = await safeQuery(
        `SELECT rc.id, rc.car_id, c.brandName, c.carModel, rc.reasons, rc.custom_message, rc.status, rc.created_at
         FROM tbl_report_car rc
         LEFT JOIN tbl_cars c ON rc.car_id = c.id
         WHERE rc.user_id = ?
         ORDER BY rc.id DESC`,
        [userId]
    );

    // -------------------------------------------------------------
    // Generate CSV Strings
    // -------------------------------------------------------------
    const profileCsv = convertArrayToCsv([safeUserProfile]);
    const rolesCsv = convertArrayToCsv(roles, ['role', 'seller_type', 'is_active', 'created_at']);
    const notifSettingsCsv = convertArrayToCsv(notifSettings, ['user_id', 'new_matching_vehicles', 'price_changes', 'chat_messages', 'appointments']);
    const openingTimesCsv = convertArrayToCsv(openingTimes, ['day', 'is_closed', 'morning_open_time', 'morning_close_time', 'afternoon_open_time', 'afternoon_close_time']);
    const teamMembersCsv = convertArrayToCsv(teamMembers, ['fullName', 'role', 'phoneNumber', 'email', 'languages']);
    const servicesAdvantagesCsv = convertArrayToCsv(
        [
            ...services.map(s => ({ type: 'Service', name_or_title: s.service_name, active: s.isActive })),
            ...advantages.map(a => ({ type: 'Advantage', name_or_title: a.title, active: 1 }))
        ],
        ['type', 'name_or_title', 'active']
    );
    const showroomMediaCsv = convertArrayToCsv(showroomMedia, ['media_type', 'media_url', 'createdAt']);
    const savedCarsCsv = convertArrayToCsv(savedCars, ['wishlist_id', 'carId', 'brandName', 'carModel', 'selectYear', 'selling_price', 'totalPrice', 'carMileage', 'fuelType', 'saved_at']);
    const chatHistoryCsv = convertArrayToCsv(chatHistory, ['id', 'sendFrom', 'sendTo', 'sender_name', 'receiver_name', 'title', 'message_text', 'carId', 'brandName', 'carModel', 'isRead', 'createdAt']);
    const chatAttachmentsCsv = convertArrayToCsv(chatAttachments, ['id', 'user_id', 'attachment_url', 'attachment_type', 'original_name', 'file_size', 'created_at']);
    const notificationsCsv = convertArrayToCsv(userNotifications, ['id', 'title', 'body', 'notificationType', 'carId', 'brandName', 'carModel', 'isRead', 'createdAt']);
    const activityCsv = convertArrayToCsv(recentlyViewed, ['id', 'car_id', 'brandName', 'carModel', 'selectYear', 'selling_price', 'totalPrice', 'viewed_at']);
    const visitsCsv = convertArrayToCsv(physicalVisits, ['id', 'car_id', 'brandName', 'carModel', 'seller_id', 'user_id', 'full_name', 'email', 'phone_number', 'visit_date', 'visit_time', 'status', 'message', 'created_at']);
    const savedSearchesCsv = convertArrayToCsv(savedSearches, ['id', 'search_name', 'filters', 'is_active', 'created_at']);
    const savedReelsCsv = convertArrayToCsv(savedReels, ['id', 'userId', 'carId', 'brandName', 'carModel', 'reelType', 'createdAt']);
    const userUploadedReelsCsv = convertArrayToCsv(userUploadedReels, ['id', 'user_id', 'reel_url', 'captions', 'is_active', 'createdAt']);
    const purchaseAgreementsCsv = convertArrayToCsv(purchaseAgreements, ['id', 'status', 'seller_user_id', 'buyer_full_name', 'buyer_phone', 'make', 'model', 'vin', 'purchase_price', 'handover_date', 'created_at']);
    const purchasesCsv = convertArrayToCsv(purchases, ['id', 'user_id', 'plan_id', 'plan_name', 'purchased_slots', 'prorated_price', 'purchase_date', 'payment_status', 'plan_type', 'transaction_id']);
    const plansAndSlotsCsv = convertArrayToCsv(
        [
            ...userPlans.map(up => ({ entry_type: 'Active Plan', id: up.id, name: up.plan_name, price: up.plan_price, total_slots: up.total_slots, start_date: up.start_date, end_date: up.end_date, status: up.is_active ? 'Active' : 'Inactive' })),
            ...slotRequests.map(sr => ({ entry_type: 'Slot Request', id: sr.id, name: 'Additional Slots', price: sr.approved_price, total_slots: sr.requested_slots, start_date: sr.created_at, end_date: '', status: sr.status }))
        ],
        ['entry_type', 'id', 'name', 'price', 'total_slots', 'start_date', 'end_date', 'status']
    );
    const listedCarsCsv = convertArrayToCsv(listedCars, ['id', 'brandName', 'carModel', 'selectYear', 'selling_price', 'totalPrice', 'carMileage', 'fuelType', 'transmission', 'body_type', 'listing_status', 'is_active', 'created_at']);
    const supportTicketsCsv = convertArrayToCsv(supportTickets, ['id', 'user_id', 'issue', 'admin_response', 'status', 'created_at']);
    const helpRequestsCsv = convertArrayToCsv(helpRequests, ['id', 'user_id', 'full_name', 'email', 'description', 'created_at']);
    const appFeedbackCsv = convertArrayToCsv(appFeedbacks, ['id', 'seller_id', 'rating', 'message', 'created_at']);
    const reportedCarsCsv = convertArrayToCsv(reportedCars, ['id', 'car_id', 'brandName', 'carModel', 'reasons', 'custom_message', 'status', 'created_at']);

    // Readme file
    const readmeContent = `=====================================================
CARZONE - USER DATA EXPORT ARCHIVE
=====================================================
Export Timestamp: ${new Date().toISOString()}
User ID: ${userId}
User Full Name: ${user.fullName || 'N/A'}
User Email: ${userEmail}
Account Type: ${user.account_type || 'N/A'}

Archive Contents:
-----------------
1. profile_details.csv          - Complete user personal and account profile
2. user_roles.csv               - Account roles (Buyer / Seller / Dealer)
3. notification_settings.csv    - Push and alert preferences
4. seller_opening_times.csv     - Showroom working hours (if seller)
5. seller_team_members.csv      - Team members and contacts (if seller)
6. seller_services_advantages.csv- Dealer services and advantages
7. seller_showroom_media.csv    - Showroom photos and promo videos
8. saved_cars.csv               - Wishlisted and saved cars
9. chat_history.csv             - Direct chat messages and car inquiries
10. chat_attachments.csv        - Uploaded chat media (images, docs, videos)
11. notifications.csv           - System and vehicle alerts
12. recently_viewed_cars.csv    - Vehicle browsing history
13. physical_visits.csv         - Test-drive and showroom visit bookings
14. saved_searches.csv          - Saved search filters and criteria
15. saved_reels.csv             - Saved video reels
16. user_uploaded_reels.csv     - Reels uploaded by the user
17. purchase_agreements.csv     - Vehicle purchase agreements and contracts
18. purchases_and_transactions.csv - Stripe invoices and payment transactions
19. plans_and_slots.csv         - Plan subscriptions and slot requests
20. my_listed_cars.csv          - Vehicles listed for sale by the user
21. support_tickets.csv         - Customer support tickets
22. help_requests.csv           - Help and inquiry requests
23. app_feedback.csv            - User submitted app feedback
24. reported_cars.csv           - Listing reports submitted by user

=====================================================
`;

    // Package all CSVs into Zip Buffer
    const zipFiles = [
        { name: 'README.txt', content: readmeContent },
        { name: 'profile_details.csv', content: profileCsv },
        { name: 'user_roles.csv', content: rolesCsv },
        { name: 'notification_settings.csv', content: notifSettingsCsv },
        { name: 'seller_opening_times.csv', content: openingTimesCsv },
        { name: 'seller_team_members.csv', content: teamMembersCsv },
        { name: 'seller_services_advantages.csv', content: servicesAdvantagesCsv },
        { name: 'seller_showroom_media.csv', content: showroomMediaCsv },
        { name: 'saved_cars.csv', content: savedCarsCsv },
        { name: 'chat_history.csv', content: chatHistoryCsv },
        { name: 'chat_attachments.csv', content: chatAttachmentsCsv },
        { name: 'notifications.csv', content: notificationsCsv },
        { name: 'recently_viewed_cars.csv', content: activityCsv },
        { name: 'physical_visits.csv', content: visitsCsv },
        { name: 'saved_searches.csv', content: savedSearchesCsv },
        { name: 'saved_reels.csv', content: savedReelsCsv },
        { name: 'user_uploaded_reels.csv', content: userUploadedReelsCsv },
        { name: 'purchase_agreements.csv', content: purchaseAgreementsCsv },
        { name: 'purchases_and_transactions.csv', content: purchasesCsv },
        { name: 'plans_and_slots.csv', content: plansAndSlotsCsv },
        { name: 'my_listed_cars.csv', content: listedCarsCsv },
        { name: 'support_tickets.csv', content: supportTicketsCsv },
        { name: 'help_requests.csv', content: helpRequestsCsv },
        { name: 'app_feedback.csv', content: appFeedbackCsv },
        { name: 'reported_cars.csv', content: reportedCarsCsv }
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

    console.log(`[userDataExport] User data ZIP successfully sent to ${userEmail}`);
    return { success: true, email: userEmail, fileName };
};
