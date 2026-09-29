import db from '../../config/db.js';

export const getAppFeedbackListModel = async ({
    page = 1,
    limit = 20,
    search = "",
    account_type = ""
}) => {

    const offset = (page - 1) * limit;

    let where = `WHERE af.is_delete = 0`;
    const params = [];

    if (search) {
        where += `
            AND (
                u.fullName LIKE ?
                OR u.email LIKE ?
            )
        `;

        const keyword = `%${search}%`;
        params.push(keyword, keyword);
    }

    if (account_type) {
        where += ` AND u.account_type = ?`;
        params.push(account_type);
    }

    const feedback = await db.query(
        `
        SELECT
            af.id AS feedback_id,
            af.rating,
            af.message,
            af.created_at,

            u.id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type

        FROM tbl_app_feedback af
        INNER JOIN tbl_users u
            ON af.seller_id = u.id

        ${where}

        ORDER BY af.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
    );

    const countResult = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_app_feedback af
        INNER JOIN tbl_users u
            ON af.seller_id = u.id

        ${where}
        `,
        params
    );

    return {
        total: countResult[0]?.total || 0,
        data: feedback
    };
};

export const getSupportListModel = async ({
    page = 1,
    limit = 20,
    search = "",
    status = "",
    account_type = ""
}) => {
    const offset = (page - 1) * limit;
    let where = `
        WHERE s.is_delete = 0
    `;
    const params = [];
    if (search) {
        where += `
            AND
            (
                u.fullName LIKE ?
                OR u.email LIKE ?
                OR s.issue LIKE ?
            )
        `;
        const keyword = `%${search}%`;
        params.push(
            keyword,
            keyword,
            keyword
        );
    }

    if (status) {
        where += `
            AND s.status = ?
        `;
        params.push(status);
    }

    if (account_type) {
        where += `
            AND u.account_type = ?
        `;
      params.push(account_type);
    }

    const data = await db.query(
        `
        SELECT
            s.id,
            s.issue,
            s.admin_response,
            s.status,
            s.created_at,
            u.id AS user_id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type
        FROM tbl_support s
        INNER JOIN tbl_users u
        ON s.user_id=u.id
        ${where}
        ORDER BY s.id DESC
        LIMIT ?
        OFFSET ?
        `,
        [
            ...params,
            limit,
            offset
        ]
    );

    const total = await db.query(
      `
        SELECT
        COUNT(*) total
        FROM tbl_support s
        INNER JOIN tbl_users u
        ON s.user_id=u.id
        ${where}
        `,
        params
    );
    return {
        total: total[0]?.total || 0,
        data
    };
};

export const getSupportByIdModel = async (id) => {
    const result = await db.query(
        `
        SELECT
            s.*,
            u.id user_id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type
        FROM tbl_support s
        INNER JOIN tbl_users u
        ON s.user_id=u.id
        WHERE
        s.id=?
        AND
        s.is_delete=0
        `,
        [id]
    );

    return result[0];
};

export const updateSupportModel = async ({
    id,
    admin_response,
    status = 'resolved'
} = {}) => {
    return await db.query(
        `
        UPDATE tbl_support
        SET
        admin_response=?,
        status=?
        WHERE
        id=?
        `,
        [
            admin_response,
            status,
            id
        ]
    );
};

export const deleteSupportModel = async (id) => {
    return await db.query(
        `
        UPDATE tbl_support
        SET is_delete=1
        WHERE id=?
        `,
        [id]
    );
};

export const fetchSupportById = async (id) => {
    return await db.query(
        `
        SELECT *
        FROM tbl_support
        WHERE
        id=?
        AND
        is_delete=0
        `,
        [id]
    );
};

export const getAppFeedbackByIdModel = async (id) => {
    const result = await db.query(
        `
        SELECT
            af.id,
            af.rating,
            af.message,
            af.created_at,

            u.id AS user_id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type

        FROM tbl_app_feedback af

        INNER JOIN tbl_users u
            ON af.seller_id = u.id

        WHERE af.id = ?
         AND af.is_delete = 0
        `,
        [id]
    );

    return result[0];
};

export const deleteAppFeedbackModel = async (id) => {
    return await db.query(
        `
        UPDATE tbl_app_feedback
        SET is_delete = 1
        WHERE id = ?
        `,
        [id]
    );
};
