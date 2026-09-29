
// ----------------------------------new code for faceted filter with elastic search-------------------------//

import db from "../config/db.js";
import {
    buildFacetedConditions,
    buildJoinConditions,
    buildWhereClause,
    convertPowerSelectionToPs,
    getDoorNumericExpression,
    getEnginePowerNumericExpression,
    getMileageNumericExpression,
    getPriceNumericExpression,
    getSeatNumericExpression,
    getYearNumericExpression,
    normalizeSelectedRange,
    getCubicCapacityNumericExpression,
    getCylindersNumericExpression,
    getBatteryCapacityNumericExpression,
    getTotalWeightNumericExpression,
    getEmptyWeightNumericExpression,
    getTowingCapacityNumericExpression,
    getWltpRangeNumericExpression,
    getCo2EmissionNumericExpression,
    getConsumptionNumericExpression
} from "../services/facetedFilters/buildFacetWhereClause.js";

const toSafeNumber = (value, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toNullableNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

export const getFacetedTotalCarsModel = async (filters = {}, excludeFacet = null) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet
    });
    const whereClause = buildWhereClause(conditions);

    const rows = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_cars c
        ${whereClause}
        `,
        params
    );

    return toSafeNumber(rows[0]?.total, 0);
};

const getFuelFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "fuel"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            fc.code AS category,
            ft.id,
            ft.code,
            ftt.label,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_fuel_categories fc
        JOIN tbl_fuel_types ft
          ON ft.category_id = fc.id
         AND ft.is_active = 1
        JOIN tbl_fuel_type_translations ftt
          ON ftt.fuel_type_id = ft.id
         AND ftt.lang = ?
        LEFT JOIN tbl_cars car
          ON car.fuel_type_id = ft.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY fc.code, ft.id, ft.code, ftt.label
        ORDER BY fc.id ASC, ft.id ASC
        `,
        [lang, ...params]
    );

    const categories = {};
    rows.forEach((row) => {
        if (!categories[row.category]) {
            categories[row.category] = [];
        }

        categories[row.category].push({
            id: row.id,
            code: row.code,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        });
    });

    return {
        categories,
        total_cars: await getFacetedTotalCarsModel(filters, "fuel")
    };
};

const getTransmissionFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "transmission"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            t.id,
            t.code,
            tt.label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_transmissions t
        JOIN tbl_transmission_translations tt
          ON tt.transmission_id = t.id
         AND tt.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.transmission_id = t.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE t.is_active = 1
        GROUP BY t.id, t.code, tt.label
        ORDER BY t.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "transmission")
    };
};

const getBodyTypeFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "body_type"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            bt.id,
            bt.code,
            bt.image,
            btt.label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_body_types bt
        JOIN tbl_body_type_translations btt
          ON btt.body_type_id = bt.id
         AND btt.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.body_type_id = bt.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE bt.is_active = 1
        GROUP BY bt.id, bt.code, bt.image, btt.label
        ORDER BY bt.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            image: row.image,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "body_type")
    };
};

const getDriveFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "drive"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            d.id,
            d.code,
            dt.label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_drives d
        JOIN tbl_drive_translations dt
          ON dt.drive_id = d.id
         AND dt.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.drive_type_id = d.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE d.is_active = 1
        GROUP BY d.id, d.code, dt.label
        ORDER BY d.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "drive")
    };
};

const getStateFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "state"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            vs.id,
            vs.code,
            vst.label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_vehicle_states vs
        JOIN tbl_vehicle_state_translations vst
          ON vst.vehicle_state_id = vs.id
         AND vst.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.state_id = vs.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE vs.is_active = 1
        GROUP BY vs.id, vs.code, vst.label
        ORDER BY vs.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "state")
    };
};

const getAccidentStatusFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "accident_status"
    });

    const whereClause = buildWhereClause(conditions);

    const statusRows = await db.query(
        `
        SELECT
            vas.id,
            vas.code,
            vast.label
        FROM tbl_vehicle_accident_status vas
        JOIN tbl_vehicle_accident_status_translations vast
          ON vast.accident_status_id = vas.id
         AND vast.language_code = ?
        WHERE vas.is_active = 1
        ORDER BY vas.id ASC
        `,
        [lang]
    );

    const statusCounts = await db.query(
        `
        SELECT
            c.vehicle_accident_status_id AS status_id,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_cars c
        ${whereClause}
        GROUP BY c.vehicle_accident_status_id
        `,
        params
    );

    const countsByStatus = statusCounts.reduce((acc, row) => {
        acc[row.status_id] = toSafeNumber(row.total, 0);
        return acc;
    }, {});

    return {
        options: statusRows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: countsByStatus[row.id] || 0
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "accident_status")
    };
};

const getMfkWarrantyFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "mfk_warranty"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            vmw.id,
            vmw.code,
            vmwt.label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_vehicle_mfk_warranty vmw
        JOIN tbl_vehicle_mfk_warranty_translations vmwt
          ON vmwt.mfk_warranty_id = vmw.id
         AND vmwt.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.mfk_warrenty_id = vmw.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE vmw.is_active = 1
        GROUP BY vmw.id, vmw.code, vmwt.label
        ORDER BY vmw.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "mfk_warranty")
    };
};

const getVehicleConditionFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "vehicle_condition"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            vc.id,
            vct.name AS label,
            COUNT(DISTINCT c.id) AS car_count
        FROM tbl_vehicle_conditions vc
        JOIN tbl_vehicle_condition_translations vct
          ON vct.condition_id = vc.id
         AND vct.language_code = ?
        LEFT JOIN tbl_cars c
          ON c.carCondition = vc.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE vc.is_active = 1
        GROUP BY vc.id, vct.name
        ORDER BY vc.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "vehicle_condition")
    };
};

const getEnergyEfficiencyFacetModel = async (filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "energy_efficiency"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            codes.code,
            COUNT(DISTINCT car.id) AS car_count
        FROM (
            SELECT 'A' AS code UNION ALL
            SELECT 'B' UNION ALL
            SELECT 'C' UNION ALL
            SELECT 'D' UNION ALL
            SELECT 'E' UNION ALL
            SELECT 'F' UNION ALL
            SELECT 'G'
        ) codes
        LEFT JOIN tbl_cars car
            ON UPPER(TRIM(car.energy_efficiency)) = codes.code
           ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY codes.code
        ORDER BY codes.code ASC
        `,
        params
    );

    return {
        options: rows.map((row, idx) => ({
            id: idx + 1,
            code: row.code,
            label: row.code,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "energy_efficiency")
    };
};

const getListingAgeFacetModel = async (filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "listing_age"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            buckets.days,
            COUNT(DISTINCT c.id) AS car_count
        FROM (
            SELECT 1 AS days UNION ALL
            SELECT 2 UNION ALL
            SELECT 3 UNION ALL
            SELECT 5 UNION ALL
            SELECT 7 UNION ALL
            SELECT 14 UNION ALL
            SELECT 28
        ) buckets
        LEFT JOIN tbl_cars c
          ON c.createdAt >= (NOW() - INTERVAL buckets.days DAY)
         ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY buckets.days
        ORDER BY buckets.days ASC
        `,
        params
    );

    return {
        options: rows.map((row) => ({
            id: row.days,
            label: `${row.days} day`,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "listing_age")
    };
};

const getExteriorColorFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "exterior_color"
    });

    const joinConditions = buildJoinConditions(conditions);
    const metallicWhere = buildWhereClause([...conditions, "car.is_metallic = 1"]);
    const metallicRows = await db.query(
        `
        SELECT COUNT(*) AS car_count
        FROM tbl_cars car
        ${metallicWhere}
        `,
        params
    );
    const metallicCount = toSafeNumber(metallicRows[0]?.car_count, 0);
    const rows = await db.query(
        `
        SELECT
            clr.id,
            clr.hex_code,
            ct.name AS label,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_colors clr
        JOIN tbl_color_translations ct
          ON ct.color_id = clr.id
         AND ct.language_code = ?
        LEFT JOIN tbl_cars car
          ON car.exterior_color_id = clr.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE clr.is_active = 1
        GROUP BY clr.id, clr.hex_code, ct.name
        ORDER BY ct.name ASC
        `,
        [lang, ...params]
    );

    return {
        metallic_count: metallicCount,
        options: rows.map((row) => ({
            id: row.id,
            label: row.label,
            hex_code: row.hex_code,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "exterior_color")
    };
};

const getInteriorColorFacetModel = async (lang, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "interior_color"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            clr.id,
            clr.hex_code,
            ct.name AS label,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_colors clr
        JOIN tbl_color_translations ct
          ON ct.color_id = clr.id
         AND ct.language_code = ?
        LEFT JOIN tbl_cars car
          ON car.interior_color_id = clr.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE clr.is_active = 1
        GROUP BY clr.id, clr.hex_code, ct.name
        ORDER BY ct.name ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            label: row.label,
            hex_code: row.hex_code,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "interior_color")
    };
};

const getRangeFacetSummary = async ({
    filters = {},
    excludeFacet,
    expression,
    selectedMin = null,
    selectedMax = null
}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet
    });

    const whereConditions = [...conditions, `${expression} IS NOT NULL`];
    const whereClause = buildWhereClause(whereConditions);

    const rangeRows = await db.query(
        `
        SELECT
            COUNT(*) AS total_cars,
            MIN(${expression}) AS min_value,
            MAX(${expression}) AS max_value
        FROM tbl_cars c
        ${whereClause}
        `,
        params
    );

    const totalCars = toSafeNumber(rangeRows[0]?.total_cars, 0);
    const minValue = toNullableNumber(rangeRows[0]?.min_value);
    const maxValue = toNullableNumber(rangeRows[0]?.max_value);

    if (!totalCars || minValue === null || maxValue === null) {
        return {
            total_cars: totalCars,
            min_value: minValue,
            max_value: maxValue,
            selected_range: null,
            breakdown: {
                selected_count: 0,
                lower_count: 0,
                higher_count: 0
            }
        };
    }

    let normalizedSelectedMin = selectedMin ?? minValue;
    let normalizedSelectedMax = selectedMax ?? maxValue;

    if (normalizedSelectedMin > normalizedSelectedMax) {
        const swapValue = normalizedSelectedMin;
        normalizedSelectedMin = normalizedSelectedMax;
        normalizedSelectedMax = swapValue;
    }

    const selectedRows = await db.query(
        `
        SELECT
            COUNT(CASE WHEN ${expression} >= ? AND ${expression} <= ? THEN 1 END) AS selected_count,
            COUNT(CASE WHEN ${expression} < ? THEN 1 END) AS lower_count,
            COUNT(CASE WHEN ${expression} > ? THEN 1 END) AS higher_count
        FROM tbl_cars c
        ${whereClause}
        `,
        [
            normalizedSelectedMin,
            normalizedSelectedMax,
            normalizedSelectedMin,
            normalizedSelectedMax,
            ...params
        ]
    );

    const selectedCount = toSafeNumber(selectedRows[0]?.selected_count, 0);
    const lowerCount = toSafeNumber(selectedRows[0]?.lower_count, 0);
    const higherCount = toSafeNumber(selectedRows[0]?.higher_count, 0);

    return {
        total_cars: totalCars,
        min_value: minValue,
        max_value: maxValue,
        selected_range: {
            from: normalizedSelectedMin,
            to: normalizedSelectedMax,
            has_selection: selectedMin !== null || selectedMax !== null
        },
        breakdown: {
            selected_count: selectedCount,
            lower_count: lowerCount,
            higher_count: higherCount
        }
    };
};

const getPriceFacetModel = async (filters = {}) => {
    const normalizedPriceRange = normalizeSelectedRange(filters.price || {});
    const priceExpression = getPriceNumericExpression("c", filters?.price?.type || "purchase");

    const summary = await getRangeFacetSummary({
        filters,
        excludeFacet: "price",
        expression: priceExpression,
        selectedMin: normalizedPriceRange.min,
        selectedMax: normalizedPriceRange.max
    });

    return {
        ...summary,
        price_type: String(filters?.price?.type || "purchase").toLowerCase()
    };
};

const getYearFacetModel = async (filters = {}) => {
    const normalizedYearRange = normalizeSelectedRange(filters.year || {});
    const yearExpression = getYearNumericExpression("c");

    return getRangeFacetSummary({
        filters,
        excludeFacet: "year",
        expression: yearExpression,
        selectedMin: normalizedYearRange.min,
        selectedMax: normalizedYearRange.max
    });
};

const getMileageFacetModel = async (filters = {}) => {
    const normalizedMileageRange = normalizeSelectedRange(filters.mileage || {});
    const mileageExpression = getMileageNumericExpression("c");

    return getRangeFacetSummary({
        filters,
        excludeFacet: "mileage",
        expression: mileageExpression,
        selectedMin: normalizedMileageRange.min,
        selectedMax: normalizedMileageRange.max
    });
};

const getEnginePowerFacetModel = async (filters = {}) => {
    const normalizedPowerRange = normalizeSelectedRange(filters.engine_power || {});
    const selectedMinPs = convertPowerSelectionToPs(
        normalizedPowerRange.min,
        filters?.engine_power?.unit
    );
    const selectedMaxPs = convertPowerSelectionToPs(
        normalizedPowerRange.max,
        filters?.engine_power?.unit
    );
    const enginePowerExpression = getEnginePowerNumericExpression("c");

    const summary = await getRangeFacetSummary({
        filters,
        excludeFacet: "engine_power",
        expression: enginePowerExpression,
        selectedMin: selectedMinPs,
        selectedMax: selectedMaxPs
    });

    return {
        ...summary,
        input_unit: String(filters?.engine_power?.unit || "PS").toUpperCase()
    };
};

const getSeatFacetModel = async (filters = {}) => {
    const normalizedSeatRange = normalizeSelectedRange(filters.seat || {});
    const seatExpression = getSeatNumericExpression("c");

    return getRangeFacetSummary({
        filters,
        excludeFacet: "seat",
        expression: seatExpression,
        selectedMin: normalizedSeatRange.min,
        selectedMax: normalizedSeatRange.max
    });
};

const getDoorFacetModel = async (filters = {}) => {
    const normalizedDoorRange = normalizeSelectedRange(filters.door || {});
    const doorExpression = getDoorNumericExpression("c");

    return getRangeFacetSummary({
        filters,
        excludeFacet: "door",
        expression: doorExpression,
        selectedMin: normalizedDoorRange.min,
        selectedMax: normalizedDoorRange.max
    });
};

const getCubicCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.cubic_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "cubic_capacity",
        expression: getCubicCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getCylindersFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.cylinders || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "cylinders",
        expression: getCylindersNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getBatteryCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.battery_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "battery_capacity",
        expression: getBatteryCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getTotalWeightFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.total_weight || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "total_weight",
        expression: getTotalWeightNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getEmptyWeightFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.empty_weight || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "empty_weight",
        expression: getEmptyWeightNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getTowingCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.towing_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "towing_capacity",
        expression: getTowingCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getWltpRangeFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.wltp_range || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "wltp_range",
        expression: getWltpRangeNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getConsumptionFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.consumption || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "consumption",
        expression: getConsumptionNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

const getCo2EmissionFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.co2_emission || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "co2_emission",
        expression: getCo2EmissionNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

// Seller type facet (counts + active_filters)
export const getSellerTypeFacetModel = async (filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "seller_type"
    });

    const joinConditions = buildJoinConditions(conditions);

    const rows = await db.query(
        `
        SELECT
            LOWER(TRIM(u.account_type)) AS seller_type,
            COUNT(c.id) AS car_count
        FROM tbl_users u
        JOIN tbl_cars c
          ON c.user_id = u.id
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE LOWER(TRIM(u.account_type)) IN ('company', 'private')
        GROUP BY seller_type
        `,
        params
    );

    const counts = rows.reduce((acc, row) => {
        acc[String(row.seller_type).toLowerCase()] = Number(row.car_count) || 0;
        return acc;
    }, {});

    const totalCars = await getFacetedTotalCarsModel(filters, "seller_type");

    const privateCount = counts.private ?? counts.personal ?? 0;
    return {
        options: [
            { code: "private", label: "Private", count: privateCount },
            { code: "company", label: "Company", count: counts.company ?? counts.business ?? 0 },
            { code: "all", label: "All Standard", count: totalCars }
        ],
        total_cars: totalCars
    };
};

export const getBrandsFacetListModel = async (filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "brand"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            b.id,
            b.brand_name,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_vehicle_catalog_brands b
        LEFT JOIN tbl_cars car
          ON LOWER(TRIM(car.brandName)) = LOWER(TRIM(b.brand_name))
         ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY b.id, b.brand_name
        ORDER BY b.brand_name ASC
        `,
        params
    );

    return rows.map((row) => ({
        id: row.id,
        brand_name: row.brand_name,
        count: toSafeNumber(row.car_count, 0)
    }));
};

export const getModelsFacetListModel = async (brand_id, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "model"
    });

    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            m.id,
            m.brand_id,
            m.vehicle_type,
            m.model_name,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_vehicle_catalog_models m
        JOIN tbl_vehicle_catalog_brands b
          ON b.id = m.brand_id
        LEFT JOIN tbl_cars car
          ON LOWER(TRIM(car.carModel)) = LOWER(TRIM(m.model_name))
         AND LOWER(TRIM(car.brandName)) = LOWER(TRIM(b.brand_name))
         ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE m.brand_id = ?
        GROUP BY m.id, m.brand_id, m.vehicle_type, m.model_name
        ORDER BY m.model_name ASC
        `,
        [...params, brand_id]
    );

    return rows.map((row) => ({
        id: row.id,
        brand_id: row.brand_id,
        vehicle_type: row.vehicle_type,
        model_name: row.model_name,
        count: toSafeNumber(row.car_count, 0)
    }));
};

export const getFacetedFiltersSnapshotModel = async (lang = "en", filters = {}) => {
    const totalCars = await getFacetedTotalCarsModel(filters);
    const fuelFacet = await getFuelFacetModel(lang, filters);
    const transmissionFacet = await getTransmissionFacetModel(lang, filters);
    const bodyTypeFacet = await getBodyTypeFacetModel(lang, filters);
    const driveFacet = await getDriveFacetModel(lang, filters);
    const stateFacet = await getStateFacetModel(lang, filters);
    const accidentStatusFacet = await getAccidentStatusFacetModel(lang, filters);
    const mfkWarrantyFacet = await getMfkWarrantyFacetModel(lang, filters);
    const priceFacet = await getPriceFacetModel(filters);
    const yearFacet = await getYearFacetModel(filters);
    const mileageFacet = await getMileageFacetModel(filters);
    const enginePowerFacet = await getEnginePowerFacetModel(filters);
    const seatFacet = await getSeatFacetModel(filters);
    const doorFacet = await getDoorFacetModel(filters);

    return {
        total_cars: totalCars,
        facets: {
            fuel: fuelFacet,
            transmission: transmissionFacet,
            body_type: bodyTypeFacet,
            drive: driveFacet,
            state: stateFacet,
            accident_status: accidentStatusFacet,
            mfk_warranty: mfkWarrantyFacet,
            price: priceFacet,
            year: yearFacet,
            mileage: mileageFacet,
            engine_power: enginePowerFacet,
            seat: seatFacet,
            door: doorFacet
        }
    };
};
// model for final filtering 

// const getFilteredCarsByAllFilters = async (

//     brandNameFilter,        
//     carModelFilter,
//      fuelFilter ,
//      yearFilter , 
//      kilometerFilter ,
//      priceFilter,
//      leasingFilter,
//      driveFilter,
//     stateFilter,
//     accidentFilter,
//     bodyTypeFilter,
//     transmissionFilter,
//     powerFilter,
//     cubicFilter,
//     cylindersFilter,
//     wltpFilter,
//     batteryFilter,
//     towingFilter,
//     totalWeightFilter,
//     emptyWeightFilter,
//     seatsFilter,
//     doorsFilter,
//     co2Filter,
//     energyFilter,
//     exteriorColorFilter,
//     interiorColorFilter,
//     consumptionFilter,
//     ageFilter,
//     sellerTypeFilter,
//     excludedUserId = null
//                    ) => {

// //-------------------------added for array ------------------------//
// const normalizeIds = (value) => {
//   if (value === null || value === undefined || value === "") return [];
//   if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
//   const n = Number(value);
//   return Number.isFinite(n) ? [n] : [];
// };

// const normalizePositiveId = (value) => {
//   const n = Number(value);
//   return Number.isFinite(n) && n > 0 ? n : null;
// };


//     //const selectedRows = await db.query(sqlQuery)
//     const hasLeasing = leasingFilter?.is_leasing_type;

//   //var selectClause = hasLeasing ? 'DISTINCT SELECT tc.* , tcl.* ': ' DISTINCT SELECT tc.* ';
//     var selectClause = hasLeasing ? 'SELECT tc.* , tcl.* ': 'SELECT tc.* ';
//     var fromClause = hasLeasing ? 'FROM tbl_cars tc , tbl_car_leasing tcl': 'FROM tbl_cars tc';
//     var whereClause = "WHERE tc.id IS NOT NULL AND tc.is_deleted = 0 AND tc.is_active = 1 AND tc.listing_status = 'published' "

//     if (brandNameFilter.is_brand_name) 
//     {
//     const values = Array.isArray(brandNameFilter.brandName) 
//      ? brandNameFilter.brandName 
//     : (brandNameFilter.brandName ? [brandNameFilter.brandName] : []);

//     if (values.length === 1) 
//     {
//         whereClause += ` AND tc.brandName = '${values[0]}'`;
//     }
//     else if (values.length > 1) 
//     {
//         whereClause += ` AND tc.brandName IN ('${values.join("','")}')`;
//     }
// }

// if (carModelFilter.is_car_model) 
// {
//     const values = Array.isArray(carModelFilter.carModel) 
//         ? carModelFilter.carModel 
//         : (carModelFilter.carModel ? [carModelFilter.carModel] : []);

//     if (values.length === 1) 
//     {
//         whereClause += ` AND tc.carModel = '${values[0]}'`;
//     }
//     else if (values.length > 1) 
//     {
//         whereClause += ` AND tc.carModel IN ('${values.join("','")}')`;
//     }
// }

//     if (fuelFilter.is_fuel_type) 
//     {
//         const ids = normalizeIds(fuelFilter.fuel_type);
//         if (ids.length === 1) 
//         {
//         whereClause += ` AND tc.fuel_type_id = '${ids[0]}'`;
//         } 
//         else if (ids.length > 1) 
//         {
//         whereClause += ` AND tc.fuel_type_id IN (${ids.join(",")})`;
//         }
//     }

//     if(yearFilter.is_year_type)
//     {
//         whereClause += ` AND YEAR(tc.first_registration_date) BETWEEN '${yearFilter.min_year}' AND '${yearFilter.max_year}'`
//     }

//     if (kilometerFilter.is_km_type) 
//     {
//         whereClause += ` AND tc.carMileage BETWEEN ${kilometerFilter.min_km} AND ${kilometerFilter.max_km}`
//     }

//     if (hasLeasing) 
//     {
//         whereClause += ` AND tc.id = tcl.car_id`;
//         whereClause += ` AND tcl.monthly_price BETWEEN '${leasingFilter.min_price}' AND '${leasingFilter.max_price}'`;
//     }

//     if (priceFilter.is_price_type)
//     {
//         whereClause += ` AND tc.selling_price BETWEEN ${priceFilter.min_price} AND ${priceFilter.max_price}`;
//     }

//     if (driveFilter.is_drive_type) 
//         {
//         const ids = normalizeIds(driveFilter.drive_type);
//         if (ids.length === 1) 
//         {
//         whereClause += ` AND tc.drive_type_id = '${ids[0]}'`;
//         } 
//         else if (ids.length > 1) 
//         {
//         whereClause += ` AND tc.drive_type_id IN (${ids.join(",")})`;
//         }
//     }
//     // state
//     if (stateFilter.is_state_type) {
//         const ids = normalizeIds(stateFilter.state_id);
//         if (ids.length === 1) 
//         {
//         whereClause += ` AND tc.state_id = '${ids[0]}'`;
//         }
//         else if (ids.length > 1) 
//         {
//         whereClause += ` AND tc.state_id IN (${ids.join(",")})`;
//         }
// }

//    // accident
//         if (accidentFilter.is_accident_type) 
//         {
//         const ids = normalizeIds(accidentFilter.accident_vehicle);
//         if (ids.length === 1) 
//         {
//         whereClause += ` AND tc.is_accident_vehicle = '${ids[0]}'`;
//         } 
//         else if (ids.length > 1) 
//         {
//         whereClause += ` AND tc.is_accident_vehicle IN (${ids.join(",")})`;
//         }
// }

//     // body type
//     if (bodyTypeFilter.is_body_type) 
//     {
//     const ids = normalizeIds(bodyTypeFilter.body_type_id);
//     if (ids.length === 1) 
//     {
//     whereClause += ` AND tc.body_type_id = '${ids[0]}'`;
//     }
//      else if (ids.length > 1) 
//     {
//     whereClause += ` AND tc.body_type_id IN (${ids.join(",")})`;
//     }
// }

//     // transmission
//     if (transmissionFilter.is_transmission) {
//     const ids = normalizeIds(transmissionFilter.transmission_id);
//     if (ids.length === 1) 
//     {
//     whereClause += ` AND tc.transmission_id = '${ids[0]}'`;
//     }    
//     else if (ids.length > 1) 
//     {
//     whereClause += ` AND tc.transmission_id IN (${ids.join(",")})`;
//     }
// }

//     if (powerFilter.is_power_type)
//     {
//         const normalizedUnit = String(powerFilter.unit || "PS").toUpperCase();
//         const powerExpression = normalizedUnit === "KW"
//             ? "CAST(NULLIF(tc.power_kw, '') AS DECIMAL(15,2))"
//             : "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2))";
//         whereClause += ` AND ${powerExpression} IS NOT NULL`;
//         whereClause += ` AND ${powerExpression} BETWEEN ${powerFilter.min_po} AND ${powerFilter.max_po}`;
//     }

//     if (cubicFilter.is_cubic_type)
//     {
//         whereClause += ` AND tc.cubic_capacity BETWEEN '${cubicFilter.min_cc}' AND '${cubicFilter.max_cc}'`;
//     }

//     if (cylindersFilter.is_cylinders_type) 
//     {
//         const cylindersExpression = "CAST(NULLIF(tc.cylinders, '') AS UNSIGNED)";
//         whereClause += ` AND TRIM(tc.cylinders) REGEXP '^[0-9]+$'`;
//         whereClause += ` AND ${cylindersExpression} IS NOT NULL`;
//         whereClause += ` AND ${cylindersExpression} BETWEEN ${cylindersFilter.min_cy} AND ${cylindersFilter.max_cy}`;
//     }

//     if (wltpFilter.is_wltp_type) 
//     {
//         whereClause += ` AND tc.wltp_range BETWEEN '${wltpFilter.min_wltp}' AND '${wltpFilter.max_wltp}'`;
//     }

//     if (batteryFilter.is_battery_type) 
//     {
//         whereClause += ` AND tc.battery_capacity BETWEEN '${batteryFilter.min_battery}' AND '${batteryFilter.max_battery}'`;
//     }

//     if (towingFilter.is_towing_type)   
//     {
//         whereClause += ` AND tc.braked_towing_capacity_kg BETWEEN '${towingFilter.min_tc}' AND '${towingFilter.max_tc}'`;
//     }

//     if (totalWeightFilter.is_total_weight_type) 
//     {
//         whereClause += ` AND tc.total_weight BETWEEN ${totalWeightFilter.min_tw} AND ${totalWeightFilter.max_tw}`;
//     }

//     if (emptyWeightFilter.is_empty_weight_type) 
//     {
//         whereClause += ` AND tc.empty_weight BETWEEN ${emptyWeightFilter.min_ew} AND ${emptyWeightFilter.max_ew}`;
//     }

//     if (seatsFilter.is_seat_type)
//     {
//         whereClause += ` AND tc.sittingCapacity BETWEEN '${seatsFilter.min_seats}' AND '${seatsFilter.max_seats}'`;
//     }

//     if (doorsFilter.is_door_type) 
//     {
//         whereClause += ` AND tc.doors BETWEEN '${doorsFilter.min_doors}' AND '${doorsFilter.max_doors}'`;
//     }

//     if (co2Filter.is_co2_type) 
//     {
//         whereClause += ` AND tc.co2Emission BETWEEN ${co2Filter.min_co2} AND ${co2Filter.max_co2}`;
//     }

//     if (energyFilter.is_energy_type) 
//     {
//         whereClause += ` AND tc.energy_efficiency = '${energyFilter.energy_efficiency}'`;
//     }


//     // exterior color
//     if (exteriorColorFilter.is_exterior_color) 
//     {
//     const ids = normalizeIds(exteriorColorFilter.exterior_color);
//     if (ids.length === 1) 
//     {
//     whereClause += ` AND tc.exterior_color_id = '${ids[0]}'`;
//     }
//     else if (ids.length > 1) 
//     {
//     whereClause += ` AND tc.exterior_color_id IN (${ids.join(",")})`;
//     }
// }

// // interior color
//     if (interiorColorFilter.is_interior_color) {
//     const ids = normalizeIds(interiorColorFilter.interior_color);
//     if (ids.length === 1) 
//     {
//     whereClause += ` AND tc.interior_color_id = '${ids[0]}'`;
//     }
//     else if (ids.length > 1) 
//     {
//     whereClause += ` AND tc.interior_color_id IN (${ids.join(",")})`;
//     }
// }

//     if (consumptionFilter.is_consumption_type) 
//     {
//         whereClause += ` AND tc.consumption BETWEEN ${consumptionFilter.min_cons} AND ${consumptionFilter.max_cons}`;
//     }

//     // age listing 
//     if (ageFilter.is_age_type) {
//     const days = normalizeIds(ageFilter.age_listing);
//     if (days.length === 1) 
//     {
//     whereClause += ` AND tc.createdAt <= NOW() - INTERVAL ${days[0]} DAY`;
//     } 
//     else if (days.length > 1) 
//     {
//     whereClause += ` AND (${days.map((d) => `tc.createdAt <= NOW() - INTERVAL ${d} DAY`).join(" OR ")})`;
//     }
// }

//     if (sellerTypeFilter.is_seller_type)
//     {
//         const mappedAccountType =
//             sellerTypeFilter.seller_type === "business"
//                 ? "company"
//                 : sellerTypeFilter.seller_type === "personal"
//                     ? "private"
//                     : sellerTypeFilter.seller_type;
//         fromClause += `, tbl_users tu`;
//         whereClause += ` AND tc.user_id = tu.id`;
//         whereClause += ` AND tu.account_type = '${mappedAccountType}'`;
//     }

//      const excludedUser = normalizePositiveId(excludedUserId);
// if (excludedUser) {
//     whereClause += ` AND tc.user_id <> ${excludedUser}`;
// }


//     var sqlQuery = `${selectClause} ${fromClause} ${whereClause}`
//     console.log("sqlQuery =>", sqlQuery);

//     //sqlQuery = sqlQuery.replace(/\s+/g, " ").trim();

//   const rows = await db.query(sqlQuery)
//   return rows 
//   //return sqlQuery;
// };

const getFilteredCarsByAllFilters = async (

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
    extrasFilter,
    extraFiltersFilter,
    excludedUserId = null,
    excludeCurrentUser = false,
    // SORT
    sortKey = ["published_most_recent"]
) => {

    //-------------------------added for array ------------------------//
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


    //const selectedRows = await db.query(sqlQuery)
    const hasLeasing = leasingFilter?.is_leasing_type;

    //var selectClause = hasLeasing ? 'DISTINCT SELECT tc.* , tcl.* ': ' DISTINCT SELECT tc.* ';
    var selectClause = hasLeasing ? 'SELECT tc.* , tcl.* ' : 'SELECT tc.* ';
    var fromClause = hasLeasing ? 'FROM tbl_cars tc , tbl_car_leasing tcl' : 'FROM tbl_cars tc';
    var whereClause = "WHERE tc.id IS NOT NULL AND tc.is_deleted = 0 AND tc.is_active = 1 AND tc.listing_status = 'published' "

    if (brandNameFilter.is_brand_name) {
        const values = Array.isArray(brandNameFilter.brandName)
            ? brandNameFilter.brandName
            : (brandNameFilter.brandName ? [brandNameFilter.brandName] : []);

        if (values.length === 1) {
            whereClause += ` AND tc.brandName = '${values[0]}'`;
        }
        else if (values.length > 1) {
            whereClause += ` AND tc.brandName IN ('${values.join("','")}')`;
        }
    }

    if (carModelFilter.is_car_model) {
        const values = Array.isArray(carModelFilter.carModel)
            ? carModelFilter.carModel
            : (carModelFilter.carModel ? [carModelFilter.carModel] : []);

        if (values.length === 1) {
            whereClause += ` AND tc.carModel = '${values[0]}'`;
        }
        else if (values.length > 1) {
            whereClause += ` AND tc.carModel IN ('${values.join("','")}')`;
        }
    }

    if (fuelFilter.is_fuel_type) {
        const ids = normalizeIds(fuelFilter.fuel_type);
        if (ids.length === 1) {
            whereClause += ` AND tc.fuel_type_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.fuel_type_id IN (${ids.join(",")})`;
        }
    }

    if (yearFilter.is_year_type) {
        whereClause += ` AND YEAR(tc.first_registration_date) BETWEEN '${yearFilter.min_year}' AND '${yearFilter.max_year}'`
    }

    if (kilometerFilter.is_km_type) {
        whereClause += ` AND tc.carMileage BETWEEN ${kilometerFilter.min_km} AND ${kilometerFilter.max_km}`
    }

    if (hasLeasing) {
        whereClause += ` AND tc.id = tcl.car_id`;
        whereClause += ` AND tcl.monthly_price BETWEEN '${leasingFilter.min_price}' AND '${leasingFilter.max_price}'`;
    }

    if (priceFilter.is_price_type) {
        whereClause += ` AND tc.selling_price BETWEEN ${priceFilter.min_price} AND ${priceFilter.max_price}`;
    }

    if (driveFilter.is_drive_type) {
        const ids = normalizeIds(driveFilter.drive_type);
        if (ids.length === 1) {
            whereClause += ` AND tc.drive_type_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.drive_type_id IN (${ids.join(",")})`;
        }
    }
    // state
    if (stateFilter.is_state_type) {
        const ids = normalizeIds(stateFilter.state_id);
        if (ids.length === 1) {
            whereClause += ` AND tc.state_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.state_id IN (${ids.join(",")})`;
        }
    }

    // accident
    if (accidentFilter.is_accident_type) {
        const ids = normalizeIds(accidentFilter.accident_vehicle);
        if (ids.length === 1) {
            whereClause += ` AND tc.is_accident_vehicle = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.is_accident_vehicle IN (${ids.join(",")})`;
        }
    }

    // body type
    if (bodyTypeFilter.is_body_type) {
        const ids = normalizeIds(bodyTypeFilter.body_type_id);
        if (ids.length === 1) {
            whereClause += ` AND tc.body_type_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.body_type_id IN (${ids.join(",")})`;
        }
    }

    // transmission
    if (transmissionFilter.is_transmission) {
        const ids = normalizeIds(transmissionFilter.transmission_id);
        if (ids.length === 1) {
            whereClause += ` AND tc.transmission_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.transmission_id IN (${ids.join(",")})`;
        }
    }

    if (powerFilter.is_power_type) {
        const normalizedUnit = String(powerFilter.unit || "PS").toUpperCase();
        const powerExpression = normalizedUnit === "KW"
            ? "CAST(NULLIF(tc.power_kw, '') AS DECIMAL(15,2))"
            : "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2))";
        whereClause += ` AND ${powerExpression} IS NOT NULL`;
        whereClause += ` AND ${powerExpression} BETWEEN ${powerFilter.min_po} AND ${powerFilter.max_po}`;
    }

    if (cubicFilter.is_cubic_type) {
        whereClause += ` AND tc.cubic_capacity BETWEEN '${cubicFilter.min_cc}' AND '${cubicFilter.max_cc}'`;
    }

    if (cylindersFilter.is_cylinders_type) {
        const cylindersExpression = "CAST(NULLIF(tc.cylinders, '') AS UNSIGNED)";
        whereClause += ` AND TRIM(tc.cylinders) REGEXP '^[0-9]+$'`;
        whereClause += ` AND ${cylindersExpression} IS NOT NULL`;
        whereClause += ` AND ${cylindersExpression} BETWEEN ${cylindersFilter.min_cy} AND ${cylindersFilter.max_cy}`;
    }

    if (wltpFilter.is_wltp_type) {
        whereClause += ` AND tc.wltp_range BETWEEN '${wltpFilter.min_wltp}' AND '${wltpFilter.max_wltp}'`;
    }

    if (batteryFilter.is_battery_type) {
        whereClause += ` AND tc.battery_capacity BETWEEN '${batteryFilter.min_battery}' AND '${batteryFilter.max_battery}'`;
    }

    if (towingFilter.is_towing_type) {
        whereClause += ` AND tc.braked_towing_capacity_kg BETWEEN '${towingFilter.min_tc}' AND '${towingFilter.max_tc}'`;
    }

    if (totalWeightFilter.is_total_weight_type) {
        whereClause += ` AND tc.total_weight BETWEEN ${totalWeightFilter.min_tw} AND ${totalWeightFilter.max_tw}`;
    }

    if (emptyWeightFilter.is_empty_weight_type) {
        whereClause += ` AND tc.empty_weight BETWEEN ${emptyWeightFilter.min_ew} AND ${emptyWeightFilter.max_ew}`;
    }

    if (seatsFilter.is_seat_type) {
        whereClause += ` AND tc.sittingCapacity BETWEEN '${seatsFilter.min_seats}' AND '${seatsFilter.max_seats}'`;
    }

    if (doorsFilter.is_door_type) {
        whereClause += ` AND tc.doors BETWEEN '${doorsFilter.min_doors}' AND '${doorsFilter.max_doors}'`;
    }

    if (co2Filter.is_co2_type) {
        whereClause += ` AND tc.co2Emission BETWEEN ${co2Filter.min_co2} AND ${co2Filter.max_co2}`;
    }

    if (energyFilter.is_energy_type) {
        whereClause += ` AND tc.energy_efficiency = '${energyFilter.energy_efficiency}'`;
    }


    // exterior color
    if (exteriorColorFilter.is_exterior_color) {
        const ids = normalizeIds(exteriorColorFilter.exterior_color);
        if (ids.length === 1) {
            whereClause += ` AND tc.exterior_color_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.exterior_color_id IN (${ids.join(",")})`;
        }
    }

    // interior color
    if (interiorColorFilter.is_interior_color) {
        const ids = normalizeIds(interiorColorFilter.interior_color);
        if (ids.length === 1) {
            whereClause += ` AND tc.interior_color_id = '${ids[0]}'`;
        }
        else if (ids.length > 1) {
            whereClause += ` AND tc.interior_color_id IN (${ids.join(",")})`;
        }
    }

    if (consumptionFilter.is_consumption_type) {
        whereClause += ` AND tc.consumption BETWEEN ${consumptionFilter.min_cons} AND ${consumptionFilter.max_cons}`;
    }

    // age listing 
    if (ageFilter.is_age_type) {
        const days = normalizeIds(ageFilter.age_listing);
        if (days.length === 1) {
            whereClause += ` AND tc.createdAt <= NOW() - INTERVAL ${days[0]} DAY`;
        }
        else if (days.length > 1) {
            whereClause += ` AND (${days.map((d) => `tc.createdAt <= NOW() - INTERVAL ${d} DAY`).join(" OR ")})`;
        }
    }

    if (sellerTypeFilter.is_seller_type) {
        console.log("seller_type =>", sellerTypeFilter.seller_type);
        const types = Array.isArray(sellerTypeFilter.seller_type)
            ? sellerTypeFilter.seller_type
            : [sellerTypeFilter.seller_type];
        const mappedAccountTypes = types
            .map((t) => (t === "business" ? "company" : t === "personal" ? "private" : t))
            .filter(Boolean);
        console.log("mappedAccountTypes =>", mappedAccountTypes);
        if (mappedAccountTypes.length) {
            fromClause += `, tbl_users tu`;
            whereClause += ` AND tc.user_id = tu.id`;
            if (mappedAccountTypes.length === 1) {
                whereClause += ` AND tu.account_type = '${mappedAccountTypes[0]}'`;
            } else {
                whereClause += ` AND tu.account_type IN (${mappedAccountTypes.map((t) => `'${t}'`).join(",")})`;
            }
        }
    }

    if (mfkFilter?.is_mfk) {

        whereClause += `
        AND tc.mfk_status_id IS NOT NULL
        AND tc.mfk_status_id NOT IN (4, 5)
        `;
    }

    // Warranty filter
    if (warrantyFilter?.is_warranty) {
        whereClause += `
            AND EXISTS (
                SELECT 1
                FROM tbl_warranty_types wtt
                WHERE wtt.id = tc.mfk_warrenty_id
                  AND wtt.warranty_key IS NOT NULL
                  AND wtt.warranty_key != 'no_warranty'
            )
        `;
    }

    console.log("excludedUserId =>", excludedUserId, "excludeCurrentUser =>", excludeCurrentUser);
    const excludedUser = normalizePositiveId(excludedUserId);
    if (excludeCurrentUser && excludedUser) {
        whereClause += ` AND tc.user_id <> ${excludedUser}`;
    }


    // let orderClause = "";

    const sortMap = {
        price_low_to_high:
            "CAST(tc.selling_price AS DECIMAL(15,2)) ASC",

        price_high_to_low:
            "CAST(tc.selling_price AS DECIMAL(15,2)) DESC",

        mileage_low_to_high:
            "CAST(tc.carMileage AS DECIMAL(15,2)) ASC",

        mileage_high_to_low:
            "CAST(tc.carMileage AS DECIMAL(15,2)) DESC",

        year_old_to_new:
            "tc.first_registration_date ASC",

        year_new_to_old:
            "tc.first_registration_date DESC",

        brand_model_a_to_z:
            "tc.brandName ASC, tc.carModel ASC",

        brand_model_z_to_a:
            "tc.brandName DESC, tc.carModel DESC",

        horsepower_low_to_high:
            "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2)) ASC",

        horsepower_high_to_low:
            "CAST(NULLIF(tc.power_ps, '') AS DECIMAL(15,2)) DESC",

        published_most_recent:
            "tc.createdAt DESC",

        published_oldest:
            "tc.createdAt ASC"
    };

    // Extras filter (legacy text matching only for non-numeric strings)
if (extrasFilter?.is_extras && !extraFiltersFilter?.is_extra_filters) {

    const values = Array.isArray(extrasFilter.extras)
        ? extrasFilter.extras
        : [extrasFilter.extras];

    const validExtras = values
        .map((value) => String(value).trim().toLowerCase())
        .filter((value) => value && !/^\d+$/.test(value));

    if (validExtras.length) {
        const extraConditions = validExtras.map((value) => {
            const escapedValue = value.replace(/'/g, "''");

            return `
                LOWER(tc.extras) LIKE '%${escapedValue}%'
            `;
        });

        whereClause += `
            AND (
                ${extraConditions.join(" OR ")}
            )
        `;
    }
}

    // Extra Filters (extra_filters dynamic mapping)
    if (extraFiltersFilter?.is_extra_filters) {
        const selectedIds = normalizeIds(extraFiltersFilter.extra_filters);
        if (selectedIds.length) {
            const hasId6 = selectedIds.includes(6);
            const otherIds = selectedIds.filter((id) => id !== 6);

            const extraFilterConditions = [];

            if (otherIds.length) {
                extraFilterConditions.push(`
                    EXISTS (
                        SELECT 1
                        FROM extras_options eo
                        INNER JOIN tbl_car_feature cf
                            ON cf.feature_id = eo.real_name_id
                        WHERE (eo.id IN (${otherIds.join(",")}) OR eo.real_name_id IN (${otherIds.join(",")}))
                          AND eo.is_active = 1
                          AND cf.car_id = tc.id
                    )
                `);
            }

            if (hasId6) {
                extraFilterConditions.push(`
                    (
                        tc.extras IS NOT NULL
                        AND (
                            tc.extras = '6'
                            OR FIND_IN_SET('6', REPLACE(REPLACE(REPLACE(tc.extras, '[', ''), ']', ''), ' ', '')) > 0
                            OR LOWER(TRIM(tc.extras)) = '8 tires'
                            OR LOWER(TRIM(tc.extras)) = 'eight_tyres'
                            OR FIND_IN_SET('eight_tyres', REPLACE(LOWER(tc.extras), ' ', '')) > 0
                        )
                    )
                `);
            }

            if (extraFilterConditions.length) {
                whereClause += `
                    AND (
                        ${extraFilterConditions.join(" OR ")}
                    )
                `;
            }
        }
    }

    const normalizedSortKeys = (
        Array.isArray(sortKey)
            ? sortKey
            : String(sortKey || "").split(",")
    )
        .map((key) => String(key).trim().toLowerCase())
        .filter(Boolean);

    const orderParts = normalizedSortKeys
        .map((key) => sortMap[key])
        .filter(Boolean);

    const orderClause = `
    ORDER BY
    ${orderParts.length
            ? orderParts.join(", ")
            : sortMap.published_most_recent
        },
    tc.id DESC
`;


    // var sqlQuery = `${selectClause} ${fromClause} ${whereClause}`
    var sqlQuery = `
    ${selectClause}
    ${fromClause}
    ${whereClause}
    ${orderClause}
`;
    console.log("sqlQuery =>", sqlQuery);

    //sqlQuery = sqlQuery.replace(/\s+/g, " ").trim();

    const rows = await db.query(sqlQuery)
    return rows
    //return sqlQuery;
};



export {
    getFuelFacetModel,
    getTransmissionFacetModel,
    getBodyTypeFacetModel,
    getDriveFacetModel,
    getStateFacetModel,
    getAccidentStatusFacetModel,
    getMfkWarrantyFacetModel,
    getVehicleConditionFacetModel,
    getEnergyEfficiencyFacetModel,
    getListingAgeFacetModel,
    getExteriorColorFacetModel,
    getInteriorColorFacetModel,
    getPriceFacetModel,
    getYearFacetModel,
    getMileageFacetModel,
    getEnginePowerFacetModel,
    getSeatFacetModel,
    getDoorFacetModel,
    getCubicCapacityFacetModel,
    getCylindersFacetModel,
    getBatteryCapacityFacetModel,
    getTotalWeightFacetModel,
    getEmptyWeightFacetModel,
    getTowingCapacityFacetModel,
    getWltpRangeFacetModel,
    getConsumptionFacetModel,
    getCo2EmissionFacetModel,
    getFilteredCarsByAllFilters
};

export const getModelsFacetListModelweb = async (brand_id, filters = {}) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "model"
    });

    const joinConditions = buildJoinConditions(conditions);

    const rows = await db.query(
        `
        SELECT
            m.id,
            m.brand_id,
            m.vehicle_type,
            m.model_name,

            COUNT(DISTINCT car.id) AS car_count

        FROM tbl_vehicle_catalog_models AS m

        INNER JOIN tbl_vehicle_catalog_brands AS b
            ON b.id = m.brand_id

        LEFT JOIN tbl_cars AS car
            ON LOWER(TRIM(car.brandName)) =
               LOWER(TRIM(b.brand_name))

            AND LOWER(TRIM(car.carModel)) =
                LOWER(TRIM(m.model_name))

            ${joinConditions ? `AND ${joinConditions}` : ""}

        WHERE m.brand_id = ?

        GROUP BY
            m.id,
            m.brand_id,
            m.vehicle_type,
            m.model_name

        ORDER BY m.model_name ASC
        `,
        [...params, brand_id]
    );

    const getSeriesName = (modelName) => {
        const model = String(modelName || "").trim();
        if (!model) return "UNCLASSIFIED";

        // 1. BMW Series
        const bmwReihe = model.match(/^(\d+)er\s+Reihe\b/i);
        if (bmwReihe) return `${bmwReihe[1]} SERIES`;
        if (/^M\d+/i.test(model) || /^\d+er\s+M\b/i.test(model) || /^X\d+M\b/i.test(model) || /^XM\b/i.test(model)) return "M-SERIES";
        const bmwX = model.match(/^(X\d+)\b/i);
        if (bmwX) return `${bmwX[1].toUpperCase()} SERIES`;
        const bmwZ = model.match(/^(Z\d+)\b/i);
        if (bmwZ) return `${bmwZ[1].toUpperCase()} SERIES`;
        const bmwi = model.match(/^(i\d+|iX\d*)\b/i);
        if (bmwi) return `${bmwi[1].toUpperCase()} SERIES`;

        // 2. Mercedes-Benz Classes
        const mbKlasse = model.match(/^([A-Z0-9]+)-Klasse\b/i);
        if (mbKlasse) return `${mbKlasse[1].toUpperCase()}-KLASSE`;
        if (/^AMG\s+GT\b/i.test(model)) return "AMG GT";
        if (/^AMG\s+SL\b/i.test(model)) return "SL";
        if (/^EQ[A-Z]\b/i.test(model)) {
            const eqMatch = model.match(/^(EQ[A-Z])\b/i);
            return eqMatch ? eqMatch[1].toUpperCase() : "EQ-SERIES";
        }

        // 3. Audi Models & Series
        const audiAQS = model.match(/^([AQS]\d+)\b/i);
        if (audiAQS) return audiAQS[1].toUpperCase();
        const audiRS = model.match(/^(RS\s*\d+|RS\s*Q\d+|RS\s*e-tron)\b/i);
        if (audiRS) return audiRS[1].replace(/\s+/g, "").toUpperCase();
        if (/^e-tron\b/i.test(model)) return "e-tron";
        if (/^TT\b/i.test(model)) return "TT";
        if (/^R8\b/i.test(model)) return "R8";

        // 4. Volvo Series
        const volvoMatch = model.match(/^([A-Z]{1,2}\d{2})\b/i);
        if (volvoMatch) return volvoMatch[1].toUpperCase();

        // 5. Aston Martin Series
        const amMatch = model.match(/^(DB\d+|DBS|Vantage|Vanquish|Rapide|Valhalla)\b/i);
        if (amMatch) return amMatch[1].toUpperCase();

        // 6. Land Rover / Range Rover
        if (/^Range\s+Rover\s+Sport\b/i.test(model)) return "Range Rover Sport";
        if (/^Range\s+Rover\s+Evoque\b/i.test(model)) return "Range Rover Evoque";
        if (/^Range\s+Rover\s+Velar\b/i.test(model)) return "Range Rover Velar";
        if (/^Range\s+Rover\b/i.test(model)) return "Range Rover";
        if (/^Discovery\s+Sport\b/i.test(model)) return "Discovery Sport";
        if (/^Discovery\b/i.test(model)) return "Discovery";
        if (/^Defender\b/i.test(model)) return "Defender";
        if (/^Freelander\b/i.test(model)) return "Freelander";

        // 7. Universal Variant/Body-Type Stripping for All Other Brands
        const cleanPattern = model.replace(/\b(Coupé|Coupe|Cabriolet|Cabrio|Sportback|Avant|Variant|Touring|Kombi|Estate|Sedan|Limousine|Liftback|SW|Spider|Spyder|Gran\s+Coupé|Gran\s+Tourer|Active\s+Tourer|Allroad|Cross|Crosswagon|Crossover|Roadster|Shooting\s+Brake|Fastback|Targa|Speedster|Volante|Saloon|Compact|Gran\s+Turismo|GT|quattro|4x4|AWD|4WD|DM-i|EVO|EV|PHEV|Hybrid|Electric)\b.*/gi, "").trim();

        if (cleanPattern.length > 0 && cleanPattern !== model) {
            return cleanPattern;
        }

        return model;
    };

    const grouped = {};

    for (const row of rows) {
        const seriesName = getSeriesName(row.model_name);
        const count = toSafeNumber(row.car_count, 0);

        if (!grouped[seriesName]) {
            grouped[seriesName] = {
                series_name: seriesName,
                count: 0,
                models: []
            };
        }

        grouped[seriesName].count += count;

        grouped[seriesName].models.push({
            id: row.id,
            brand_id: row.brand_id,
            vehicle_type: row.vehicle_type,
            model_name: row.model_name,
            count
        });
    }

    return Object.values(grouped);
};
