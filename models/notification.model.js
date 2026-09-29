import db from '../config/db.js';

export const getAllUserFcmTokensModel = async (excludeUserId = null) => {
    let query = `
        SELECT
            id,
            fcmToken,
            language
        FROM tbl_users
        WHERE fcmToken IS NOT NULL
          AND TRIM(fcmToken) != ''
    `;
    const params = [];
    if (excludeUserId) {
        query += ` AND id != ?`;
        params.push(excludeUserId);
    }
    const result = await db.query(query, params);
    return result;
};

export const getUserById = async (user_id) => {
    try {
        const query = `
            SELECT
                id,
                fullName,
                email,
                fcmToken,
                language
            FROM tbl_users
            WHERE id = ?
            LIMIT 1
        `;
        const result = await db.query(query, [user_id]);
        return result?.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("getUserById error:", error);
        throw error;
    }
};

export const getUserFcmTokenModel = async (userId) => {
    try {
        const query = `
            SELECT
                id,
                fullName,
                email,
                fcmToken,
                language
            FROM tbl_users
            WHERE id = ?
            LIMIT 1
        `;
        const result = await db.query(query, [userId]);
        return result?.length > 0 ? result[0] : null;
    } catch (error) {
        console.error("getUserFcmTokenModel error:", error);
        throw error;
    }
};