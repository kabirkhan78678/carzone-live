import db from '../../config/db.js';
import { buildFacetedConditions, buildJoinConditions } from '../../services/facetedFilters/buildFacetWhereClause.js';
import { toSafeNumber } from './facetedCommon.model.js';

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
        FROM tbl_vehicle_catalog_brands AS b
        LEFT JOIN tbl_cars AS car
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
        FROM tbl_vehicle_catalog_models AS m
        INNER JOIN tbl_vehicle_catalog_brands AS b
            ON b.id = m.brand_id
        LEFT JOIN tbl_cars AS car
            ON LOWER(TRIM(car.brandName)) = LOWER(TRIM(b.brand_name))
            AND LOWER(TRIM(car.carModel)) = LOWER(TRIM(m.model_name))
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
    return rows.map((row) => ({
        id: row.id,
        brand_id: row.brand_id,
        vehicle_type: row.vehicle_type,
        model_name: row.model_name,
        count: toSafeNumber(row.car_count, 0)
    }));
};

export const getSeriesName = (modelName) => {
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
            ON LOWER(TRIM(car.brandName)) = LOWER(TRIM(b.brand_name))
            AND LOWER(TRIM(car.carModel)) = LOWER(TRIM(m.model_name))
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
