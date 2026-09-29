const KW_TO_PS = 1.35962;

const normalizePositiveIdArray = (values = []) =>
    values
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0);

const addInFilter = (conditions, params, column, values) => {
    const normalized = normalizePositiveIdArray(values);
    if (!normalized.length) return;

    conditions.push(`${column} IN (${normalized.map(() => "?").join(",")})`);
    params.push(...normalized);
};

const addMultiLikeFilter = (conditions, params, column, values = []) => {
    const normalized = values.map((item) => String(item).trim()).filter(Boolean);
    if (!normalized.length) return;

    conditions.push(`(${normalized.map(() => `${column} LIKE ?`).join(" OR ")})`);
    normalized.forEach((item) => params.push(`%${item}%`));
};

const toNullableNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeRange = (range = {}) => {
    const min = toNullableNumber(range.min);
    const max = toNullableNumber(range.max);

    if (min !== null && max !== null && min > max) {
        return {
            min: max,
            max: min
        };
    }

    return { min, max };
};

const convertPowerToPs = (value, unit) => {
    const numericValue = toNullableNumber(value);
    if (numericValue === null) return null;

    if (String(unit || "PS").toUpperCase() === "KW") {
        return Math.round(numericValue * KW_TO_PS);
    }

    return numericValue;
};

export const getPriceNumericExpression = (alias = "c", priceType = "purchase") => {
    if (String(priceType || "purchase").toLowerCase() === "leasing") {
        return `CAST(NULLIF(REPLACE(REPLACE(REPLACE(${alias}.leasingPrice, 'CHF', ''), ',', ''), ' ', ''), '') AS DECIMAL(15,2))`;
    }

    return `CAST(NULLIF(REPLACE(REPLACE(REPLACE(${alias}.selling_price, 'CHF', ''), ',', ''), ' ', ''), '') AS DECIMAL(15,2))`;
};

export const getYearNumericExpression = (alias = "c") =>
    `YEAR(${alias}.first_registration_date)`;

export const getMileageNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.carMileage, '') AS UNSIGNED)`;

export const getEnginePowerNumericExpression = (alias = "c") =>
    `COALESCE(CAST(NULLIF(${alias}.power_ps, '') AS DECIMAL(15,2)), CAST(NULLIF(${alias}.powerOutput, '') AS DECIMAL(15,2)))`;

export const getSeatNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.sittingCapacity, '') AS UNSIGNED)`;

export const getDoorNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.doors, '') AS UNSIGNED)`;

export const getCubicCapacityNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.cubic_capacity, '') AS DECIMAL(15,2))`;

export const getCylindersNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.cylinders, '') AS UNSIGNED)`;

export const getBatteryCapacityNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.battery_capacity, '') AS DECIMAL(15,2))`;

export const getTotalWeightNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.total_weight, '') AS DECIMAL(15,2))`;

export const getEmptyWeightNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.empty_weight, '') AS DECIMAL(15,2))`;

export const getTowingCapacityNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.braked_towing_capacity_kg, '') AS DECIMAL(15,2))`;

export const getWltpRangeNumericExpression = (alias = "c") =>
    `CAST(NULLIF(${alias}.wltp_range, '') AS DECIMAL(15,2))`;

export const getConsumptionNumericExpression = (alias = "c") =>
  `CAST(NULLIF(${alias}.consumption, '') AS DECIMAL(15,2))`;

export const getCo2EmissionNumericExpression = (alias = "c") =>
  `CAST(NULLIF(${alias}.co2Emission, '') AS DECIMAL(15,2))`;


export const buildFacetedConditions = (
    filters = {},
    { alias = "c", excludeFacet = null } = {}
) => {
    const conditions = [
        `${alias}.is_active = 1`,
        `${alias}.is_deleted = 0`,
        `${alias}.listing_status = 'published'`
    ];
    const params = [];

    const excludedUser = toNullableNumber(filters.exclude_user_id ?? filters.excluded_user_id ?? filters.viewer_user_id ?? filters.viewerUserId);
    if (excludedUser && excludedUser > 0) {
        conditions.push(`${alias}.user_id <> ?`);
        params.push(excludedUser);
    }

    if (excludeFacet !== "fuel") {
        addInFilter(conditions, params, `${alias}.fuel_type_id`, filters.fuel_type_ids || []);
    }

    if (excludeFacet !== "transmission") {
        addInFilter(
            conditions,
            params,
            `${alias}.transmission_id`,
            filters.transmission_ids || []
        );
    }

    if (excludeFacet !== "body_type") {
        addInFilter(
            conditions,
            params,
            `${alias}.body_type_id`,
            filters.body_type_ids || []
        );
    }

    if (excludeFacet !== "drive") {
        addInFilter(conditions, params, `${alias}.drive_type_id`, filters.drive_ids || []);
    }

    if (excludeFacet !== "state") {
        addInFilter(conditions, params, `${alias}.state_id`, filters.state_ids || []);
    }

    if (excludeFacet !== "accident_status") {
        addInFilter(
            conditions,
            params,
            `${alias}.vehicle_accident_status_id`,
            filters.accident_status_ids || []
        );
    }

    if (excludeFacet !== "mfk_warranty") {
        addInFilter(
            conditions,
            params,
            `${alias}.mfk_warrenty_id`,
            filters.mfk_warranty_ids || []
        );
    }

    if (excludeFacet !== "vehicle_condition") {
        addInFilter(
            conditions,
            params,
            `${alias}.carCondition`,
            filters.vehicle_condition_ids || []
        );
    }

    if (excludeFacet !== "energy_efficiency") {
        const normalizedEnergy = (filters.energy_efficiency_codes || [])
            .map((code) => String(code).trim().toUpperCase())
            .filter(Boolean);
        if (normalizedEnergy.length) {
            conditions.push(
                `UPPER(TRIM(${alias}.energy_efficiency)) IN (${normalizedEnergy.map(() => "?").join(",")})`
            );
            params.push(...normalizedEnergy);
        }
    }

    if (excludeFacet !== "listing_age") {
        const days = (filters.listing_age_days || [])
            .map((d) => Number(d))
            .filter((d) => Number.isFinite(d) && d > 0);
        if (days.length) {
            const clauses = days.map(() => `${alias}.createdAt >= (NOW() - INTERVAL ? DAY)`);
            conditions.push(`(${clauses.join(" OR ")})`);
            params.push(...days);
        }
    }

    if (excludeFacet !== "exterior_color") {
        addInFilter(
            conditions,
            params,
            `${alias}.exterior_color_id`,
            filters.exterior_color_ids || [] 
        );
    }

    if (excludeFacet !== "interior_color") {
        addInFilter(
            conditions,
            params,
            `${alias}.interior_color_id`,
            filters.interior_color_ids || []
        );
    }

    if (excludeFacet !== "brand") {
        addMultiLikeFilter(conditions, params, `${alias}.brandName`, filters.brand_names || []);
    }
    
    if (excludeFacet !== "model") {
        addMultiLikeFilter(conditions, params, `${alias}.carModel`, filters.model_names || []);
    }

    // commented by raj for faceted filters:
    if (excludeFacet !== "seller_type") {
        const sellerTypes = (filters.seller_types || [])
            .map((item) => String(item).toLowerCase())
            .filter(Boolean);
        if (sellerTypes.length) {
            const mappedAccountTypes = sellerTypes
                .map((item) => item === "business" ? "company" : item === "personal" ? "private" : item)
                .filter(Boolean);
            conditions.push(
                `${alias}.user_id IN (SELECT id FROM tbl_users WHERE account_type IN (${mappedAccountTypes.map(() => "?").join(",")}))`
            );
            params.push(...mappedAccountTypes);
        }
    }

    if (filters.search_text) {
        conditions.push(`(${alias}.brandName LIKE ? OR ${alias}.carModel LIKE ?)`);
        params.push(`%${filters.search_text}%`, `%${filters.search_text}%`);
    }

    const normalizedPrice = normalizeRange(filters.price || {});
    if (excludeFacet !== "price") {
        const priceExpression = getPriceNumericExpression(alias, filters?.price?.type || "purchase");
        if (normalizedPrice.min !== null) {
            conditions.push(`${priceExpression} >= ?`);
            params.push(normalizedPrice.min);
        }
        if (normalizedPrice.max !== null) {
            conditions.push(`${priceExpression} <= ?`);
            params.push(normalizedPrice.max);
        }
    }

    const normalizedYear = normalizeRange(filters.year || {});
    if (excludeFacet !== "year") {
        const yearExpression = getYearNumericExpression(alias);
        if (normalizedYear.min !== null) {
            conditions.push(`${yearExpression} >= ?`);
            params.push(normalizedYear.min);
        }
        if (normalizedYear.max !== null) {
            conditions.push(`${yearExpression} <= ?`);
            params.push(normalizedYear.max);
        }
    }

    const normalizedMileage = normalizeRange(filters.mileage || {});
    if (excludeFacet !== "mileage") {
        const mileageExpression = getMileageNumericExpression(alias);
        if (normalizedMileage.min !== null) {
            conditions.push(`${mileageExpression} >= ?`);
            params.push(normalizedMileage.min);
        }
        if (normalizedMileage.max !== null) {
            conditions.push(`${mileageExpression} <= ?`);
            params.push(normalizedMileage.max);
        }
    }

    const normalizedPower = normalizeRange(filters.engine_power || {});
    if (excludeFacet !== "engine_power") {
        const powerExpression = getEnginePowerNumericExpression(alias);
        const convertedMin = convertPowerToPs(normalizedPower.min, filters?.engine_power?.unit);
        const convertedMax = convertPowerToPs(normalizedPower.max, filters?.engine_power?.unit);

        if (convertedMin !== null) {
            conditions.push(`${powerExpression} >= ?`);
            params.push(convertedMin);
        }
        if (convertedMax !== null) {
            conditions.push(`${powerExpression} <= ?`);
            params.push(convertedMax);
        }
    }

    const normalizedSeat = normalizeRange(filters.seat || {});
    if (excludeFacet !== "seat") {
        const seatExpression = getSeatNumericExpression(alias);
        if (normalizedSeat.min !== null) {
            conditions.push(`${seatExpression} >= ?`);
            params.push(normalizedSeat.min);
        }
        if (normalizedSeat.max !== null) {
            conditions.push(`${seatExpression} <= ?`);
            params.push(normalizedSeat.max);
        }
    }

    const normalizedDoor = normalizeRange(filters.door || {});
    if (excludeFacet !== "door") {
        const doorExpression = getDoorNumericExpression(alias);
        if (normalizedDoor.min !== null) {
            conditions.push(`${doorExpression} >= ?`);
            params.push(normalizedDoor.min);
        }
        if (normalizedDoor.max !== null) {
            conditions.push(`${doorExpression} <= ?`);
            params.push(normalizedDoor.max);
        }
    }

    const normalizedCubicCapacity = normalizeRange(filters.cubic_capacity || {});
if (excludeFacet !== "cubic_capacity") {
    const expr = getCubicCapacityNumericExpression(alias);
    if (normalizedCubicCapacity.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedCubicCapacity.min);
    }
    if (normalizedCubicCapacity.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedCubicCapacity.max);
    }
}

const normalizedCylinders = normalizeRange(filters.cylinders || {});
if (excludeFacet !== "cylinders") {
    const expr = getCylindersNumericExpression(alias);
    if (normalizedCylinders.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedCylinders.min);
    }
    if (normalizedCylinders.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedCylinders.max);
    }
}

const normalizedBatteryCapacity = normalizeRange(filters.battery_capacity || {});
if (excludeFacet !== "battery_capacity") {
    const expr = getBatteryCapacityNumericExpression(alias);
    if (normalizedBatteryCapacity.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedBatteryCapacity.min);
    }
    if (normalizedBatteryCapacity.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedBatteryCapacity.max);
    }
}

const normalizedTotalWeight = normalizeRange(filters.total_weight || {});
if (excludeFacet !== "total_weight") {
    const expr = getTotalWeightNumericExpression(alias);
    if (normalizedTotalWeight.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedTotalWeight.min);
    }
    if (normalizedTotalWeight.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedTotalWeight.max);
    }
}

const normalizedEmptyWeight = normalizeRange(filters.empty_weight || {});
if (excludeFacet !== "empty_weight") {
    const expr = getEmptyWeightNumericExpression(alias);
    if (normalizedEmptyWeight.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedEmptyWeight.min);
    }
    if (normalizedEmptyWeight.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedEmptyWeight.max);
    }
}

const normalizedTowingCapacity = normalizeRange(filters.towing_capacity || {});
if (excludeFacet !== "towing_capacity") {
    const expr = getTowingCapacityNumericExpression(alias);
    if (normalizedTowingCapacity.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedTowingCapacity.min);
    }
    if (normalizedTowingCapacity.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedTowingCapacity.max);
    }
}

const normalizedWltpRange = normalizeRange(filters.wltp_range || {});
if (excludeFacet !== "wltp_range") {
    const expr = getWltpRangeNumericExpression(alias);
    if (normalizedWltpRange.min !== null) {
        conditions.push(`${expr} >= ?`);
        params.push(normalizedWltpRange.min);
    }
    if (normalizedWltpRange.max !== null) {
        conditions.push(`${expr} <= ?`);
        params.push(normalizedWltpRange.max);
    }
}

const normalizedConsumption = normalizeRange(filters.consumption || {});
if (excludeFacet !== "consumption") {
  const expr = getConsumptionNumericExpression(alias);
  if (normalizedConsumption.min !== null) {
    conditions.push(`${expr} >= ?`);
    params.push(normalizedConsumption.min);
  }
  if (normalizedConsumption.max !== null) {
    conditions.push(`${expr} <= ?`);
    params.push(normalizedConsumption.max);
  }
}

const normalizedCo2 = normalizeRange(filters.co2_emission || {});
if (excludeFacet !== "co2_emission") {
  const expr = getCo2EmissionNumericExpression(alias);
  if (normalizedCo2.min !== null) {
    conditions.push(`${expr} >= ?`);
    params.push(normalizedCo2.min);
  }
  if (normalizedCo2.max !== null) {
    conditions.push(`${expr} <= ?`);
    params.push(normalizedCo2.max);
  }
}

// MFK FILTER
// ============================================

if (
    excludeFacet !== "mfk" &&
    filters.mfk === true
) {
    conditions.push(`
        ${alias}.mfk_status_id IS NOT NULL
        AND ${alias}.mfk_status_id NOT IN (4, 5)
    `);
}


if (
    excludeFacet !== "warranty" &&
    filters.warranty === true
) {
    conditions.push(`
        EXISTS (
            SELECT 1
            FROM tbl_warranty_types wtt
            WHERE wtt.id = ${alias}.mfk_warrenty_id
              AND wtt.warranty_key IS NOT NULL
              AND wtt.warranty_key != 'no_warranty'
        )
    `);
}

// ============================================
// METALLIC FILTER
// ============================================

if (
    excludeFacet !== "is_metallic" &&
    excludeFacet !== "metallic" &&
    (filters.is_metallic === true || filters.metallic === true)
) {
    conditions.push(`${alias}.is_metallic = 1`);
}

// ============================================
// EXTRA FILTERS
// ============================================

if (excludeFacet !== "extra_filters") {
    const rawExtraFilterIds = filters.extra_filter_ids || filters.extra_filters || [];
    const normalizedExtraFilterIds = normalizePositiveIdArray(rawExtraFilterIds);
    if (normalizedExtraFilterIds.length) {
        const hasId6 = normalizedExtraFilterIds.includes(6);
        const otherIds = normalizedExtraFilterIds.filter((id) => id !== 6);

        const extraBranches = [];

        if (otherIds.length) {
            extraBranches.push(`EXISTS (
                SELECT 1
                FROM extras_options eo
                INNER JOIN tbl_car_feature cf
                    ON cf.feature_id = eo.real_name_id
                WHERE (eo.id IN (${otherIds.map(() => "?").join(",")}) OR eo.real_name_id IN (${otherIds.map(() => "?").join(",")}))
                  AND eo.is_active = 1
                  AND cf.car_id = ${alias}.id
            )`);
            params.push(...otherIds, ...otherIds);
        }

        if (hasId6) {
            extraBranches.push(`(
                ${alias}.extras IS NOT NULL
                AND (
                    ${alias}.extras = '6'
                    OR FIND_IN_SET('6', REPLACE(REPLACE(REPLACE(${alias}.extras, '[', ''), ']', ''), ' ', '')) > 0
                    OR LOWER(TRIM(${alias}.extras)) = '8 tires'
                    OR LOWER(TRIM(${alias}.extras)) = 'eight_tyres'
                    OR FIND_IN_SET('eight_tyres', REPLACE(LOWER(${alias}.extras), ' ', '')) > 0
                )
            )`);
        }

        if (extraBranches.length) {
            conditions.push(`(${extraBranches.join(" OR ")})`);
        }
    }
}

    return { conditions, params };
};

export const buildWhereClause = (conditions = []) => {
    if (!conditions.length) return "";
    return `WHERE ${conditions.join(" AND ")}`;
};

export const buildJoinConditions = (conditions = []) => {
    if (!conditions.length) return "";
    return conditions.join(" AND ");
};

export const normalizeSelectedRange = normalizeRange;
export const convertPowerSelectionToPs = convertPowerToPs;
