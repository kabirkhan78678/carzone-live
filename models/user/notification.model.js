import db from '../../config/db.js';
import { normalizeMySQLDate } from '../../utils/DateConvertor.js';
import moment from 'moment';

export const insertUserNotifications = async (message, status) => {
    try {
        const result = await db.query(
            `INSERT INTO tbl_notification (sendFrom, sendTo, title, body, notificationType, notificationStatus, carId, isSendTo, purchaseAgreementId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                message.data?.sendFrom || null,
                message.data?.sendTo || null,
                message.notification?.title || '',
                message.notification?.body || '',
                message.data?.notificationType || null,
                status || 'sent',
                message.data?.carId || null,
                message.data?.isSendTo || null,
                message.data?.purchaseAgreementId || null
            ]
        );
        return result;
    } catch (error) {
        console.error("Database Insert Error:", error);
        return null;
    }
};

export const fetchAllBuyerWhereNotificationOn = async (id) => {
    return db.query(`
        SELECT * FROM tbl_roles 
        JOIN tbl_users ON tbl_users.id = tbl_roles.user_id
        WHERE user_id != ? 
          AND role = 'buyer'
          AND isNotification = 1
    `, [id]);
};

export const modelfetchNotificationByBuyersIds = async (id, userType) => {
    return db.query(`
        SELECT * FROM tbl_notification 
        WHERE sendTo = ? 
          AND (notificationType IS NULL OR LOWER(notificationType) != 'chat')
        ORDER BY id DESC
    `, [id]);
};

export const fetchUsersToNotifyForCarListing = async () => {
    const rows = await db.query(`
        SELECT * FROM tbl_users
        WHERE isNotification = 1 AND status = 1 AND is_deleted = 0
    `);
    return rows;
};

export const readAllNotificationsModel = async (userId) => {
    return db.query("UPDATE tbl_notification SET isRead = 1 WHERE sendTo = ?", [userId]);
};

export const readAllNotificationsModelByIdModel = async (notificationId) => {
    return db.query("UPDATE tbl_notification SET isRead = 1 WHERE id = ?", [notificationId]);
};

export const removeAllNotificationByCurrentUserId = async (id) => {
    return db.query("DELETE FROM tbl_notification WHERE sendTo = ?", [id]);
};

export const removeCarFromNotificationModelbyNotificationId = async (id) => {
    return db.query("DELETE FROM tbl_notification WHERE id = ?", [id]);
};

export const getUserFcmToken = async (userId) => {
    try {
        const query = `
            SELECT id, fullName, email, fcmToken, language
            FROM tbl_users
            WHERE id = ?
            LIMIT 1
        `;
        const result = await db.query(query, [userId]);
        return result?.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("getUserFcmToken error:", error);
        return null;
    }
};

export const getAllUserFcmTokens = async (excludeUserId = null) => {
    try {
        let query = `
            SELECT id, fcmToken, language
            FROM tbl_users
            WHERE fcmToken IS NOT NULL AND TRIM(fcmToken) != ''
        `;
        const params = [];
        if (excludeUserId) {
            query += ` AND id != ?`;
            params.push(excludeUserId);
        }
        return await db.query(query, params);
    } catch (error) {
        console.error("getAllUserFcmTokens error:", error);
        return [];
    }
};

export const getUserFcmTokenModel = getUserFcmToken;
export const getAllUserFcmTokensModel = getAllUserFcmTokens;

/**
 * Get all user IDs who have saved a specific vehicle in their favorites/wishlist
 */
export const getUsersWhoFavoritedCar = async (carId) => {
    try {
        const rows = await db.query(
            `SELECT DISTINCT w.user_id, u.fcmToken, u.language, u.isNotification
             FROM tbl_car_wishlist w
             JOIN tbl_users u ON u.id = w.user_id
             WHERE w.carId = ? AND u.is_deleted = 0`,
            [carId]
        );
        return rows || [];
    } catch (err) {
        console.error('getUsersWhoFavoritedCar error:', err);
        return [];
    }
};

/**
 * Find confirmed physical visits scheduled in ~24 hours that haven't had a 24h reminder sent
 */
export const getConfirmedVisitsNeeding24hReminder = async () => {
    try {
        const rows = await db.query(`
            SELECT 
                pv.id,
                pv.car_id,
                pv.seller_id,
                pv.user_id AS buyer_id,
                pv.full_name AS buyer_name,
                pv.visit_date,
                pv.visit_time,
                pv.rescheduled_date,
                pv.rescheduled_time,
                c.brandName,
                c.carModel,
                u_seller.fullName AS seller_name
            FROM tbl_physical_visits pv
            LEFT JOIN tbl_cars c ON c.id = pv.car_id
            LEFT JOIN tbl_users u_seller ON u_seller.id = pv.seller_id
            WHERE pv.status = 'confirmed'
              AND (pv.reminder_24h_sent IS NULL OR pv.reminder_24h_sent = 0)
        `);

        if (!rows || !rows.length) return [];

        const tomorrowStr = moment().add(1, 'day').format('YYYY-MM-DD');

        return rows.filter((pv) => {
            const rawDate = pv.rescheduled_date || pv.visit_date;
            const normalized = normalizeMySQLDate(rawDate);
            return normalized === tomorrowStr;
        });
    } catch (err) {
        console.error('getConfirmedVisitsNeeding24hReminder error:', err);
        return [];
    }
};

/**
 * Find confirmed physical visits scheduled for today that haven't had a day-of reminder sent
 */
export const getConfirmedVisitsNeedingDayOfReminder = async () => {
    try {
        const rows = await db.query(`
            SELECT 
                pv.id,
                pv.car_id,
                pv.seller_id,
                pv.user_id AS buyer_id,
                pv.full_name AS buyer_name,
                pv.visit_date,
                pv.visit_time,
                pv.rescheduled_date,
                pv.rescheduled_time,
                c.brandName,
                c.carModel,
                u_seller.fullName AS seller_name
            FROM tbl_physical_visits pv
            LEFT JOIN tbl_cars c ON c.id = pv.car_id
            LEFT JOIN tbl_users u_seller ON u_seller.id = pv.seller_id
            WHERE pv.status = 'confirmed'
              AND (pv.reminder_day_sent IS NULL OR pv.reminder_day_sent = 0)
        `);

        if (!rows || !rows.length) return [];

        const todayStr = moment().format('YYYY-MM-DD');

        return rows.filter((pv) => {
            const rawDate = pv.rescheduled_date || pv.visit_date;
            const normalized = normalizeMySQLDate(rawDate);
            return normalized === todayStr;
        });
    } catch (err) {
        console.error('getConfirmedVisitsNeedingDayOfReminder error:', err);
        return [];
    }
};

export const markVisit24hReminderSent = async (visitId) => {
    return db.query(`UPDATE tbl_physical_visits SET reminder_24h_sent = 1 WHERE id = ?`, [visitId]);
};

export const markVisitDayReminderSent = async (visitId) => {
    return db.query(`UPDATE tbl_physical_visits SET reminder_day_sent = 1 WHERE id = ?`, [visitId]);
};

/**
 * Get incomplete draft listings created > 24 hours ago that haven't received a draft reminder
 */
export const getDraftCarsNeedingReminder = async () => {
    try {
        const rows = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                c.brandName,
                c.carModel,
                c.created_at
            FROM tbl_cars c
            WHERE c.listing_status = 'draft'
              AND c.is_deleted = 0
              AND c.draft_reminder_sent = 0
              AND c.created_at <= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);
        return rows || [];
    } catch (err) {
        console.error('getDraftCarsNeedingReminder error:', err);
        return [];
    }
};

export const markDraftReminderSent = async (carId) => {
    return db.query(`UPDATE tbl_cars SET draft_reminder_sent = 1 WHERE id = ?`, [carId]);
};

/**
 * Get active vehicles needing monthly availability check-in for the seller
 * (Sent separately for each active vehicle and only once per month)
 */
export const getActiveCarsNeedingMonthlyReminder = async () => {
    try {
        const rows = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                c.brandName,
                c.carModel,
                c.totalPrice,
                c.selling_price,
                c.created_at,
                c.last_monthly_reminder_at
            FROM tbl_cars c
            WHERE c.is_active = 1
              AND c.is_deleted = 0
              AND c.listing_status = 'published'
              AND (
                  (c.last_monthly_reminder_at IS NULL AND c.created_at <= DATE_SUB(NOW(), INTERVAL 30 DAY))
                  OR (c.last_monthly_reminder_at <= DATE_SUB(NOW(), INTERVAL 30 DAY))
              )
        `);
        return rows || [];
    } catch (err) {
        console.error('getActiveCarsNeedingMonthlyReminder error:', err);
        return [];
    }
};

export const markMonthlyCarReminderSent = async (carId) => {
    return db.query(`UPDATE tbl_cars SET last_monthly_reminder_at = NOW() WHERE id = ?`, [carId]);
};


