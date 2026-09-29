import db from '../../config/db.js';
import { buildFacetedConditions, buildWhereClause, buildJoinConditions } from '../../services/facetedFilters/buildFacetWhereClause.js';
import { toSafeNumber, getFacetedTotalCarsModel } from './facetedCommon.model.js';

const normalizeFacetArgs = (arg1, arg2) => {
    if (typeof arg1 === 'string') {
        return { filters: (typeof arg2 === 'object' && arg2 !== null) ? arg2 : {}, lang: arg1 || 'en' };
    }
    return { filters: (typeof arg1 === 'object' && arg1 !== null) ? arg1 : {}, lang: typeof arg2 === 'string' ? arg2 : 'en' };
};

export const getExteriorColorFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "exterior_color"
    });
    const joinConditions = buildJoinConditions(conditions);
    const metallicWhere = buildWhereClause([...conditions, "car.is_metallic = 1"]);
    const metallicRows = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_cars AS car
        ${metallicWhere}
        `,
        params
    );
    const metallicCount = toSafeNumber(metallicRows[0]?.total, 0);
    const rows = await db.query(
        `
        SELECT
            c.id,
            c.color_key,
            c.hex_code,
            COALESCE(ct.name, c.color_key) AS name,
            COUNT(car.id) AS car_count
        FROM tbl_colors AS c
        LEFT JOIN tbl_color_translations AS ct
            ON ct.color_id = c.id
            AND ct.language_code = ?
        LEFT JOIN tbl_cars AS car
            ON car.exterior_color_id = c.id
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE c.is_active = 1
        GROUP BY c.id, c.color_key, c.hex_code, name
        ORDER BY c.id ASC
        `,
        [lang, ...params]
    );
    return {
        metallic_count: metallicCount,
        options: rows.map((row) => ({
            id: row.id,
            code: row.color_key,
            label: row.name,
            color_key: row.color_key,
            hex_code: row.hex_code,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "exterior_color")
    };
};

export const getInteriorColorFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "interior_color"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            c.id,
            c.color_key,
            c.hex_code,
            COALESCE(ct.name, c.color_key) AS name,
            COUNT(car.id) AS car_count
        FROM tbl_colors AS c
        LEFT JOIN tbl_color_translations AS ct
            ON ct.color_id = c.id
            AND ct.language_code = ?
        LEFT JOIN tbl_cars AS car
            ON car.interior_color_id = c.id
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE c.is_active = 1
        GROUP BY c.id, c.color_key, c.hex_code, name
        ORDER BY c.id ASC
        `,
        [lang, ...params]
    );
    return {
        options: rows.map((row) => ({
            id: row.id,
            code: row.color_key,
            label: row.name,
            color_key: row.color_key,
            hex_code: row.hex_code,
            name: row.name,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "interior_color")
    };
};

export const getSellerTypeFacetModel = async (arg1 = {}) => {
    const { filters } = normalizeFacetArgs(arg1);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "car",
        excludeFacet: "seller_type"
    });
    const joinConditions = buildJoinConditions(conditions);
    const rows = await db.query(
        `
        SELECT
            r.seller_type,
            COUNT(car.id) AS car_count
        FROM tbl_roles AS r
        INNER JOIN tbl_users AS u
            ON u.id = r.user_id
            AND (u.status = 1 OR u.status = '1')
        LEFT JOIN tbl_cars AS car
            ON car.user_id = u.id
            ${joinConditions ? `AND ${joinConditions}` : ""}
        WHERE r.role = 'seller'
        GROUP BY r.seller_type
        ORDER BY r.seller_type ASC
        `,
        params
    );

    return {
        options: rows.map((row) => ({
            id: row.seller_type,
            code: row.seller_type,
            label: row.seller_type,
            name: row.seller_type,
            count: toSafeNumber(row.car_count, 0)
        })),
        total_cars: await getFacetedTotalCarsModel(filters, "seller_type")
    };
};

export const getCarTypeFacetModel = async (arg1 = {}, arg2 = "en") => {
    const { filters, lang } = normalizeFacetArgs(arg1, arg2);
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet: "car_type"
    });
    const whereClause = buildWhereClause(conditions);

    const rows = await db.query(
        `
        SELECT
            COUNT(c.id) AS total_cars,
            SUM(CASE WHEN c.is_swiss_vehicle = 1 THEN 1 ELSE 0 END) AS swiss_cars
        FROM tbl_cars c
        ${whereClause}
        `,
        params
    );

    const totalCars = toSafeNumber(rows[0]?.total_cars, 0);
    const swissCars = toSafeNumber(rows[0]?.swiss_cars, 0);

    const labels = {
        en: { all: "All standard", ch: "Only CH cars" },
        de: { all: "Alle Standard", ch: "Nur CH-Fahrzeuge" },
        fr: { all: "Tous standard", ch: "Uniquement véhicules CH" },
        it: { all: "Tutti standard", ch: "Solo veicoli CH" }
    };

    const currentLabels = labels[lang] || labels.en;

    return {
        options: [
            { id: "all_standard", code: "all_standard", label: currentLabels.all, name: currentLabels.all, count: totalCars },
            { id: "only_ch_cars", code: "only_ch_cars", label: currentLabels.ch, name: currentLabels.ch, count: swissCars }
        ],
        total_cars: totalCars
    };
};
