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

    // 2. Fetch User Profile & Roles & Settings & Seller Data
    const roles = await safeQuery("SELECT role, seller_type, is_active, created_at, updated_at FROM tbl_roles WHERE user_id = ?", [userId]);
    const notifSettings = await safeQuery("SELECT * FROM tbl_user_notification_settings WHERE user_id = ?", [userId]);
    const openingTimes = await safeQuery("SELECT day, morning_open_time, morning_close_time, afternoon_open_time, afternoon_close_time, is_closed FROM seller_opening_times WHERE user_id = ?", [userId]);
    const advantages = await safeQuery("SELECT title FROM seller_advantages WHERE user_id = ?", [userId]);
    const services = await safeQuery("SELECT service_name, isActive FROM seller_services WHERE user_id = ?", [userId]);
    const teamMembers = await safeQuery("SELECT fullName, role, phoneNumber, email, languages FROM seller_team_members WHERE user_id = ?", [userId]);

    // Sanitize user password / OTP from profile export
    const safeUserProfile = { ...user };
    delete safeUserProfile.password;
    delete safeUserProfile.code;
    delete safeUserProfile.forgotPasswordOtp;
    delete safeUserProfile.remember_token;

    // 3. Saved Cars / Wishlist
    const savedCars = await safeQuery(
        `SELECT w.id AS wishlist_id, w.carId, c.brandName, c.carModel, c.selectYear, c.totalPrice, c.selling_price, c.carMileage, c.fuelType, c.carColor, w.created_at AS saved_at
         FROM tbl_car_wishlist w
         LEFT JOIN tbl_cars c ON w.carId = c.id
         WHERE w.user_id = ?`,
        [userId]
    );

    // 4. Chat History & Attachments
    const chatAttachments = await safeQuery(
        "SELECT id, user_id, attachment_url, attachment_type, original_name, file_size, createdAt FROM tbl_chat_attachments WHERE user_id = ?",
        [userId]
    );

    const chatNotifications = await safeQuery(
        `SELECT id, sendFrom, sendTo, notificationType, title, body AS message, carId, isRead, createdAt
         FROM tbl_notification
         WHERE (sendTo = ? OR sendFrom = ?)
         ORDER BY id DESC`,
        [userId, userId]
    );

    // 5. Activity Information
    const recentlyViewed = await safeQuery(
        `SELECT rv.id, rv.car_id, c.brandName, c.carModel, c.selectYear, c.totalPrice, rv.viewed_at
         FROM tbl_recently_viewed rv
         LEFT JOIN tbl_cars c ON rv.car_id = c.id
         WHERE rv.user_id = ?
         ORDER BY rv.id DESC`,
        [userId]
    );

    const savedSearches = await safeQuery(
        "SELECT id, user_id, search_name, filters, is_active, created_at, updated_at FROM tbl_saved_searches WHERE user_id = ?",
        [userId]
    );

    const savedReels = await safeQuery(
        "SELECT * FROM tbl_saved_car_reels WHERE userId = ?",
        [userId]
    );

    const physicalVisits = await safeQuery(
        `SELECT id, car_id, seller_id, user_id, full_name, email, phone_number, visit_date, visit_time, status, message, created_at
         FROM tbl_physical_visits
         WHERE user_id = ? OR seller_id = ?
         ORDER BY id DESC`,
        [userId, userId]
    );

    const userReels = await safeQuery(
        "SELECT id, user_id, reel_url, captions, createdAt FROM users_reels WHERE user_id = ?",
        [userId]
    );

    const supportTickets = await safeQuery(
        "SELECT id, user_id, issue, is_delete, created_at FROM tbl_support WHERE user_id = ?",
        [userId]
    );

    const helpRequests = await safeQuery(
        "SELECT id, user_id, full_name, email, description, created_at FROM tbl_help_support WHERE user_id = ?",
        [userId]
    );

    const appFeedbacks = await safeQuery(
        "SELECT id, seller_id, rating, message, created_at FROM tbl_app_feedback WHERE seller_id = ?",
        [userId]
    );

    const userPlans = await safeQuery(
        `SELECT up.id, up.user_id, up.plan_id, up.start_date, up.end_date, up.total_slots, up.is_active, p.name AS plan_name, p.price AS plan_price
         FROM tbl_user_plans up
         LEFT JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ?`,
        [userId]
    );

    const slotRequests = await safeQuery(
        "SELECT id, user_id, requested_slots, message, status, duration_type, created_at FROM slot_requests WHERE user_id = ?",
        [userId]
    );

    // 6. Listed Cars (if user has listed cars)
    const listedCars = await safeQuery(
        "SELECT * FROM tbl_cars WHERE user_id = ? ORDER BY id DESC",
        [userId]
    );

    // 7. Generate CSV contents
    const profileCsv = convertArrayToCsv([safeUserProfile]);
    const rolesCsv = convertArrayToCsv(roles, ['role', 'seller_type', 'is_active', 'created_at']);
    const notifSettingsCsv = convertArrayToCsv(notifSettings, ['user_id', 'email_notifications', 'push_notifications', 'chat_messages']);
    const openingTimesCsv = convertArrayToCsv(openingTimes, ['day', 'morning_open_time', 'morning_close_time', 'afternoon_open_time', 'afternoon_close_time', 'is_closed']);
    const teamMembersCsv = convertArrayToCsv(teamMembers, ['fullName', 'role', 'phoneNumber', 'email', 'languages']);
    const savedCarsCsv = convertArrayToCsv(savedCars, ['wishlist_id', 'carId', 'brandName', 'carModel', 'selectYear', 'totalPrice', 'carMileage', 'fuelType', 'carColor', 'saved_at']);
    const chatHistoryCsv = convertArrayToCsv(chatNotifications, ['id', 'sendFrom', 'sendTo', 'notificationType', 'title', 'message', 'carId', 'isRead', 'createdAt']);
    const chatAttachmentsCsv = convertArrayToCsv(chatAttachments, ['id', 'user_id', 'attachment_url', 'attachment_type', 'original_name', 'file_size', 'createdAt']);
    const activityCsv = convertArrayToCsv(recentlyViewed, ['id', 'car_id', 'brandName', 'carModel', 'selectYear', 'totalPrice', 'viewed_at']);
    const visitsCsv = convertArrayToCsv(physicalVisits, ['id', 'car_id', 'seller_id', 'user_id', 'full_name', 'email', 'phone_number', 'visit_date', 'visit_time', 'status', 'message', 'created_at']);
    const savedSearchesCsv = convertArrayToCsv(savedSearches, ['id', 'user_id', 'search_name', 'filters', 'is_active', 'created_at']);
    const savedReelsCsv = convertArrayToCsv(savedReels, ['id', 'userId', 'carId', 'reelType']);
    const supportTicketsCsv = convertArrayToCsv(supportTickets, ['id', 'user_id', 'issue', 'is_delete', 'created_at']);
    const plansCsv = convertArrayToCsv(userPlans, ['id', 'user_id', 'plan_id', 'start_date', 'end_date', 'total_slots', 'is_active', 'plan_name', 'plan_price']);
    const listedCarsCsv = convertArrayToCsv(listedCars, ['id', 'brandName', 'carModel', 'selectYear', 'selling_price', 'totalPrice', 'carMileage', 'fuelType', 'is_active', 'listing_status', 'createdAt']);

    // Readme file explaining the archive
    const readmeContent = `=====================================================
CARZONE - USER DATA EXPORT ARCHIVE
=====================================================
Export Timestamp: ${new Date().toISOString()}
User ID: ${userId}
User Full Name: ${user.fullName || 'N/A'}
User Email: ${userEmail}

Archive Contents:
-----------------
1. profile_details.csv      - Complete user personal and account profile
2. user_roles.csv           - Account roles (Buyer / Seller / Dealer)
3. notification_settings.csv- Push, email, and chat alert preferences
4. seller_opening_times.csv - Showroom working hours (if seller)
5. seller_team_members.csv  - Team members and contacts (if seller)
6. saved_cars.csv           - Wishlisted and saved cars
7. chat_history.csv         - Chat messages and notifications
8. chat_attachments.csv     - Uploaded chat media metadata
9. recently_viewed_cars.csv - Activity history of recently viewed cars
10. physical_visits.csv     - Test-drive and physical visit requests
11. saved_searches.csv      - Saved search filters and criteria
12. saved_reels.csv         - Saved video reels
13. support_tickets.csv     - Customer support requests
14. plans_and_slots.csv     - Plan subscriptions and quotas
15. my_listed_cars.csv      - Vehicles listed for sale by the user

=====================================================
`;

    // 8. Package all CSVs into Zip Buffer
    const zipFiles = [
        { name: 'README.txt', content: readmeContent },
        { name: 'profile_details.csv', content: profileCsv },
        { name: 'user_roles.csv', content: rolesCsv },
        { name: 'notification_settings.csv', content: notifSettingsCsv },
        { name: 'seller_opening_times.csv', content: openingTimesCsv },
        { name: 'seller_team_members.csv', content: teamMembersCsv },
        { name: 'saved_cars.csv', content: savedCarsCsv },
        { name: 'chat_history.csv', content: chatHistoryCsv },
        { name: 'chat_attachments.csv', content: chatAttachmentsCsv },
        { name: 'recently_viewed_cars.csv', content: activityCsv },
        { name: 'physical_visits.csv', content: visitsCsv },
        { name: 'saved_searches.csv', content: savedSearchesCsv },
        { name: 'saved_reels.csv', content: savedReelsCsv },
        { name: 'support_tickets.csv', content: supportTicketsCsv },
        { name: 'plans_and_slots.csv', content: plansCsv },
        { name: 'my_listed_cars.csv', content: listedCarsCsv }
    ];

    const zipBuffer = await createZipBuffer(zipFiles);
    const dateFormatted = new Date().toISOString().slice(0, 10);
    const fileName = `CarZone_UserData_${userId}_${dateFormatted}.zip`;

    // 9. Build Email HTML from template
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
