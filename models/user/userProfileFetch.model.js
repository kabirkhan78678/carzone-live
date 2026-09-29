import db from '../../config/db.js';

export const fetchUserById = async (
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
    offset,
    lang = "en"
) => {

    limit = Number(limit) || 10;
    offset = Number(offset) || 0;

    let sql = `
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
      u.account_type,

      -- Marketplace listing owner info
      u.account_type AS role,
      u.account_type AS seller_type,
      0 AS isBlocked,
      1 AS is_active

    FROM tbl_cars c

    INNER JOIN tbl_users u 
      ON u.id = c.user_id

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

    WHERE c.user_id != ?
      AND c.is_active = 1
      AND c.is_deleted = 0
      AND c.listing_status = 'published'
  `;

    const params = [lang, lang, lang, lang, lang, lang, lang, lang, lang, lang, userId];

    /* ---------------- HELPERS (UNCHANGED) ---------------- */

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

    /* ---------------- TEXT FILTERS ---------------- */
    if (brandName && brandName.toLowerCase() !== 'all') addMultiValueFilter('c.brandName', brandName);
    if (carModel) addMultiValueFilter('c.carModel', carModel);
    if (carColor) addMultiValueFilter('c.carColor', carColor);
    if (consumption) addMultiValueFilter('c.consumption', consumption);

    /* ---------------- ID FILTERS ---------------- */
    if (fuelType) addIdFilter('c.fuel_type_id', fuelType);
    if (transmission) addIdFilter('c.transmission_id', transmission);
    if (body_type) addIdFilter('c.body_type_id', body_type);
    if (unit) addIdFilter('c.power_unit_id', unit);
    if (drive_type_id) addIdFilter('c.drive_type_id', drive_type_id);
    if (mfk_warrenty_id) addIdFilter('c.mfk_warrenty_id', mfk_warrenty_id);
    if (state_id) addIdFilter('c.state_id', state_id);

    /* ---------------- BASIC ---------------- */
    if (sittingCapacity) {
        sql += ` AND c.sittingCapacity = ?`;
        params.push(Number(sittingCapacity));
    }

    /* ---------------- SEARCH ---------------- */
    if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        sql += ` AND (c.brandName LIKE ? OR c.carModel LIKE ?)`;
        params.push(term, term);
    }

    /* ---------------- PRICE ---------------- */
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

    /* ---------------- MILEAGE ---------------- */
    if (min_mileage && max_mileage) {
        sql += ` AND CAST(c.carMileage AS UNSIGNED) BETWEEN ? AND ?`;
        params.push(min_mileage, max_mileage);
    }

    /* ---------------- YEAR ---------------- */
    if (min_year && max_year) {
        sql += ` AND CAST(c.selectYear AS UNSIGNED) BETWEEN ? AND ?`;
        params.push(min_year, max_year);
    }

    /* ---------------- POWER ---------------- */
    if (min_hp && max_hp) {
        sql += ` AND COALESCE(c.power_ps, CAST(NULLIF(c.powerOutput, '') AS DECIMAL(15,2))) BETWEEN ? AND ?`;
        params.push(min_hp, max_hp);
    }

    /* ✅ ONLY pagination line added */
    sql += ` ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return db.query(sql, params);
};

// for counts
