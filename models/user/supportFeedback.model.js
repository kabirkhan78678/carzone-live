import db from '../../config/db.js';

export const createSupportModel = async ({
    user_id,
    issue
}) => {
    return await db.query(
        `
        INSERT INTO tbl_support
        (
            user_id,
            issue
        )
        VALUES
        (
            ?,
            ?
        )
        `,
        [
            user_id,
            issue
        ]
    );
};

export const getMySupportTicketsModel = async (
    user_id
) => {
    return await db.query(
        `
        SELECT
        *
        FROM tbl_support
        WHERE
        user_id=?
        AND
        is_delete=0
        ORDER BY id DESC
        `,
        [user_id]
    );
};

export const getMySupportTicketByIdModel = async (user_id, ticket_id) => {
    const rows = await db.query(
        `
        SELECT
            *
        FROM tbl_support
        WHERE
            id = ?
            AND user_id = ?
            AND is_delete = 0
        `,
        [ticket_id, user_id]
    );
    return rows[0] || null;
};

export const getMyFeedbackByIdModel = async (seller_id, feedback_id) => {
    const rows = await db.query(
        `SELECT id, rating, message, created_at
         FROM tbl_app_feedback
         WHERE id = ? AND seller_id = ? AND is_delete = 0`,
        [feedback_id, seller_id]
    );
    return rows[0] || null;
};

export const checkSellerFeedbackModel = async (seller_id) => {
    return db.query(
        `SELECT id, rating, message, created_at FROM tbl_app_feedback WHERE seller_id = ? AND is_delete = 0`,
        [seller_id]
    );
};

export const submitAppFeedbackModel = async (data) => {
    const { seller_id, rating, message } = data;

    return db.query(
        `INSERT INTO tbl_app_feedback (seller_id, rating, message)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating), message = VALUES(message), is_delete = 0`,
        [seller_id, rating, message || null]
    );
};

export const updateAppFeedbackModel = async (data) => {
    const { seller_id, rating, message } = data;

    return db.query(
        `UPDATE tbl_app_feedback
         SET rating = ?, message = ?, is_delete = 0
         WHERE seller_id = ?`,
        [rating, message || null, seller_id]
    );
};

export const getMyFeedbackModel = async (seller_id) => {
    const rows = await db.query(
        `SELECT id, rating, message, created_at
         FROM tbl_app_feedback
         WHERE seller_id = ? AND is_delete = 0`,
        [seller_id]
    );
    return rows[0] || null;
};

export const submitHelpRequestModel = async (data) => {
    const { user_id, full_name, email, description } = data;

    return db.query(
        `INSERT INTO tbl_help_support
         (user_id, full_name, email, description)
         VALUES (?, ?, ?, ?)`,
        [user_id || null, full_name, email, description]
    );
};

export const reportCarModel = async (data) => {
    const {
        car_id,
        user_id,
        reasons,
        custom_message
    } = data;

    return db.query(
        `INSERT INTO tbl_report_car
         (car_id, user_id, reasons, custom_message)
         VALUES (?, ?, ?, ?)`,
        [
            car_id,
            user_id,
            JSON.stringify(reasons),
            custom_message || null
        ]
    );
};

export const fetchReportReasons = async (lang) => {
    const allowedLangs = ["en", "it", "de", "fr"];
    const selectedLang = allowedLangs.includes(lang) ? lang : "en";

    return db.query(
        `SELECT id, ${selectedLang} AS label 
         FROM tbl_report_translations 
         WHERE is_active = 1`
    );
};

export const validateReportReasonIds = async (ids) => {
    if (!ids.length) return [];

    const placeholders = ids.map(() => "?").join(",");

    const rows = await db.query(
        `SELECT id FROM tbl_report_translations 
         WHERE id IN (${placeholders}) AND is_active = 1`,
        ids
    );

    return rows.map(r => r.id);
};
