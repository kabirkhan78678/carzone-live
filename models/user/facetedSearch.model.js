import db from '../../config/db.js';

export const filterCarsModel = async (filters) => {
    const {
        power_from,
        power_to,
        power_unit,
        cubic_from,
        cubic_to,
        cylinders_from,
        cylinders_to,
        range_from,
        range_to,
        battery_from,
        battery_to,
        total_weight_from,
        total_weight_to,
        empty_weight_from,
        empty_weight_to,
        towing_from,
        towing_to,
        year_from,
        year_to,
        price_from,
        price_to,
        price_type,
    } = filters;

    let conditions = [];
    let params = [];

    conditions.push(`is_active = 1`);
    conditions.push(`is_deleted = 0`);
    conditions.push(`listing_status = 'published'`);

    if (
        filters.is_metallic === 1 ||
        filters.is_metallic === "1" ||
        filters.is_metallic === true ||
        filters.is_metallic === "true" ||
        filters.metallic === 1 ||
        filters.metallic === "1" ||
        filters.metallic === true ||
        filters.metallic === "true"
    ) {
        conditions.push(`is_metallic = 1`);
    }

    if (
        filters.car_type === "only_ch_cars" ||
        filters.car_type === "ch" ||
        filters.is_swiss_vehicle === 1 ||
        filters.is_swiss_vehicle === "1" ||
        filters.is_swiss_vehicle === true ||
        filters.is_swiss_vehicle === "true" ||
        filters.isSwissVehicle === 1 ||
        filters.isSwissVehicle === "1" ||
        filters.isSwissVehicle === true ||
        filters.isSwissVehicle === "true"
    ) {
        conditions.push(`is_swiss_vehicle = 1`);
    }

    if (power_from || power_to) {
        if (power_unit === "KW") {
            if (power_from) conditions.push(`COALESCE(power_kw, ROUND(CAST(NULLIF(powerOutput, '') AS DECIMAL(15,2)) / 1.35962)) >= ?`), params.push(power_from);
            if (power_to) conditions.push(`COALESCE(power_kw, ROUND(CAST(NULLIF(powerOutput, '') AS DECIMAL(15,2)) / 1.35962)) <= ?`), params.push(power_to);
        } else {
            if (power_from) conditions.push(`COALESCE(power_ps, CAST(NULLIF(powerOutput, '') AS DECIMAL(15,2))) >= ?`), params.push(power_from);
            if (power_to) conditions.push(`COALESCE(power_ps, CAST(NULLIF(powerOutput, '') AS DECIMAL(15,2))) <= ?`), params.push(power_to);
        }
    }

    if (cubic_from) conditions.push(`cubic_capacity >= ?`), params.push(cubic_from);
    if (cubic_to) conditions.push(`cubic_capacity <= ?`), params.push(cubic_to);

    if (cylinders_from) conditions.push(`cylinders >= ?`), params.push(cylinders_from);
    if (cylinders_to) conditions.push(`cylinders <= ?`), params.push(cylinders_to);

    if (range_from) conditions.push(`wltp_range >= ?`), params.push(range_from);
    if (range_to) conditions.push(`wltp_range <= ?`), params.push(range_to);

    if (battery_from) conditions.push(`battery_capacity >= ?`), params.push(battery_from);
    if (battery_to) conditions.push(`battery_capacity <= ?`), params.push(battery_to);

    if (total_weight_from) conditions.push(`total_weight >= ?`), params.push(total_weight_from);
    if (total_weight_to) conditions.push(`total_weight <= ?`), params.push(total_weight_to);

    if (empty_weight_from) conditions.push(`empty_weight >= ?`), params.push(empty_weight_from);
    if (empty_weight_to) conditions.push(`empty_weight <= ?`), params.push(empty_weight_to);

    if (towing_from) {
        conditions.push(`braked_towing_capacity_kg >= ?`);
        params.push(towing_from);
    }

    if (towing_to) {
        conditions.push(`braked_towing_capacity_kg <= ?`);
        params.push(towing_to);
    }

    let yearCounts = { selected: 0, older: 0, newer: 0 };
    if (year_from || year_to) {
        const [selectedCount] = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_cars WHERE is_active = 1 AND is_deleted = 0 AND listing_status = 'published'
       ${year_from ? `AND selectYear >= ${year_from}` : ''} 
       ${year_to ? `AND selectYear <= ${year_to}` : ''}`
        );
        const [olderCount] = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_cars WHERE is_active = 1 AND is_deleted = 0 AND listing_status = 'published'
       ${year_from ? `AND selectYear < ${year_from}` : ''}`
        );
        const [newerCount] = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_cars WHERE is_active = 1 AND is_deleted = 0 AND listing_status = 'published'
       ${year_to ? `AND selectYear > ${year_to}` : ''}`
        );
        yearCounts.selected = selectedCount[0].total;
        yearCounts.older = olderCount[0].total;
        yearCounts.newer = newerCount[0].total;
    }

    let priceCounts = { purchase: 0, leasing: 0 };
    if (price_from || price_to) {
        const priceColumn = price_type === 'leasing' ? 'leasingPrice' : 'totalPrice';
        const [priceCount] = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_cars WHERE is_active = 1 AND is_deleted = 0 AND listing_status = 'published'
       ${price_from ? `AND ${priceColumn} >= ${price_from}` : ''} 
       ${price_to ? `AND ${priceColumn} <= ${price_to}` : ''}`
        );
        priceCounts[price_type] = priceCount[0].total;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : '';

    const rows = await db.query(`SELECT * FROM tbl_cars ${where}`, params);
    const countResult = await db.query(`SELECT COUNT(*) AS total FROM tbl_cars ${where}`, params);

    return {
        data: rows,
        total: countResult[0].total,
        //yearCounts,
        //priceCounts,
    };
};

// openingTimes
