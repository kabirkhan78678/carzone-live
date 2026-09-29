import db from '../../config/db.js';

export const changeMfkCarStatusModel = async (mfk_status_override, id) => {
  return db.query(
    `UPDATE tbl_cars SET  mfk_status_override = ? WHERE id = ?`,
    [mfk_status_override, id]
  );
};


export const getReportedCarsModel = async ({
    page = 1,
    limit = 20,
    search = "",
    account_type = ""
}) => {

    const offset = (page - 1) * limit;

    let where = `WHERE rc.is_delete = 0`;
    const params = [];

    if (search) {
        where += `
            AND (
                u.fullName LIKE ?
                OR u.email LIKE ?
                OR c.carModel LIKE ?
                OR c.brandName LIKE ?
                OR c.registration_master_number LIKE ?
            )
        `;

        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (account_type) {
        where += ` AND u.account_type = ?`;
        params.push(account_type);
    }

    // Fetch reports
    const reports = await db.query(
        `
        SELECT
            rc.id AS report_id,
            rc.car_id,
            rc.user_id,
            rc.reasons,
            rc.created_at,
            rc.status,

            u.id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type,

            c.carModel,
            c.brandName,
            c.registration_master_number,
            c.selling_price

        FROM tbl_report_car rc

        LEFT JOIN tbl_users u
            ON rc.user_id = u.id

        LEFT JOIN tbl_cars c
            ON rc.car_id = c.id

        ${where}

        ORDER BY rc.created_at DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
    );

    // Attach images and reported reasons
    for (const report of reports) {

        // Car Images
        const images = await db.query(
            `
            SELECT
                id,
                images
            FROM tbl_cars_images
            WHERE carId = ?
            ORDER BY id ASC
            `,
            [report.car_id]
        );

        report.images = images || [];

        // Report Reasons (English)
        try {
            const reasonIds = Array.isArray(report.reasons)
                ? report.reasons
                : JSON.parse(report.reasons || "[]");

            report.reasonsCount = reasonIds.length;

            if (reasonIds.length > 0) {

                const placeholders = reasonIds.map(() => "?").join(",");

                const reasonList = await db.query(
                    `
                    SELECT en
                    FROM tbl_report_translations
                    WHERE is_active = 1
                    AND id IN (${placeholders})
                    `,
                    reasonIds
                );

                report.reported_as = reasonList.map(item => item.en);

            } else {
                report.reported_as = [];
            }

        } catch (error) {
            report.reasonsCount = 0;
            report.reported_as = [];
        }
    }

    // Total Count
    const countResult = await db.query(
        `
        SELECT COUNT(*) AS total

        FROM tbl_report_car rc

        LEFT JOIN tbl_users u
            ON rc.user_id = u.id

        LEFT JOIN tbl_cars c
            ON rc.car_id = c.id

        ${where}
        `,
        params
    );

    return {
        total: countResult[0]?.total || 0,
        data: reports || []
    };
};

export const getReportedCarByIdModel = async (id) => {

    const reports = await db.query(
        `
        SELECT
            rc.id AS report_id,
            rc.car_id,
            rc.user_id,
            rc.reasons,
            rc.custom_message,
            rc.created_at,
            rc.status,

            u.id,
            u.fullName,
            u.email,
            u.profileImage,
            u.account_type,

            c.carModel,
            c.brandName,
            c.registration_master_number,
            c.selling_price

        FROM tbl_report_car rc

        LEFT JOIN tbl_users u
            ON rc.user_id = u.id

        LEFT JOIN tbl_cars c
            ON rc.car_id = c.id

        WHERE rc.id = ?
          AND rc.is_delete = 0
        `,
        [id]
    );

    if (!reports.length) {
        return [];
    }

    const report = reports[0];

    // Car Images
    const images = await db.query(
        `
        SELECT
            id,
            images
        FROM tbl_cars_images
        WHERE carId = ?
        ORDER BY id ASC
        `,
        [report.car_id]
    );

    report.images = images || [];

    // Report Reasons (English)
    try {
        const reasonIds = Array.isArray(report.reasons)
            ? report.reasons
            : JSON.parse(report.reasons || "[]");

        report.reasonsCount = reasonIds.length;

        if (reasonIds.length > 0) {

            const placeholders = reasonIds.map(() => "?").join(",");

            const reasonList = await db.query(
                `
                SELECT en
                FROM tbl_report_translations
                WHERE is_active = 1
                AND id IN (${placeholders})
                `,
                reasonIds
            );

            report.reported_as = reasonList.map(item => item.en);

        } else {
            report.reported_as = [];
        }

    } catch (error) {
        report.reasonsCount = 0;
        report.reported_as = [];
    }

    return report;
};

export const deleteReportedCarModel = async (id) => {

    return await db.query(
        `
        UPDATE tbl_report_car
        SET is_delete = 1
        WHERE id = ?
        `,
        [id]
    );

};

export const updateReportedCarStatusModel = async (id, status) => {

    await db.query(
        `
        UPDATE tbl_report_car
        SET
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND is_delete = 0
        `,
        [status, id]
    );

    return true;
};
