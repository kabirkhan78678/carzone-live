import db from '../../config/db.js';
import { updateUsersProfile } from './auth.model.js';

export const fetchUserByIdCount = async (
    userId,
    brandName,
    carModel,
    totalPrice,
    fuelType,
    carColor,
    sittingCapacity,
    sellerType,
    search,
    priceRange,
    transmission,
    min_mileage,
    max_mileage,
    min_year,
    max_year,
    unit,
    min_hp,
    max_hp,
    body_type,
    consumption,
    drive_type_id,
    mfk_warrenty_id,
    state_id,
    lang = "en"
) => {

    let sql = `
    SELECT COUNT(DISTINCT c.id) as total
    FROM tbl_cars c

    INNER JOIN tbl_users u 
      ON u.id = c.user_id

    WHERE c.user_id != ?
      AND c.is_active = 1
      AND c.is_deleted = 0
      AND c.listing_status = 'published'
    `;

    const params = [userId];

    const addIdFilter = (column, value) => {
        const ids = value.split(',').map(Number).filter(Boolean);
        if (ids.length) {
            sql += ` AND ${column} IN (${ids.map(() => '?').join(',')})`;
            params.push(...ids);
        }
    };

    const addMultiValueFilter = (column, value) => {
        const values = value.split(',').map(v => v.trim()).filter(Boolean);
        if (values.length) {
            sql += ` AND (${values.map(() => `${column} LIKE ?`).join(' OR ')})`;
            values.forEach(v => params.push(`%${v}%`));
        }
    };

    if (brandName && brandName.toLowerCase() !== 'all') addMultiValueFilter('c.brandName', brandName);
    if (carModel) addMultiValueFilter('c.carModel', carModel);
    if (carColor) addMultiValueFilter('c.carColor', carColor);
    if (consumption) addMultiValueFilter('c.consumption', consumption);

    if (fuelType) addIdFilter('c.fuel_type_id', fuelType);
    if (transmission) addIdFilter('c.transmission_id', transmission);
    if (body_type) addIdFilter('c.body_type_id', body_type);
    if (unit) addIdFilter('c.power_unit_id', unit);
    if (drive_type_id) addIdFilter('c.drive_type_id', drive_type_id);
    if (mfk_warrenty_id) addIdFilter('c.mfk_warrenty_id', mfk_warrenty_id);
    if (state_id) addIdFilter('c.state_id', state_id);

    if (sittingCapacity) {
        sql += ` AND c.sittingCapacity = ?`;
        params.push(Number(sittingCapacity));
    }

    if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        sql += ` AND (c.brandName LIKE ? OR c.carModel LIKE ?)`;
        params.push(term, term);
    }

    if (priceRange) {
        const [min, max] = priceRange
            .split(',')
            .map(p => Number(p.replace(/[^0-9.]/g, '')));
        if (!isNaN(min) && !isNaN(max)) {
            sql += `
            AND CAST(REPLACE(REPLACE(c.totalPrice, ',', ''), '₹', '') AS DECIMAL(15,2))
            BETWEEN ? AND ?
            `;
            params.push(min, max);
        }
    }

    if (min_mileage && max_mileage) {
        sql += ` AND CAST(c.carMileage AS UNSIGNED) BETWEEN ? AND ?`;
        params.push(min_mileage, max_mileage);
    }

    if (min_year && max_year) {
        sql += ` AND CAST(c.selectYear AS UNSIGNED) BETWEEN ? AND ?`;
        params.push(min_year, max_year);
    }

    if (min_hp && max_hp) {
        sql += ` AND COALESCE(c.power_ps, CAST(NULLIF(c.powerOutput, '') AS DECIMAL(15,2))) BETWEEN ? AND ?`;
        params.push(min_hp, max_hp);
    }

    return db.query(sql, params);
};

export const updateBusinessSellerDetails = async (data, userId) => {
    return updateUsersProfile(data, userId);
};

export const fetchSellerDetailsByUserId = async (userId) => {
    const sql = `
    SELECT 
      u.id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.whatsappNumber,
      u.profileImage,
      u.city,
      u.pincode,
      u.fullAddress,
      u.companyName,
      u.companyAddress,
      'seller' AS role,
      u.account_type AS seller_type,
      COALESCE(r.isBlocked, 0) AS isBlocked,
      COALESCE(r.is_active, 1) AS is_active
    FROM tbl_users u
    LEFT JOIN tbl_roles r
      ON r.user_id = u.id
     AND r.role = 'seller'
    WHERE u.id = ?
    LIMIT 1
  `;
    return db.query(sql, [userId]);
};

export const getSellerListModel = async (limit, offset) => {
    const query = `
    SELECT tr.user_id
FROM tbl_roles tr
INNER JOIN tbl_users u ON u.id = tr.user_id
WHERE tr.role = 'seller'
GROUP BY tr.user_id
ORDER BY tr.user_id DESC
LIMIT ? OFFSET ?;
    `;

    return db.query(query, [limit, offset]);
};

export const getSellerCountModel = async () => {
    const query = `
        SELECT COUNT(DISTINCT ur.user_id) AS total
        FROM tbl_roles ur
        INNER JOIN tbl_users u ON u.id = ur.user_id
        WHERE ur.role='seller'
    `;

    const result = await db.query(query);

    return result[0].total;
};

export const getSellerByIdModel = async (sellerId) => {
    const query = `
        SELECT id AS user_id
        FROM tbl_users
        WHERE id = ?
        LIMIT 1
    `;

    const result = await db.query(query, [sellerId]);

    return result.length > 0 ? result[0] : null;
};

export const getSellerVideosModel = async (userId) => {
    const query = `
        SELECT
            user_id ,
            videoUrl
   
        FROM seller_videos
        WHERE user_id = ?
    `;

    return await db.query(query, [userId]);
};
