import db from '../../config/db.js';

export const modelFetchAllWishlist = async (
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
    limit,
    offset
) => {

    let sql = `
  SELECT 
    c.*,
    w.id AS wishlist_id,
    u.id AS seller_id,
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
    u.vat,
    u.countryCode,
    'seller' AS role,
    u.account_type AS seller_type,
    COALESCE(r.isBlocked, 0) AS isBlocked,
    COALESCE(r.is_active, 1) AS is_active,
    fit.label AS fuel_type_value,
    tt.label AS transmission_value,
    dt.label AS drive_type_value,
    YEAR(c.first_registration_date) AS registration_year,
    qs.id AS quality_seal_id_resolved,
    qs.name AS quality_seal_name,
    qs.image AS quality_seal_image,
    qs.description AS quality_seal_description
  FROM tbl_car_wishlist w
  JOIN tbl_cars c ON c.id = w.carId
  JOIN tbl_users u ON u.id = c.user_id
  LEFT JOIN tbl_roles r ON r.user_id = u.id AND r.role = 'seller'
  LEFT JOIN tbl_fuel_type_translations fit
    ON fit.fuel_type_id = c.fuel_type_id
   AND fit.lang = 'en'
  LEFT JOIN tbl_transmissions t
    ON t.id = c.transmission_id
   AND t.is_active = 1
  LEFT JOIN tbl_transmission_translations tt
    ON tt.transmission_id = t.id
   AND tt.language_code = 'en'

    LEFT JOIN tbl_drives d
            ON d.id = c.drive_type_id
            AND d.is_active = 1

        LEFT JOIN tbl_drive_translations dt
            ON dt.drive_id = d.id
            AND dt.language_code = 'en'
  LEFT JOIN tbl_quality_seals qs
    ON qs.id = c.quality_seal_id
   AND qs.is_delete = 0
  WHERE w.user_id = ?
    AND c.is_deleted = 0
`;


    const params = [userId];

    //  SAME FILTERS (example)
    if (brandName) {
        sql += ` AND c.brandName = ?`;
        params.push(brandName);
    }

    if (carModel) {
        sql += ` AND c.carModel = ?`;
        params.push(carModel);
    }

    if (search) {
        sql += ` AND (c.brandName LIKE ? OR c.carModel LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    if (min_year) {
        sql += ` AND c.selectYear >= ?`;
        params.push(min_year);
    }

    if (max_year) {
        sql += ` AND c.selectYear <= ?`;
        params.push(max_year);
    }

    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db.query(sql, params);
    return rows;
};

export const addToWishlistModel = async (data) => {
    return db.query("INSERT INTO tbl_car_wishlist SET ?", [data]);
};

export const removeCarFromWishlistModel = (id, carId) => {
    return db.query("DELETE FROM tbl_car_wishlist WHERE user_id = ? AND carId=? ", [id, carId]);
};

export const fetchAllreadyCarWishlist = (id, carId) => {
    return db.query("SELECT * FROM tbl_car_wishlist WHERE user_id = ? AND carId=? ", [id, carId]);
};

export const removeCarFromWishlistModelByCarId = (carId) => {
    return db.query(
        "DELETE FROM tbl_car_wishlist WHERE carId = ?",
        [carId]
    );
};

export const modelAddRecentlyViewed = async (userId, carId) => {
    const deleteResult = await db.query(
        `DELETE FROM tbl_recently_viewed WHERE user_id = ? AND car_id = ?`,
        [userId, carId]
    );

    await db.query(
        `INSERT INTO tbl_recently_viewed (user_id, car_id, viewed_at) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [userId, carId]
    );

    return {
        action: deleteResult.affectedRows > 0 ? "updated" : "inserted"
    };
};

export const modelGetRecentlyViewed = async (userId, limit = 10) => {
    const sql = `
    SELECT 
      rv.car_id,
      c.brandName,
      c.carModel,
      c.totalPrice,
      u.fullname AS user_name,
      u.profileImage AS user_profile_image,
      (
        SELECT ci.images
        FROM tbl_cars_images ci
        WHERE ci.carId = c.id    
        ORDER BY ci.id ASC
        LIMIT 1
      ) AS car_image
    FROM (
      SELECT car_id, MAX(viewed_at) AS viewed_at
      FROM tbl_recently_viewed
      WHERE user_id = ?
      GROUP BY car_id
      ORDER BY MAX(viewed_at) DESC
      LIMIT ?
    ) rv
    JOIN tbl_cars c ON c.id = rv.car_id
    JOIN tbl_users u on u.id = c.user_id
    WHERE c.is_deleted = 0
    ORDER BY rv.viewed_at DESC
  `;
    return db.query(sql, [userId, limit]);
};
