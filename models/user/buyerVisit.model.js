import db from '../../config/db.js';

export const checkDuplicatePhysicalVisitModel = async ({
    car_id,
    user_id,
    email,
    visit_date,
    visit_time
}) => {
    return db.query(
        `SELECT id 
     FROM tbl_physical_visits
     WHERE car_id = ?
       AND visit_date = ?
       AND visit_time = ?
       AND (
         (user_id IS NOT NULL AND user_id = ?)
         OR
         (user_id IS NULL AND email = ?)
       )
       AND status != 'rejected'
     LIMIT 1`,
        [
            car_id,
            visit_date,
            visit_time,
            user_id,
            email
        ]
    );
};

export const appendPhysicalVisitFilters = ({
    query,
    params,
    ownerId,
    visitId,
    status,
    search
}) => {
    let sql = `${query} WHERE 1 = 1`;

    if (ownerId !== undefined && ownerId !== null) {
        sql += ` AND pv.seller_id = ?`;
        params.push(ownerId);
    }

    if (visitId !== undefined && visitId !== null) {
        sql += ` AND pv.id = ?`;
        params.push(visitId);
    }

    if (status) {
        sql += ` AND pv.status = ?`;
        params.push(status);
    }

    if (search && String(search).trim()) {
        const like = `%${String(search).trim()}%`;
        sql += ` AND (
            CONCAT(IFNULL(c.brandName, ''), ' ', IFNULL(c.carModel, '')) LIKE ?
            OR COALESCE(NULLIF(pv.full_name, ''), request_user.fullName, '') LIKE ?
            OR COALESCE(NULLIF(pv.email, ''), request_user.email, '') LIKE ?
        )`;
        params.push(like, like, like);
    }

    return sql;
};

export const getMySentPhysicalVisitsModel = async (
    user_id,
    options = {}
) => {

    const {
        id = null,
        status = null,
        search = null
    } = options;

    const params = [user_id];

    let query = `
        SELECT
            pv.id,
            pv.car_id,
            pv.visit_date,
            pv.visit_time,
            pv.message,
            pv.status,
            pv.created_at,
            pv.rescheduled_date,
            pv.rescheduled_time,
            pv.buyer_side_status,
            c.id AS vehicle_id,
            c.brandName,
            c.carModel,
            c.selling_price,
            YEAR(c.first_registration_date) AS registration_year,
            c.carMileage,
 
            (
                SELECT ci.images
                FROM tbl_cars_images ci
                WHERE ci.carId = c.id
                ORDER BY ci.id ASC
                LIMIT 1
            ) AS car_image,
 
            u.id AS seller_id,
            u.fullName AS seller_name,
            u.email AS seller_email,
            u.phoneNumber AS seller_phone,
            u.profileImage AS seller_profile_image
 
        FROM tbl_physical_visits pv
 
        INNER JOIN tbl_cars c
            ON c.id = pv.car_id
 
        INNER JOIN tbl_users u
            ON u.id = pv.seller_id
 
        WHERE pv.user_id = ?
    `;

    if (id) {
        query += ` AND pv.id = ?`;
        params.push(id);
    }

    if (status) {
        query += ` AND pv.status = ?`;
        params.push(status);
    }

    if (search) {
        query += `
            AND (
                c.brandName LIKE ?
                OR c.carModel LIKE ?
                OR u.fullName LIKE ?
            )
        `;

        params.push(
            `%${search}%`,
            `%${search}%`,
            `%${search}%`
        );
    }

    query += ` ORDER BY pv.created_at DESC`;

    return db.query(query, params);
};

export const getMySentPhysicalVisitsCountModel = async (
    user_id,
    options = {}
) => {

    const {
        status = null,
        search = null
    } = options;

    const params = [user_id];

    let query = `
        SELECT COUNT(*) AS total
 
        FROM tbl_physical_visits pv
 
        INNER JOIN tbl_cars c
            ON c.id = pv.car_id
 
        INNER JOIN tbl_users u
            ON u.id = pv.seller_id
 
        WHERE pv.user_id = ?
    `;

    if (status) {
        query += ` AND pv.status = ?`;
        params.push(status);
    }

    if (search) {
        query += `
            AND (
                c.brandName LIKE ?
                OR c.carModel LIKE ?
                OR u.fullName LIKE ?
            )
        `;

        params.push(
            `%${search}%`,
            `%${search}%`,
            `%${search}%`
        );
    }

    return db.query(query, params);
};

export const reschedulePhysicalVisitModel = async ({
    visit_id,
    seller_id,
    preferred_date,
    preferred_time,
    seller_note
}) => {
    return db.query(
        `
        UPDATE tbl_physical_visits
        SET
            rescheduled_date = ?,
            rescheduled_time = ?,
            seller_note = ?,
            status = 'confirmed',
            buyer_side_status = 'reschedule'
        WHERE id = ?
        AND seller_id = ?
        `,
        [
            preferred_date,
            preferred_time,
            seller_note || null,
            visit_id,
            seller_id
        ]
    );
};
