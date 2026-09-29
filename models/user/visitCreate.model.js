import db from '../../config/db.js';
import { appendPhysicalVisitFilters } from './buyerVisit.model.js';

export const createPhysicalVisitModel = async (data) => {
    const {
        car_id,
        seller_id,
        user_id,
        full_name,
        email,
        phone_number,
        visit_date,
        visit_time,
        message
    } = data;

    return db.query(
        `INSERT INTO tbl_physical_visits
     (car_id, seller_id, user_id, full_name, email, phone_number, visit_date, visit_time, message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            car_id,
            seller_id,
            user_id,
            full_name,
            email,
            phone_number,
            visit_date,
            visit_time,
            message
        ]
    );
};

export const physicalVisitSelectClause = `
    SELECT
        pv.*,
        c.user_id AS listing_owner_id,
        c.brandName,
        c.carModel,
        c.selectYear,
        c.carMileage,
        c.selling_price,
        c.first_registration_date,
        c.new_price,
        c.listing_status,
        u.account_type AS listing_owner_account_type,
        u.isPhysicalVisitAllowed,
        (
            SELECT ci.images
            FROM tbl_cars_images ci
            WHERE ci.carId = c.id
            ORDER BY ci.id ASC
            LIMIT 1
        ) AS car_image,
        CONCAT(c.brandName, ' ', c.carModel, ' (', c.selectYear, ')') AS car_title,
        COALESCE(NULLIF(pv.full_name, ''), request_user.fullName) AS requester_name,
        COALESCE(NULLIF(pv.email, ''), request_user.email) AS requester_email,
        COALESCE(NULLIF(pv.phone_number, ''), request_user.phoneNumber) AS requester_phone,
        request_user.profileImage AS profile_photo 
`;

export const physicalVisitFromClause = `
    FROM tbl_physical_visits pv
    JOIN tbl_cars c ON c.id = pv.car_id
    JOIN tbl_users u ON u.id = c.user_id
    LEFT JOIN tbl_users request_user ON request_user.id = pv.user_id
`;

export const getPhysicalVisitByIdModel = async (visit_id) => {
    const params = [];
    const query = appendPhysicalVisitFilters({
        query: `${physicalVisitSelectClause} ${physicalVisitFromClause}`,
        params,
        visitId: visit_id
    });
    return db.query(query, params);
};
