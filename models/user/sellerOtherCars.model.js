import db from '../../config/db.js';

export const fetchOtherSellerCars = async (
    id,
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
    state_id
) => {
    let sql = `
        SELECT DISTINCT c.*
        FROM tbl_cars c
        JOIN tbl_users u ON c.user_id = u.id
        WHERE c.user_id != ?
        AND c.is_active = 1
        AND c.is_deleted = 0
        AND c.listing_status = 'published'
    `;

    let params = [id];

    /* ---------------- HELPERS ---------------- */

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

    if (sellerType && sellerType.toLowerCase() !== 'all') {
        const normalizedSellerType = String(sellerType).trim().toLowerCase() === "business"
            ? "company"
            : String(sellerType).trim().toLowerCase() === "personal"
                ? "private"
                : sellerType;
        sql += ` AND u.account_type = ?`;
        params.push(normalizedSellerType);
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

    sql += ` ORDER BY c.createdAt DESC`;

    return db.query(sql, params);
};
