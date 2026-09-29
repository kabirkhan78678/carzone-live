import db from '../../config/db.js';
import { buildFacetedConditions, buildWhereClause, buildJoinConditions } from '../../services/facetedFilters/buildFacetWhereClause.js';
import { toSafeNumber, getFacetedTotalCarsModel } from './facetedCommon.model.js';

const normalizeFacetArgs = (arg1, arg2) => {
    if (typeof arg1 === 'string') {
        return { filters: (typeof arg2 === 'object' && arg2 !== null) ? arg2 : {}, lang: arg1 || 'en' };
    }
    return { filters: (typeof arg1 === 'object' && arg1 !== null) ? arg1 : {}, lang: typeof arg2 === 'string' ? arg2 : 'en' };
};

export const getAccidentStatusFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "accident_status"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            vas.id,
            vas.code,
            vas.code AS status_key,
            COALESCE(vast.label, vas.code) AS label,
            COALESCE(vast.label, vas.code) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_vehicle_accident_status AS vas
        LEFT JOIN tbl_vehicle_accident_status_translations AS vast
            ON vast.accident_status_id = vas.id
            AND vast.language_code = ?
        LEFT JOIN tbl_cars AS c
            ON c.vehicle_accident_status_id = vas.id
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE vas.is_active = 1
        GROUP BY vas.id, vas.code, vast.label
        ORDER BY vas.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            status_key: row.status_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "accident_status")
    };
};

export const getMfkWarrantyFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "mfk_warranty"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            ms.id,
            ms.status_key,
            ms.status_key AS code,
            COALESCE(mst.name, ms.status) AS label,
            COALESCE(mst.name, ms.status) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_mfk_status AS ms
        LEFT JOIN tbl_mfk_status_translations AS mst
            ON mst.mfk_status_id = ms.id
            AND mst.language_code = ?
        LEFT JOIN tbl_cars AS c
            ON (c.mfk_status_id = ms.id OR c.mfk_warrenty_id = ms.id)
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE ms.is_active = 1
        GROUP BY ms.id, ms.status_key, mst.name, ms.status
        ORDER BY ms.id ASC
        `,
        [lang, ...params]
    );

    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            status_key: row.status_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "mfk_warranty")
    };
};

export const getVehicleConditionFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "vehicle_condition"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            vc.id,
            vc.condition_key,
            vc.condition_key AS code,
            COALESCE(vct.name, vc.condition_key) AS label,
            COALESCE(vct.name, vc.condition_key) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_vehicle_conditions AS vc
        LEFT JOIN tbl_vehicle_condition_translations AS vct
            ON vct.condition_id = vc.id
            AND vct.language_code = ?
        LEFT JOIN tbl_cars AS c
            ON (c.carCondition = vc.condition_key OR c.state_id = vc.id)
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE vc.is_active = 1
        GROUP BY vc.id, vc.condition_key, vct.name
        ORDER BY vc.id ASC
        `,
        [lang, ...params]
    );
    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.code,
            label: row.label,
            condition_key: row.condition_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "vehicle_condition")
    };
};

export const getEnergyEfficiencyFacetModel = async (arg1 = {}) => {
    const { filters } = normalizeFacetArgs(arg1);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "energy_efficiency"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            ee.category AS name,
            COUNT(car.id) AS car_count
        FROM (
            SELECT 'A' AS category UNION ALL
            SELECT 'B' UNION ALL
            SELECT 'C' UNION ALL
            SELECT 'D' UNION ALL
            SELECT 'E' UNION ALL
            SELECT 'F' UNION ALL
            SELECT 'G'
        ) AS ee
        LEFT JOIN tbl_cars AS car
            ON UPPER(car.energy_efficiency) = ee.category
            ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY ee.category
        ORDER BY ee.category ASC
        `,
        params
    );
    return {
        options: rows.map((row) => ({
            id: row.name,
            code: row.name,
            label: row.name,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "energy_efficiency")
    };
};

export const getListingAgeFacetModel = async (arg1 = {}) => {
    const { filters } = normalizeFacetArgs(arg1);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "listing_age"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            opt.id,
            opt.days,
            opt.label,
            COUNT(car.id) AS car_count
        FROM (
            SELECT 1 AS id, 1 AS days, '1 Day' AS label UNION ALL
            SELECT 2, 7, '7 Days' UNION ALL
            SELECT 3, 14, '14 Days' UNION ALL
            SELECT 4, 30, '30 Days'
        ) AS opt
        LEFT JOIN tbl_cars AS car
            ON car.createdAt >= DATE_SUB(NOW(), INTERVAL opt.days DAY)
            ${joinConditions ? `AND ${joinConditions}` : ""}
        GROUP BY opt.id, opt.days, opt.label
        ORDER BY opt.id ASC
        `,
        params
    );
    return {
        options: rows.map((row) => ({
            id: row.id,
            days: row.days,
            label: row.label,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "listing_age")
    };
};
