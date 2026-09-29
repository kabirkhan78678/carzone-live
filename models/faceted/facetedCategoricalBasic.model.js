import db from '../../config/db.js';
import { buildFacetedConditions, buildWhereClause, buildJoinConditions } from '../../services/facetedFilters/buildFacetWhereClause.js';
import { toSafeNumber, getFacetedTotalCarsModel } from './facetedCommon.model.js';

const normalizeFacetArgs = (arg1, arg2) => {
    if (typeof arg1 === 'string') {
        return { filters: (typeof arg2 === 'object' && arg2 !== null) ? arg2 : {}, lang: arg1 || 'en' };
    }
    return { filters: (typeof arg1 === 'object' && arg1 !== null) ? arg1 : {}, lang: typeof arg2 === 'string' ? arg2 : 'en' };
};

export const getFuelFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "fuel"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            ft.id,
            ft.code,
            ft.category,
            ft.sort_order,
            COALESCE(ftt.label, ft.code) AS label,
            COALESCE(ftt.label, ft.code) AS name,
            COUNT(DISTINCT car.id) AS car_count
        FROM tbl_fuel_types AS ft
        LEFT JOIN tbl_fuel_type_translations AS ftt
            ON ftt.fuel_type_id = ft.id
            AND ftt.language_code = ?
        LEFT JOIN tbl_cars AS car
            ON car.fuel_type_id = ft.id
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE ft.is_active = 1
        GROUP BY ft.id, ft.code, ft.category, ft.sort_order, ftt.label
        ORDER BY ft.sort_order ASC
        `,
        [lang, ...params]
    );
    const categories = {};
    rows.forEach((row) => {
        const cat = row.category || 'Standard';
        if (!categories[cat]) {
            categories[cat] = [];
        }
        categories[cat].push({
            id: row.id,
            code: row.code,
            label: row.label,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        });
    });
    return {
        categories,
        total_cars: await getFacetedTotalCarsModel(filters, "fuel")
    };
};

export const getTransmissionFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
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
            t.code AS name_key,
            COALESCE(tt.label, t.code) AS label,
            COALESCE(tt.label, t.code) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_transmissions AS t
        LEFT JOIN tbl_transmission_translations AS tt
            ON tt.transmission_id = t.id
            AND tt.language_code = ?
        LEFT JOIN tbl_cars AS c
            ON (c.transmission_id = t.id OR c.transmission = t.code)
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
            name_key: row.name_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "transmission")
    };
};

export const getBodyTypeFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
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
            bt.code AS name_key,
            COALESCE(btt.label, bt.code) AS label,
            COALESCE(btt.label, bt.code) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_body_types AS bt
        LEFT JOIN tbl_body_type_translations AS btt
            ON btt.body_type_id = bt.id
            AND btt.language_code = ?
        LEFT JOIN tbl_cars AS c
            ON (c.body_type_id = bt.id OR c.body_type = bt.code)
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
            name_key: row.name_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "body_type")
    };
};

export const getDriveFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
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
            d.code AS name_key,
            COALESCE(dt.label, d.code) AS label,
            COALESCE(dt.label, d.code) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_drives AS d
        LEFT JOIN tbl_drive_translations AS dt
            ON dt.drive_id = d.id
            AND dt.language_code = ?
        LEFT JOIN tbl_cars AS c
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
            name_key: row.name_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "drive")
    };
};

export const getStateFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
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
            vs.code AS name_key,
            COALESCE(vst.label, vs.code) AS label,
            COALESCE(vst.label, vs.code) AS name,
            COUNT(c.id) AS car_count
        FROM tbl_vehicle_states AS vs
        LEFT JOIN tbl_vehicle_state_translations AS vst
            ON vst.vehicle_state_id = vs.id
            AND vst.language_code = ?
        LEFT JOIN tbl_cars AS c
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
            name_key: row.name_key,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "state")
    };
};
