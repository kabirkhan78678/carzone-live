import db from '../../config/db.js';

export const getFilteredCarsByAllFilters = async (
    brandNameFilter,
    carModelFilter,
    fuelFilter,
    yearFilter,
    kilometerFilter,
    priceFilter,
    leasingFilter,
    driveFilter,
    stateFilter,
    accidentFilter,
    bodyTypeFilter,
    transmissionFilter,
    powerFilter,
    cubicFilter,
    cylindersFilter,
    wltpFilter,
    batteryFilter,
    towingFilter,
    totalWeightFilter,
    emptyWeightFilter,
    seatsFilter,
    doorsFilter,
    co2Filter,
    energyFilter,
    exteriorColorFilter,
    interiorColorFilter,
    consumptionFilter,
    ageFilter,
    sellerTypeFilter,
    mfkFilter,
    warrantyFilter,
    excludedUserId = null,
    excludeCurrentUser = false,
    sortKey = ["published_most_recent"]
) => {
    const normalizeIds = (value) => {
        if (value === null || value === undefined || value === "") return [];
        if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
        const n = Number(value);
        return Number.isFinite(n) ? [n] : [];
    };
    const normalizePositiveId = (value) => {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : null;
    };
    const hasLeasing = leasingFilter?.is_leasing_type;
    var selectClause = hasLeasing ? 'SELECT tc.* , tcl.* ' : 'SELECT tc.* ';
    var fromClause = hasLeasing ? 'FROM tbl_cars tc , tbl_car_leasing tcl' : 'FROM tbl_cars tc';
    var whereClause = "WHERE tc.id IS NOT NULL AND tc.is_deleted = 0 AND tc.is_active = 1 AND tc.listing_status = 'published' ";

    if (brandNameFilter.is_brand_name) {
        const values = Array.isArray(brandNameFilter.brandName) ? brandNameFilter.brandName : (brandNameFilter.brandName ? [brandNameFilter.brandName] : []);
        if (values.length === 1) whereClause += ` AND tc.brandName = '${values[0]}'`;
        else if (values.length > 1) whereClause += ` AND tc.brandName IN ('${values.join("','")}')`;
    }
    if (carModelFilter.is_car_model) {
        const values = Array.isArray(carModelFilter.carModel) ? carModelFilter.carModel : (carModelFilter.carModel ? [carModelFilter.carModel] : []);
        if (values.length === 1) whereClause += ` AND tc.carModel = '${values[0]}'`;
        else if (values.length > 1) whereClause += ` AND tc.carModel IN ('${values.join("','")}')`;
    }
    if (fuelFilter.is_fuel_type) {
        const ids = normalizeIds(fuelFilter.fuel_type);
        if (ids.length === 1) whereClause += ` AND tc.fuel_type_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.fuel_type_id IN (${ids.join(",")})`;
    }
    if (yearFilter.is_year_type) {
        whereClause += ` AND YEAR(tc.first_registration_date) BETWEEN '${yearFilter.min_year}' AND '${yearFilter.max_year}'`;
    }
    if (kilometerFilter.is_km_type) {
        whereClause += ` AND tc.carMileage BETWEEN ${kilometerFilter.min_km} AND ${kilometerFilter.max_km}`;
    }
    if (hasLeasing) {
        whereClause += ` AND tc.id = tcl.car_id AND tcl.monthly_price BETWEEN '${leasingFilter.min_price}' AND '${leasingFilter.max_price}'`;
    }
    if (priceFilter.is_price_type) {
        whereClause += ` AND tc.selling_price BETWEEN ${priceFilter.min_price} AND ${priceFilter.max_price}`;
    }
    if (driveFilter.is_drive_type) {
        const ids = normalizeIds(driveFilter.drive_type);
        if (ids.length === 1) whereClause += ` AND tc.drive_type_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.drive_type_id IN (${ids.join(",")})`;
    }
    if (stateFilter.is_state_type) {
        const ids = normalizeIds(stateFilter.state_id);
        if (ids.length === 1) whereClause += ` AND tc.state_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.state_id IN (${ids.join(",")})`;
    }
    if (accidentFilter.is_accident_type) {
        const ids = normalizeIds(accidentFilter.accident_vehicle);
        if (ids.length === 1) whereClause += ` AND tc.is_accident_vehicle = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.is_accident_vehicle IN (${ids.join(",")})`;
    }
    if (bodyTypeFilter.is_body_type) {
        const ids = normalizeIds(bodyTypeFilter.body_type_id);
        if (ids.length === 1) whereClause += ` AND tc.body_type_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.body_type_id IN (${ids.join(",")})`;
    }
    if (transmissionFilter.is_transmission) {
        const ids = normalizeIds(transmissionFilter.transmission_id);
        if (ids.length === 1) whereClause += ` AND tc.transmission_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.transmission_id IN (${ids.join(",")})`;
    }
    if (powerFilter.is_power_type) {
        const normalizedUnit = String(powerFilter.unit || "PS").toUpperCase();
        const powerExpression = normalizedUnit === "KW" ? "CAST(NULLIF(tc.power_kw, '') AS DECIMAL(15,2))" : "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2))";
        whereClause += ` AND ${powerExpression} IS NOT NULL AND ${powerExpression} BETWEEN ${powerFilter.min_po} AND ${powerFilter.max_po}`;
    }
    if (cubicFilter.is_cubic_type) {
        whereClause += ` AND tc.cubic_capacity BETWEEN '${cubicFilter.min_cc}' AND '${cubicFilter.max_cc}'`;
    }
    if (cylindersFilter.is_cylinders_type) {
        const cylindersExpression = "CAST(NULLIF(tc.cylinders, '') AS UNSIGNED)";
        whereClause += ` AND TRIM(tc.cylinders) REGEXP '^[0-9]+$' AND ${cylindersExpression} IS NOT NULL AND ${cylindersExpression} BETWEEN ${cylindersFilter.min_cy} AND ${cylindersFilter.max_cy}`;
    }
    if (wltpFilter.is_wltp_type) whereClause += ` AND tc.wltp_range BETWEEN '${wltpFilter.min_wltp}' AND '${wltpFilter.max_wltp}'`;
    if (batteryFilter.is_battery_type) whereClause += ` AND tc.battery_capacity BETWEEN '${batteryFilter.min_battery}' AND '${batteryFilter.max_battery}'`;
    if (towingFilter.is_towing_type) whereClause += ` AND tc.braked_towing_capacity_kg BETWEEN '${towingFilter.min_tc}' AND '${towingFilter.max_tc}'`;
    if (totalWeightFilter.is_total_weight_type) whereClause += ` AND tc.total_weight BETWEEN ${totalWeightFilter.min_tw} AND ${totalWeightFilter.max_tw}`;
    if (emptyWeightFilter.is_empty_weight_type) whereClause += ` AND tc.empty_weight BETWEEN ${emptyWeightFilter.min_ew} AND ${emptyWeightFilter.max_ew}`;
    if (seatsFilter.is_seat_type) whereClause += ` AND tc.sittingCapacity BETWEEN '${seatsFilter.min_seats}' AND '${seatsFilter.max_seats}'`;
    if (doorsFilter.is_door_type) whereClause += ` AND tc.doors BETWEEN '${doorsFilter.min_doors}' AND '${doorsFilter.max_doors}'`;
    if (co2Filter.is_co2_type) whereClause += ` AND tc.co2Emission BETWEEN ${co2Filter.min_co2} AND ${co2Filter.max_co2}`;
    if (energyFilter.is_energy_type) whereClause += ` AND tc.energy_efficiency = '${energyFilter.energy_efficiency}'`;
    if (exteriorColorFilter.is_exterior_color) {
        const ids = normalizeIds(exteriorColorFilter.exterior_color);
        if (ids.length === 1) whereClause += ` AND tc.exterior_color_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.exterior_color_id IN (${ids.join(",")})`;
    }
    if (interiorColorFilter.is_interior_color) {
        const ids = normalizeIds(interiorColorFilter.interior_color);
        if (ids.length === 1) whereClause += ` AND tc.interior_color_id = '${ids[0]}'`;
        else if (ids.length > 1) whereClause += ` AND tc.interior_color_id IN (${ids.join(",")})`;
    }
    if (consumptionFilter.is_consumption_type) whereClause += ` AND tc.consumption BETWEEN ${consumptionFilter.min_cons} AND ${consumptionFilter.max_cons}`;
    if (ageFilter.is_age_type) {
        const days = normalizeIds(ageFilter.age_listing);
        if (days.length === 1) whereClause += ` AND tc.createdAt <= NOW() - INTERVAL ${days[0]} DAY`;
        else if (days.length > 1) whereClause += ` AND (${days.map((d) => `tc.createdAt <= NOW() - INTERVAL ${d} DAY`).join(" OR ")})`;
    }
    if (sellerTypeFilter.is_seller_type) {
        const types = Array.isArray(sellerTypeFilter.seller_type) ? sellerTypeFilter.seller_type : [sellerTypeFilter.seller_type];
        const mappedTypes = types.map((t) => t === "business" ? "company" : t === "personal" ? "private" : t);
        fromClause += `, tbl_users tu`;
        whereClause += ` AND tc.user_id = tu.id AND tu.account_type IN ('${mappedTypes.join("','")}')`;
    }
    if (mfkFilter?.is_mfk) {
        whereClause += ` AND tc.mfk_status_id IS NOT NULL AND tc.mfk_status_id NOT IN (4, 5)`;
    }
    if (warrantyFilter?.is_warranty) {
        whereClause += ` AND EXISTS (SELECT 1 FROM tbl_warranty_types wtt WHERE wtt.id = tc.mfk_warrenty_id AND wtt.warranty_key IS NOT NULL AND TRIM(wtt.warranty_key) != '' AND wtt.warranty_key != 'no_warranty')`;
    }
    const excludedUser = normalizePositiveId(excludedUserId);
    if (excludeCurrentUser && excludedUser) {
        whereClause += ` AND tc.user_id <> ${excludedUser}`;
    }
    const sortMap = {
        price_low_to_high: "CAST(tc.selling_price AS DECIMAL(15,2)) ASC",
        price_high_to_low: "CAST(tc.selling_price AS DECIMAL(15,2)) DESC",
        mileage_low_to_high: "CAST(tc.carMileage AS DECIMAL(15,2)) ASC",
        mileage_high_to_low: "CAST(tc.carMileage AS DECIMAL(15,2)) DESC",
        year_old_to_new: "tc.first_registration_date ASC",
        year_new_to_old: "tc.first_registration_date DESC",
        brand_model_a_to_z: "tc.brandName ASC, tc.carModel ASC",
        brand_model_z_to_a: "tc.brandName DESC, tc.carModel DESC",
        horsepower_low_to_high: "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2)) ASC",
        horsepower_high_to_low: "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2)) DESC",
        published_most_recent: "tc.createdAt DESC",
        published_oldest: "tc.createdAt ASC"
    };
    const normalizedSortKeys = (Array.isArray(sortKey) ? sortKey : String(sortKey || "").split(",")).map((key) => String(key).trim().toLowerCase()).filter(Boolean);
    const orderParts = normalizedSortKeys.map((key) => sortMap[key]).filter(Boolean);
    const orderClause = ` ORDER BY ${orderParts.length ? orderParts.join(", ") : sortMap.published_most_recent}, tc.id DESC`;
    var sqlQuery = `${selectClause} ${fromClause} ${whereClause} ${orderClause}`;
    const rows = await db.query(sqlQuery);
    return rows;
};
