export const getIds = (value) => {
    if (value === undefined || value === null || value === "") return [];
    const ids = Array.isArray(value) ? value : String(value).split(",");
    return ids
        .map((item) => Number(String(item).trim()))
        .filter((item) => Number.isFinite(item) && item > 0);
};

export const getTextValues = (value) => {
    if (value === undefined || value === null || value === "") return [];
    const items = Array.isArray(value) ? value : String(value).split(",");
    return items
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0);
};

export const hasFiniteNumber = (value) =>
    value !== undefined &&
    value !== null &&
    value !== "" &&
    Number.isFinite(Number(value));

export function buildWhereConditions(filters, selectedBrandNames, selectedModels) {
    const {
        year_from,
        year_to,
        km_from,
        km_to,
        price_from,
        price_to,
        seat_from,
        seat_to,
        door_from,
        door_to,
        power_from,
        power_to,
        power_unit,
        cubic_capacity_from,
        cubic_capacity_to,
        cylinders_from,
        cylinders_to,
        battery_capacity_from,
        battery_capacity_to,
        total_weight_from,
        total_weight_to,
        empty_weight_from,
        empty_weight_to,
        towing_from,
        towing_to,
        wltp_range_from,
        wltp_range_to,
        consumption_from,
        consumption_to,
        co2_from,
        co2_to
    } = filters;

    const where = [
        "c.is_deleted = 0",
        "c.listing_status = 'published'",
        "c.is_active = 1"
    ];

    const isOnlyCh =
        filters.car_type === "only_ch_cars" ||
        filters.car_type === "ch" ||
        filters.is_swiss_vehicle === true ||
        filters.is_swiss_vehicle === 1 ||
        filters.is_swiss_vehicle === "1" ||
        filters.is_swiss_vehicle === "true" ||
        filters.isSwissVehicle === true ||
        filters.isSwissVehicle === 1 ||
        filters.isSwissVehicle === "1" ||
        filters.isSwissVehicle === "true";
    if (isOnlyCh) {
        where.push(`c.is_swiss_vehicle = 1`);
    }

    const excludeUserId = hasFiniteNumber(filters.exclude_user_id ?? filters.excluded_user_id ?? filters.viewer_user_id ?? filters.viewerUserId)
        ? Number(filters.exclude_user_id ?? filters.excluded_user_id ?? filters.viewer_user_id ?? filters.viewerUserId)
        : null;
    if (excludeUserId && excludeUserId > 0) {
        where.push(`c.user_id <> ${excludeUserId}`);
    }

    const addNumericRange = (expression, fromValue, toValue) => {
        const hasFrom = hasFiniteNumber(fromValue);
        const hasTo = hasFiniteNumber(toValue);
        if (!hasFrom && !hasTo) return;
        where.push(`${expression} IS NOT NULL`);
        if (hasFrom) where.push(`${expression} >= ${Number(fromValue)}`);
        if (hasTo) where.push(`${expression} <= ${Number(toValue)}`);
    };

    if (filters.seller_type) {
        const accountTypeMap = { business: "company", personal: "private" };
        const values = getTextValues(filters.seller_type)
            .map((value) => value.toLowerCase())
            .map((value) => accountTypeMap[value] || value)
            .filter((value) => value === "company" || value === "private");
        if (values.length) {
            where.push(`u.account_type IN (${values.map((value) => `'${value}'`).join(",")})`);
        }
    }

    if (filters.state_id) where.push(`c.state_id IN (${getIds(filters.state_id).join(",")})`);
    if (filters.body_type_id) where.push(`c.body_type_id IN (${getIds(filters.body_type_id).join(",")})`);
    if (filters.fuel_type_id) where.push(`c.fuel_type_id IN (${getIds(filters.fuel_type_id).join(",")})`);
    if (filters.transmission_id) where.push(`c.transmission_id IN (${getIds(filters.transmission_id).join(",")})`);
    if (filters.drive_type_id) where.push(`c.drive_type_id IN (${getIds(filters.drive_type_id).join(",")})`);
    if (filters.interior_color_id) where.push(`c.interior_color_id IN (${getIds(filters.interior_color_id).join(",")})`);
    if (filters.exterior_color_id) where.push(`c.exterior_color_id IN (${getIds(filters.exterior_color_id).join(",")})`);
    if (filters.vehicle_accident_status_id) where.push(`c.vehicle_accident_status_id IN (${getIds(filters.vehicle_accident_status_id).join(",")})`);
    if (filters.mfk_warrenty_id) where.push(`c.mfk_warrenty_id IN (${getIds(filters.mfk_warrenty_id).join(",")})`);
    if (filters.carCondition) where.push(`c.carCondition IN (${getIds(filters.carCondition).join(",")})`);

    if (filters.energy_efficiency) {
        const codes = getTextValues(filters.energy_efficiency)
            ?.map((item) => `'${String(item).replace(/'/g, "''").toUpperCase()}'`)
            .join(",");
        if (codes) where.push(`UPPER(TRIM(c.energy_efficiency)) IN (${codes})`);
    }

    if (filters.listing_age || filters.listing_age_days || filters.listingAge || filters.age) {
        const rawAge = filters.listing_age || filters.listing_age_days || filters.listingAge || filters.age;
        const days = getIds(rawAge).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
        if (days.length === 1) {
            where.push(`c.createdAt >= NOW() - INTERVAL ${days[0]} DAY`);
        } else if (days.length > 1) {
            where.push(`(${days.map((day) => `c.createdAt >= NOW() - INTERVAL ${day} DAY`).join(" OR ")})`);
        }
    }

    if (filters.mfk) {
        where.push(`c.mfk_status_id IS NOT NULL AND c.mfk_status_id NOT IN (4, 5)`);
    }
    if (filters.warranty) {
        where.push(`EXISTS (
            SELECT 1 FROM tbl_warranty_types wtt WHERE wtt.id = c.mfk_warrenty_id AND wtt.warranty_key IS NOT NULL AND TRIM(wtt.warranty_key) != '' AND wtt.warranty_key != 'no_warranty'
        )`);
    }
    if (filters.is_metallic === true || filters.is_metallic === 1 || filters.is_metallic === "1" || filters.is_metallic === "true" || filters.metallic === true || filters.metallic === 1 || filters.metallic === "1" || filters.metallic === "true") {
        where.push(`c.is_metallic = 1`);
    }

    const rawExtraFilterIds = filters.extra_filters ?? filters.extra_filter_ids ?? filters.extraFilters ?? filters.extras_filters ?? filters.extras;
    const extraFilterIds = getIds(rawExtraFilterIds);
    if (extraFilterIds.length) {
        const hasId6 = extraFilterIds.includes(6);
        const otherIds = extraFilterIds.filter((id) => id !== 6);
        const extraBranches = [];

        if (otherIds.length) {
            extraBranches.push(`EXISTS (
                SELECT 1
                FROM extras_options eo
                INNER JOIN tbl_car_feature cf
                    ON cf.feature_id = eo.real_name_id
                WHERE (eo.id IN (${otherIds.join(",")}) OR eo.real_name_id IN (${otherIds.join(",")}))
                  AND eo.is_active = 1
                  AND cf.car_id = c.id
            )`);
        }

        if (hasId6) {
            extraBranches.push(`(
                c.extras IS NOT NULL
                AND (
                    c.extras = '6'
                    OR FIND_IN_SET('6', REPLACE(REPLACE(REPLACE(c.extras, '[', ''), ']', ''), ' ', '')) > 0
                    OR LOWER(TRIM(c.extras)) = '8 tires'
                    OR LOWER(TRIM(c.extras)) = 'eight_tyres'
                    OR FIND_IN_SET('eight_tyres', REPLACE(LOWER(c.extras), ' ', '')) > 0
                )
            )`);
        }

        if (extraBranches.length) {
            where.push(`(${extraBranches.join(" OR ")})`);
        }
    }

    if (selectedBrandNames?.length) {
        const names = selectedBrandNames.map((x) => `'${x.replace(/'/g, "''").toLowerCase()}'`).join(",");
        where.push(`LOWER(TRIM(c.brandName)) IN (${names})`);
    }
    if (selectedModels?.length) {
        const names = selectedModels.map((x) => `'${x.replace(/'/g, "''").toLowerCase()}'`).join(",");
        where.push(`LOWER(TRIM(c.carModel)) IN (${names})`);
    }

    if (km_from !== undefined && km_to !== undefined) {
        where.push(`c.carMileage BETWEEN ${Number(km_from)} AND ${Number(km_to)}`);
    }

    if (hasFiniteNumber(price_from) && hasFiniteNumber(price_to)) {
        where.push(`c.selling_price BETWEEN ${Number(price_from)} AND ${Number(price_to)}`);
    } else if (hasFiniteNumber(price_from)) {
        where.push(`c.selling_price >= ${Number(price_from)}`);
    } else if (hasFiniteNumber(price_to)) {
        where.push(`c.selling_price <= ${Number(price_to)}`);
    }

    if (year_from !== undefined && year_to !== undefined) {
        where.push(`YEAR(c.first_registration_date) BETWEEN ${Number(year_from)} AND ${Number(year_to)}`);
    }
    if (hasFiniteNumber(seat_from) && hasFiniteNumber(seat_to)) {
        where.push(`CAST(NULLIF(c.sittingCapacity, '') AS UNSIGNED) BETWEEN ${Number(seat_from)} AND ${Number(seat_to)}`);
    }
    if (hasFiniteNumber(door_from) && hasFiniteNumber(door_to)) {
        where.push(`CAST(NULLIF(c.doors, '') AS UNSIGNED) BETWEEN ${Number(door_from)} AND ${Number(door_to)}`);
    }

    const normalizedPowerUnit = String(power_unit || "PS").toUpperCase() === "KW" ? "KW" : "PS";
    const powerExpression = normalizedPowerUnit === "KW"
        ? "CAST(NULLIF(c.power_kw, '') AS DECIMAL(15,2))"
        : "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2))";
    addNumericRange(powerExpression, power_from, power_to);
    addNumericRange("CAST(NULLIF(c.cubic_capacity, '') AS DECIMAL(15,2))", cubic_capacity_from, cubic_capacity_to);

    if (hasFiniteNumber(cylinders_from) || hasFiniteNumber(cylinders_to)) {
        const cylindersExpression = "CAST(NULLIF(c.cylinders, '') AS UNSIGNED)";
        where.push(`TRIM(c.cylinders) REGEXP '^[0-9]+$'`);
        where.push(`${cylindersExpression} IS NOT NULL`);
        if (hasFiniteNumber(cylinders_from)) where.push(`${cylindersExpression} >= ${Number(cylinders_from)}`);
        if (hasFiniteNumber(cylinders_to)) where.push(`${cylindersExpression} <= ${Number(cylinders_to)}`);
    }

    addNumericRange("CAST(NULLIF(c.battery_capacity, '') AS DECIMAL(15,2))", battery_capacity_from, battery_capacity_to);
    addNumericRange("CAST(NULLIF(c.total_weight, '') AS DECIMAL(15,2))", total_weight_from, total_weight_to);
    addNumericRange("CAST(NULLIF(c.empty_weight, '') AS DECIMAL(15,2))", empty_weight_from, empty_weight_to);
    addNumericRange("CAST(NULLIF(c.braked_towing_capacity_kg, '') AS DECIMAL(15,2))", towing_from, towing_to);
    addNumericRange("CAST(NULLIF(c.wltp_range, '') AS DECIMAL(15,2))", wltp_range_from, wltp_range_to);
    addNumericRange("CAST(NULLIF(c.consumption, '') AS DECIMAL(15,2))", consumption_from, consumption_to);
    addNumericRange("CAST(NULLIF(c.co2Emission, '') AS DECIMAL(15,2))", co2_from, co2_to);

    return where;
}

export function buildSellerJoinExtra(filters, selectedBrandNames, selectedModels) {
    const {
        year_from, year_to, km_from, km_to, price_from, price_to, seat_from, seat_to, door_from, door_to,
        power_from, power_to, power_unit, cubic_capacity_from, cubic_capacity_to, cylinders_from, cylinders_to,
        battery_capacity_from, battery_capacity_to, total_weight_from, total_weight_to, empty_weight_from, empty_weight_to,
        towing_from, towing_to, wltp_range_from, wltp_range_to, consumption_from, consumption_to, co2_from, co2_to
    } = filters;

    const sellerJoinExtra = [];
    const excludeUserId = hasFiniteNumber(filters.exclude_user_id ?? filters.excluded_user_id ?? filters.viewer_user_id ?? filters.viewerUserId)
        ? Number(filters.exclude_user_id ?? filters.excluded_user_id ?? filters.viewer_user_id ?? filters.viewerUserId)
        : null;
    if (excludeUserId && excludeUserId > 0) {
        sellerJoinExtra.push(`c.user_id <> ${excludeUserId}`);
    }

    const addSellerJoinNumericRange = (expression, fromValue, toValue) => {
        const hasFrom = hasFiniteNumber(fromValue);
        const hasTo = hasFiniteNumber(toValue);
        if (!hasFrom && !hasTo) return;
        sellerJoinExtra.push(`${expression} IS NOT NULL`);
        if (hasFrom) sellerJoinExtra.push(`${expression} >= ${Number(fromValue)}`);
        if (hasTo) sellerJoinExtra.push(`${expression} <= ${Number(toValue)}`);
    };

    if (filters.state_id) sellerJoinExtra.push(`c.state_id IN (${getIds(filters.state_id).join(",")})`);
    if (filters.body_type_id) sellerJoinExtra.push(`c.body_type_id IN (${getIds(filters.body_type_id).join(",")})`);
    if (filters.fuel_type_id) sellerJoinExtra.push(`c.fuel_type_id IN (${getIds(filters.fuel_type_id).join(",")})`);
    if (filters.transmission_id) sellerJoinExtra.push(`c.transmission_id IN (${getIds(filters.transmission_id).join(",")})`);
    if (filters.drive_type_id) sellerJoinExtra.push(`c.drive_type_id IN (${getIds(filters.drive_type_id).join(",")})`);
    if (filters.seller_type) {
        const accountTypeMap = { business: "company", personal: "private" };
        const values = getTextValues(filters.seller_type)
            .map((value) => value.toLowerCase())
            .map((value) => accountTypeMap[value] || value)
            .filter((value) => value === "company" || value === "private");
        if (values.length) sellerJoinExtra.push(`u.account_type IN (${values.map((value) => `'${value}'`).join(",")})`);
    }
    if (filters.interior_color_id) sellerJoinExtra.push(`c.interior_color_id IN (${getIds(filters.interior_color_id).join(",")})`);
    if (filters.exterior_color_id) sellerJoinExtra.push(`c.exterior_color_id IN (${getIds(filters.exterior_color_id).join(",")})`);
    if (filters.vehicle_accident_status_id) sellerJoinExtra.push(`c.vehicle_accident_status_id IN (${getIds(filters.vehicle_accident_status_id).join(",")})`);
    if (filters.mfk_warrenty_id) sellerJoinExtra.push(`c.mfk_warrenty_id IN (${getIds(filters.mfk_warrenty_id).join(",")})`);
    if (filters.carCondition) sellerJoinExtra.push(`c.carCondition IN (${getIds(filters.carCondition).join(",")})`);
    if (selectedBrandNames?.length) sellerJoinExtra.push(`LOWER(TRIM(c.brandName)) IN (${selectedBrandNames.map((x) => `'${String(x).replace(/'/g, "''").toLowerCase()}'`).join(",")})`);
    if (selectedModels?.length) sellerJoinExtra.push(`LOWER(TRIM(c.carModel)) IN (${selectedModels.map((x) => `'${String(x).replace(/'/g, "''").toLowerCase()}'`).join(",")})`);

    if (filters.energy_efficiency) {
        const codes = getTextValues(filters.energy_efficiency)?.map((item) => `'${String(item).replace(/'/g, "''").toUpperCase()}'`).join(",");
        if (codes) sellerJoinExtra.push(`UPPER(TRIM(c.energy_efficiency)) IN (${codes})`);
    }

    const sellerExtraFilterIds = getIds(filters.extra_filters ?? filters.extra_filter_ids ?? filters.extraFilters ?? filters.extras_filters ?? filters.extras);
    if (sellerExtraFilterIds.length) {
        const hasId6 = sellerExtraFilterIds.includes(6);
        const otherIds = sellerExtraFilterIds.filter((id) => id !== 6);
        const extraBranches = [];

        if (otherIds.length) {
            extraBranches.push(`EXISTS (
                SELECT 1
                FROM extras_options eo
                INNER JOIN tbl_car_feature cf
                    ON cf.feature_id = eo.real_name_id
                WHERE eo.id IN (${otherIds.join(",")})
                  AND eo.is_active = 1
                  AND cf.car_id = c.id
            )`);
        }

        if (hasId6) {
            extraBranches.push(`(
                c.extras IS NOT NULL
                AND (
                    c.extras = '6'
                    OR FIND_IN_SET('6', REPLACE(REPLACE(REPLACE(c.extras, '[', ''), ']', ''), ' ', '')) > 0
                    OR LOWER(TRIM(c.extras)) = '8 tires'
                    OR LOWER(TRIM(c.extras)) = 'eight_tyres'
                    OR FIND_IN_SET('eight_tyres', REPLACE(LOWER(c.extras), ' ', '')) > 0
                )
            )`);
        }

        if (extraBranches.length) {
            sellerJoinExtra.push(`(${extraBranches.join(" OR ")})`);
        }
    }

    if (filters.listing_age) {
        const days = getIds(filters.listing_age).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
        if (days.length === 1) {
            sellerJoinExtra.push(`c.createdAt <= NOW() - INTERVAL ${days[0]} DAY`);
        } else if (days.length > 1) {
            sellerJoinExtra.push(`(${days.map((day) => `c.createdAt <= NOW() - INTERVAL ${day} DAY`).join(" OR ")})`);
        }
    }

    const isOnlyChForSeller =
        filters.car_type === "only_ch_cars" ||
        filters.car_type === "ch" ||
        filters.is_swiss_vehicle === true ||
        filters.is_swiss_vehicle === 1 ||
        filters.is_swiss_vehicle === "1" ||
        filters.is_swiss_vehicle === "true" ||
        filters.isSwissVehicle === true ||
        filters.isSwissVehicle === 1 ||
        filters.isSwissVehicle === "1" ||
        filters.isSwissVehicle === "true";
    if (isOnlyChForSeller) {
        sellerJoinExtra.push(`c.is_swiss_vehicle = 1`);
    }

    if (hasFiniteNumber(km_from) && hasFiniteNumber(km_to)) {
        sellerJoinExtra.push(`c.carMileage BETWEEN ${Number(km_from)} AND ${Number(km_to)}`);
    }
    if (hasFiniteNumber(price_from) && hasFiniteNumber(price_to)) {
        sellerJoinExtra.push(`c.selling_price BETWEEN ${Number(price_from)} AND ${Number(price_to)}`);
    } else if (hasFiniteNumber(price_from)) {
        sellerJoinExtra.push(`c.selling_price >= ${Number(price_from)}`);
    } else if (hasFiniteNumber(price_to)) {
        sellerJoinExtra.push(`c.selling_price <= ${Number(price_to)}`);
    }
    if (hasFiniteNumber(year_from) && hasFiniteNumber(year_to)) {
        sellerJoinExtra.push(`YEAR(c.first_registration_date) BETWEEN ${Number(year_from)} AND ${Number(year_to)}`);
    }
    if (hasFiniteNumber(seat_from) && hasFiniteNumber(seat_to)) {
        sellerJoinExtra.push(`CAST(NULLIF(c.sittingCapacity, '') AS UNSIGNED) BETWEEN ${Number(seat_from)} AND ${Number(seat_to)}`);
    }
    if (hasFiniteNumber(door_from) && hasFiniteNumber(door_to)) {
        sellerJoinExtra.push(`CAST(NULLIF(c.doors, '') AS UNSIGNED) BETWEEN ${Number(door_from)} AND ${Number(door_to)}`);
    }

    const normalizedPowerUnit = String(power_unit || "PS").toUpperCase() === "KW" ? "KW" : "PS";
    const sellerPowerExpression = normalizedPowerUnit === "KW"
        ? "CAST(NULLIF(c.power_kw, '') AS DECIMAL(15,2))"
        : "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2))";
    addSellerJoinNumericRange(sellerPowerExpression, power_from, power_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.cubic_capacity, '') AS DECIMAL(15,2))", cubic_capacity_from, cubic_capacity_to);
    if (hasFiniteNumber(cylinders_from) || hasFiniteNumber(cylinders_to)) {
        const sellerCylindersExpression = "CAST(NULLIF(c.cylinders, '') AS UNSIGNED)";
        sellerJoinExtra.push(`TRIM(c.cylinders) REGEXP '^[0-9]+$'`);
        sellerJoinExtra.push(`${sellerCylindersExpression} IS NOT NULL`);
        if (hasFiniteNumber(cylinders_from)) sellerJoinExtra.push(`${sellerCylindersExpression} >= ${Number(cylinders_from)}`);
        if (hasFiniteNumber(cylinders_to)) sellerJoinExtra.push(`${sellerCylindersExpression} <= ${Number(cylinders_to)}`);
    }
    addSellerJoinNumericRange("CAST(NULLIF(c.battery_capacity, '') AS DECIMAL(15,2))", battery_capacity_from, battery_capacity_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.total_weight, '') AS DECIMAL(15,2))", total_weight_from, total_weight_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.empty_weight, '') AS DECIMAL(15,2))", empty_weight_from, empty_weight_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.braked_towing_capacity_kg, '') AS DECIMAL(15,2))", towing_from, towing_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.wltp_range, '') AS DECIMAL(15,2))", wltp_range_from, wltp_range_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.consumption, '') AS DECIMAL(15,2))", consumption_from, consumption_to);
    addSellerJoinNumericRange("CAST(NULLIF(c.co2Emission, '') AS DECIMAL(15,2))", co2_from, co2_to);

    return sellerJoinExtra;
}
