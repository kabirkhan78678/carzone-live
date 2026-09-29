import db from '../../config/db.js';

export const getLatestDraftCarByUser = async (user_id, lang = "en") => {
    return db.query(
        `SELECT
       c.*,
       DATE_FORMAT(c.first_registration_date, '%Y-%m-%d') AS first_registration_date_str,

       fit.label  AS fuel_type_value,
       tt.label   AS transmission_value,
       dt.label   AS drive_type_value,
       btt.label  AS body_type_value,

       vct.name   AS condition_value,

       wtt_warranty.name AS warranty_value,

       wq.id      AS warranty_type_id_resolved,
       wqt.label  AS warranty_type_value,

      mfst.name AS mfk_status_value,

       COALESCE(c.exterior_color_custom, ect.name) AS exterior_color_value,
       COALESCE(c.interior_color_custom, ict.name) AS interior_color_value

     FROM tbl_cars c

     LEFT JOIN tbl_fuel_type_translations fit
       ON fit.fuel_type_id = c.fuel_type_id
      AND fit.lang = ?

     LEFT JOIN tbl_transmission_translations tt
       ON tt.transmission_id = c.transmission_id
      AND tt.language_code = ?

     LEFT JOIN tbl_drive_translations dt
       ON dt.drive_id = c.drive_type_id
      AND dt.language_code = ?

     LEFT JOIN tbl_body_type_translations btt
       ON btt.body_type_id = c.body_type_id
      AND btt.language_code = ?

     LEFT JOIN tbl_vehicle_condition_translations vct
       ON vct.condition_id = c.carCondition
      AND vct.language_code = ?

     LEFT JOIN tbl_warranty_types wt_warranty
       ON wt_warranty.id = c.mfk_warrenty_id
      AND wt_warranty.is_active = 1

     LEFT JOIN tbl_warranty_type_translations wtt_warranty
       ON wtt_warranty.warranty_type_id = wt_warranty.id
      AND wtt_warranty.language_code = ?

    LEFT JOIN warranty_qualities wq
    ON wq.id = c.warranty_type_text
    AND wq.is_active = 1

   LEFT JOIN warranty_qualities_translations wqt
   ON wqt.warranty_quality_id = wq.id
   AND wqt.language_code = ?

         LEFT JOIN tbl_mfk_status mfs
  ON mfs.id = c.mfk_status_id
 AND mfs.is_active = 1

LEFT JOIN tbl_mfk_status_translations mfst
  ON mfst.mfk_status_id = mfs.id
 AND mfst.language_code = ?


     LEFT JOIN tbl_color_translations ect
       ON ect.color_id = c.exterior_color_id
      AND ect.language_code = ?

     LEFT JOIN tbl_color_translations ict
       ON ict.color_id = c.interior_color_id
      AND ict.language_code = ?

     WHERE c.user_id = ?
       AND c.is_deleted = 0
       AND c.listing_status = 'draft'
     ORDER BY c.updatedAt DESC, c.id DESC
     LIMIT 1`,
        [lang, lang, lang, lang, lang, lang, lang, lang, lang, lang, user_id]
    );
};

export const getCarImagesByCarIdForDraft = async (car_id) => {
    return db.query(
        `SELECT images, id
     FROM tbl_cars_images
     WHERE carId = ?
     ORDER BY id ASC`,
        [car_id]
    );
};

export const getCarLeasingByCarIdForDraft = async (car_id) => {
    return db.query(
        `SELECT
        banking_partner,
        interest_rate AS annual_interest_rate,
        residual_percentage AS residual_value,
        monthly_price AS leasing_value
     FROM tbl_car_leasing
     WHERE car_id = ?
     ORDER BY id DESC
     LIMIT 1`,
        [car_id]
    );
};

export const getCarContactByCarIdForDraft = async (car_id) => {
    return db.query(
        `SELECT
        first_name,
        last_name,
        company_name,
        company_address,
        street,
        house_number,
        postal_code,
        city,
        po_box,
        country,
        country_code,
        phone_number,
        latitude,
        longitude
     FROM tbl_car_contacts
     WHERE car_id = ?
     ORDER BY id DESC
     LIMIT 1`,
        [car_id]
    );
};

// warranty_quality drop down

export const replaceCarLeasingByCarId = async (car_id, data) => {
    await db.query("DELETE FROM tbl_car_leasing WHERE car_id = ?", [car_id]);
    return db.query("INSERT INTO tbl_car_leasing SET ?", [{ car_id, ...data }]);
};

export const clearCarLeasingByCarId = async (car_id) => {
    return db.query("DELETE FROM tbl_car_leasing WHERE car_id = ?", [car_id]);
};

export const replaceCarContactByCarId = async (car_id, data) => {
    await db.query("DELETE FROM tbl_car_contacts WHERE car_id = ?", [car_id]);
    return db.query("INSERT INTO tbl_car_contacts SET ?", [{ car_id, ...data }]);
};

export const clearCarContactByCarId = async (car_id) => {
    return db.query("DELETE FROM tbl_car_contacts WHERE car_id = ?", [car_id]);
};

export const getSellerEmailForInquiryModel = async ({ seller_id, car_id }) => {
    return db.query(
        `
    SELECT
      u.id AS seller_id,
      u.fullName AS seller_name,
      u.email AS seller_email,
      c.id AS car_id,
      c.brandName,
      c.carModel,
      (
        SELECT ci.images
        FROM tbl_cars_images ci
        WHERE ci.carId = c.id
        ORDER BY ci.id ASC
        LIMIT 1
      ) AS car_image_url,
      COALESCE(NULLIF(c.selling_price, ''), NULLIF(c.new_price, ''), NULLIF(c.totalPrice, '')) AS car_price
    FROM tbl_users u
    JOIN tbl_cars c
      ON c.user_id = u.id
     AND c.id = ?
     AND c.is_active = 1
     AND c.is_deleted = 0
     AND c.listing_status = 'published'
    WHERE u.id = ?
    LIMIT 1
    `,
        [Number(car_id), Number(seller_id)]
    );
};

export const countUserAllCars = async (user_id) => {
    const [rows] = await db.query(
        "SELECT COUNT(*) AS count FROM tbl_cars WHERE user_id = ? AND is_deleted = 0",
        [user_id]
    );
    return rows?.count || 0;
};
