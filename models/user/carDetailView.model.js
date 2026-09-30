import db from '../../config/db.js';

export const viewCarDetailByCarIdModel = async (carId, language = 'en') => {
    const car = await db.query(`
    SELECT 
      c.*,

      -- seller
      u.fullName,
      u.email,
      u.phoneNumber,
      u.whatsappNumber,
      u.profileImage,
      u.coverImage,
      u.account_type,
      u.companyName,
      u.companyAddress,
      u.city,
      u.pincode,
      u.fullAddress,
      u.tagline,
      u.websiteUrl,
      
      u.commercial_register_number,
      u.business_phone,
      u.businessCountryCode,
      u.code,
      
      u.description AS sellerDescription,

      -- transmission
      tt.label AS transmission_label,

      -- body type
      btt.label AS body_type_label,

      -- fuel + drive labels (new listing id-based fields)
      fit.label AS fuel_type_label,
      dt.label AS drive_type_label,

      -- condition + state labels
      vct.name AS condition_value,
      vst_state.label AS state_value,

      -- color labels
      COALESCE(c.exterior_color_custom, ect.name) AS exterior_color_value,
      COALESCE(c.interior_color_custom, ict.name) AS interior_color_value,

      -- warranty labels
      wtt_warranty.name AS warranty_value,
      wq.id AS warranty_type_id_resolved,
      wqt.label AS warranty_type_value,

      -- Quality Seal
      qs.id AS quality_seal_id_resolved,
      qs.name AS quality_seal_name,
      qs.image AS quality_seal_image,
      qs.description AS quality_seal_description,

      -- latest leasing row (new listing flow writes in tbl_car_leasing)
      cl.monthly_price AS leasing_monthly_price,
      cl.banking_partner AS leasing_banking_partner,
      cl.interest_rate AS leasing_interest_rate,
      cl.residual_percentage AS leasing_residual_percentage,

      -- latest contact row from listing flow
      cc.first_name AS contact_first_name,
      cc.last_name AS contact_last_name,
      cc.company_name AS contact_company_name,
      cc.company_address AS contact_company_address,
      cc.street AS contact_street,
      cc.house_number AS contact_house_number,
      cc.postal_code AS contact_postal_code,
      cc.city AS contact_city,
      cc.po_box AS contact_po_box,
      cc.country AS contact_country,
      cc.country_code AS contact_country_code,
      cc.phone_number AS contact_phone_number,

      -- MFK status
      mst.status AS mfk_status_key,
      mst.status_key AS mfk_status_code,
      mstt.name AS mfk_status_value,

      -- user plan
      user_plan.plan_start_date,
      user_plan.plan_end_date,
      user_plan.plan_name,

      -- coordinates
      cc.latitude AS contact_latitude,
      cc.longitude AS contant_longitude

    FROM tbl_cars c

    JOIN tbl_users u 
      ON u.id = c.user_id

    LEFT JOIN tbl_transmissions t
      ON t.id = c.transmission_id
      AND t.is_active = 1

    LEFT JOIN tbl_transmission_translations tt
      ON tt.transmission_id = t.id
      AND tt.language_code = ?

    LEFT JOIN tbl_body_types bt
      ON bt.id = c.body_type_id
      AND bt.is_active = 1

    LEFT JOIN tbl_body_type_translations btt
      ON btt.body_type_id = bt.id
      AND btt.language_code = ?

    LEFT JOIN tbl_fuel_type_translations fit
      ON fit.fuel_type_id = c.fuel_type_id
      AND fit.lang = ?

    LEFT JOIN tbl_drives d
      ON d.id = c.drive_type_id
      AND d.is_active = 1

    LEFT JOIN tbl_drive_translations dt
      ON dt.drive_id = d.id
      AND dt.language_code = ?

    LEFT JOIN tbl_vehicle_condition_translations vct
      ON vct.condition_id = c.carCondition
      AND vct.language_code = ?

    LEFT JOIN tbl_vehicle_state_translations vst_state
      ON vst_state.vehicle_state_id = c.state_id
      AND vst_state.language_code = ?

    LEFT JOIN tbl_color_translations ect
      ON ect.color_id = c.exterior_color_id
      AND ect.language_code = ?

    LEFT JOIN tbl_color_translations ict
      ON ict.color_id = c.interior_color_id
      AND ict.language_code = ?

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

    LEFT JOIN tbl_quality_seals qs
      ON qs.id = c.quality_seal_id
      AND qs.is_delete = 0

    LEFT JOIN tbl_mfk_status mst
      ON mst.id = c.mfk_status_id
      AND mst.is_active = 1

    LEFT JOIN tbl_mfk_status_translations mstt
      ON mstt.mfk_status_id = mst.id
      AND mstt.language_code = ?

    LEFT JOIN (
      SELECT
        l.car_id,
        l.monthly_price,
        l.banking_partner,
        l.interest_rate,
        l.residual_percentage
      FROM tbl_car_leasing l
      INNER JOIN (
        SELECT car_id, MAX(id) AS latest_id
        FROM tbl_car_leasing
        GROUP BY car_id
      ) latest
        ON latest.latest_id = l.id
    ) cl
      ON cl.car_id = c.id

    LEFT JOIN (
      SELECT
        ct.car_id,
        ct.first_name,
        ct.last_name,
        ct.company_name,
        ct.company_address,
        ct.street,
        ct.house_number,
        ct.postal_code,
        ct.city,
        ct.po_box,
        ct.country,
        ct.country_code,
        ct.phone_number,
        ct.latitude,
        ct.longitude
      FROM tbl_car_contacts ct
      INNER JOIN (
        SELECT car_id, MAX(id) AS latest_id
        FROM tbl_car_contacts
        GROUP BY car_id
      ) latest_contact
        ON latest_contact.latest_id = ct.id
    ) cc
      ON cc.car_id = c.id

    LEFT JOIN (
      SELECT
        up.user_id,
        up.id AS user_plan_id,
        up.plan_id,
        up.start_date AS plan_start_date,
        up.end_date AS plan_end_date,
        up.is_active AS plan_is_active,
        p.name AS plan_name
      FROM tbl_user_plans up
      LEFT JOIN tbl_plans p ON p.id = up.plan_id
      INNER JOIN (
        SELECT user_id, MAX(id) AS latest_id
        FROM tbl_user_plans
        GROUP BY user_id
      ) latest_plan
        ON latest_plan.latest_id = up.id
    ) user_plan
      ON user_plan.user_id = c.user_id

    WHERE c.id = ?
  `, [language, language, language, language, language, language, language, language, language, language, language, carId]);

    return car;
};

export const getCarImagesByCarIdModel = (carId) => {
    return db.query(
        `SELECT id, images FROM tbl_cars_images WHERE carId = ? ORDER BY id ASC`,
        [carId]
    );
};

export const getSuggestedCarsModel = (carId, userId) => {
    return db.query(
        `SELECT id, brandName, carModel, totalPrice
     FROM tbl_cars
     WHERE id != ? AND user_id = ? AND is_deleted = 0
     LIMIT 6`,
        [carId, userId]
    );
};

export const updateCarCoordinates = (id, lat, lon) => {
    return db.query(
        'UPDATE tbl_cars SET latitude = ?, longitude = ? WHERE id = ?',
        [lat, lon, id]
    );
};
