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

export const checkSellerFeedbackModel = async (seller_id) => {
    return db.query(
        `SELECT id FROM tbl_app_feedback WHERE seller_id = ?`,
        [seller_id]
    );
};

export const submitAppFeedbackModel = async (data) => {
    const { seller_id, rating, message } = data;

    return db.query(
        `INSERT INTO tbl_app_feedback (seller_id, rating, message)
     VALUES (?, ?, ?)`,
        [seller_id, rating, message || null]
    );
};

export const submitHelpRequestModel = async (data) => {
    const { user_id, full_name, email, description } = data;

    return db.query(
        `INSERT INTO tbl_help_support
     (user_id, full_name, email, description)
     VALUES (?, ?, ?, ?)`,
        [user_id, full_name, email, description]
    );
};

export const reportCarModel = async (data) => {
    const {
        car_id,
        user_id,
        //full_name,
        //email,
        reasons,
        custom_message
    } = data;

    return db.query(
        `INSERT INTO tbl_report_car
     (car_id, user_id,reasons, custom_message)
     VALUES (?, ?, ?, ?)`,
        [
            car_id,
            user_id,
            // dont need full name and email
            //full_name,
            //email,
            JSON.stringify(reasons),
            custom_message || null
        ]
    );
};

// model by raj for get reports reason

export const fetchReportReasons = async (lang) => {

    const allowedLangs = ["en", "it", "de", "fr"];
    const selectedLang = allowedLangs.includes(lang) ? lang : "en";

    return db.query(
        `SELECT id, ${selectedLang} AS label 
     FROM tbl_report_translations 
     WHERE is_active = 1`
    );
};

// model by raj for validateReportReasonIds

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
