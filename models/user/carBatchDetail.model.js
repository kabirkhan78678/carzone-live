import db from '../../config/db.js';

export const fetchCarsByIdsWithSellerDetails = async (carIds = [], lang = "en") => {
    if (!Array.isArray(carIds) || carIds.length === 0) {
        return [];
    }

    const placeholders = carIds.map(() => "?").join(",");

    const sql = `
    SELECT DISTINCT
      c.*,

      -- Listing value labels
      fit.label AS fuel_type_value,
      tt.label AS transmission_value,
      dt.label AS drive_type_value,
      btt.label AS body_type_value,
      vct.name AS condition_value,
      vst_state.label AS state_value,
      COALESCE(c.exterior_color_custom, ect.name) AS exterior_color_value,
      COALESCE(c.interior_color_custom, ict.name) AS interior_color_value,
      wtt_warranty.name AS warranty_value,
      wq.id AS warranty_type_id_resolved,
      wqt.label AS warranty_type_value,
      qs.id AS quality_seal_id_resolved,
      qs.name AS quality_seal_name,
      qs.image AS quality_seal_image,
      qs.description AS quality_seal_description,
      cl.monthly_price AS leasing_value,
      cl.interest_rate AS annual_interest_rate,
      cl.residual_percentage AS residual_value,
      cl.banking_partner,

      -- Seller User Info
      u.id AS seller_id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.whatsappNumber,
      u.whatsappCountryCode,
      u.profileImage,
      u.city,
      u.pincode,
      u.fullAddress,
      u.companyName,
      u.companyAddress,
      u.vat,
      u.countryCode,

      -- Seller role/status (derived from users table for new flow)
      'seller' AS role,
      u.account_type AS seller_type,
      COALESCE(r.isBlocked, 0) AS isBlocked,
      COALESCE(r.is_active, 1) AS is_active

    FROM tbl_cars c

    LEFT JOIN tbl_users u 
      ON u.id = c.user_id

    LEFT JOIN tbl_roles r
      ON r.user_id = u.id
     AND r.role = 'seller'

    LEFT JOIN tbl_fuel_type_translations fit
      ON fit.fuel_type_id = c.fuel_type_id
     AND fit.lang = ?

    LEFT JOIN tbl_transmissions t
      ON t.id = c.transmission_id
     AND t.is_active = 1

    LEFT JOIN tbl_transmission_translations tt
      ON tt.transmission_id = t.id
     AND tt.language_code = ?

    LEFT JOIN tbl_drives d
      ON d.id = c.drive_type_id
     AND d.is_active = 1

    LEFT JOIN tbl_drive_translations dt
      ON dt.drive_id = d.id
     AND dt.language_code = ?

    LEFT JOIN tbl_body_types bt
      ON bt.id = c.body_type_id
     AND bt.is_active = 1

    LEFT JOIN tbl_body_type_translations btt
      ON btt.body_type_id = bt.id
     AND btt.language_code = ?

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

    LEFT JOIN (
      SELECT
        l.car_id,
        l.monthly_price,
        l.interest_rate,
        l.residual_percentage,
        l.banking_partner
      FROM tbl_car_leasing l
      INNER JOIN (
        SELECT car_id, MAX(id) AS latest_id
        FROM tbl_car_leasing
        GROUP BY car_id
      ) latest
        ON latest.latest_id = l.id
    ) cl
      ON cl.car_id = c.id

    WHERE c.id IN (${placeholders})
      AND c.is_active = 1
      AND c.is_deleted = 0
    ORDER BY c.createdAt DESC
  `;

    const params = [
        lang,
        lang,
        lang,
        lang,
        lang,
        lang,
        lang,
        lang,
        lang,
        lang,
        ...carIds
    ];

    return db.query(sql, params);
};


//     SELECT 
//       c.*,
//       u.id AS seller_id,
//       u.fullName,
//       u.email,
//       u.phoneNumber,
//       u.whatsappNumber,
//       u.profileImage,
//       u.city,
//       u.pincode,
//       u.fullAddress,
//       u.companyName,
//       u.companyAddress,
//       u.vat,
//       u.countryCode,
//       r.role,
//       r.seller_type,
//       r.isBlocked,
//       r.is_active
//     FROM tbl_cars c
//     INNER JOIN tbl_users u 
//         ON u.id = c.user_id
//        AND u.isSeller = 1
//     INNER JOIN tbl_roles r
//         ON r.user_id = u.id
//        AND r.role = 'seller'
//     WHERE c.user_id != ?
//     ORDER BY c.id DESC
//   `;

// };
