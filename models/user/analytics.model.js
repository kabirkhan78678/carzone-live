import { getFacetedTotalCarsModel } from '../facetedFilter.model.js';
import { toSafeNumber } from '../user.model.js';
import { buildFacetedConditions, buildWhereClause } from '../../services/facetedFilters/buildFacetWhereClause.js';
import { buildWhereConditions, getTextValues } from './filtersWhereBuilder.js';
import db from '../../config/db.js';

export const getYearRangeAnalyticsModel = async (from_year, to_year) => {
    try {
        const query = `
            SELECT 
                -- Cars within selected range
                COUNT(CASE WHEN selectYear >= ? AND selectYear <= ? THEN 1 END) as selected_range_count,
                
                -- Cars older than range
                COUNT(CASE WHEN selectYear < ? THEN 1 END) as older_count,
                
                -- Cars newer than range  
                COUNT(CASE WHEN selectYear > ? THEN 1 END) as newer_count,
                
                -- Total cars
                COUNT(*) as total_cars
                
            FROM tbl_cars 
            WHERE is_deleted = 0 
            AND is_active = 1 
            AND selectYear IS NOT NULL
        `;

        const results = await db.query(query, [from_year, to_year, from_year, to_year]);

        return {
            selected_range_count: parseInt(results[0].selected_range_count || 0),
            older_count: parseInt(results[0].older_count || 0),
            newer_count: parseInt(results[0].newer_count || 0),
            total_cars: parseInt(results[0].total_cars || 0)
        };

    } catch (error) {
        console.error("Year Range Analytics Model Error:", error);
        throw error;
    }
};
// code by raj

export const getKilometersRangeAnalyticsModel = async (from_km, to_km) => {
    try {
        const query = `
            SELECT 
                -- Cars within selected mileage range
                COUNT(CASE WHEN carMileage >= ? AND carMileage <= ? THEN 1 END) as selected_range_count,
                
                -- Cars with lower mileage (before range)
                COUNT(CASE WHEN carMileage < ? THEN 1 END) as lower_mileage_count,
                
                -- Cars with higher mileage (after range)  
                COUNT(CASE WHEN carMileage > ? THEN 1 END) as higher_mileage_count,
                
                -- Total cars
                COUNT(*) as total_cars
                
            FROM tbl_cars 
            WHERE is_deleted = 0 
            AND is_active = 1 
            AND carMileage IS NOT NULL
            AND carMileage != ''
        `;

        const results = await db.query(query, [from_km, to_km, from_km, to_km]);

        return {
            selected_range_count: parseInt(results[0].selected_range_count || 0),
            lower_mileage_count: parseInt(results[0].lower_mileage_count || 0),
            higher_mileage_count: parseInt(results[0].higher_mileage_count || 0),
            total_cars: parseInt(results[0].total_cars || 0)
        };

    } catch (error) {
        console.error("Kilometers Range Analytics Model Error:", error);
        throw error;
    }
};
// code by raj

export const getPriceRangeAnalyticsModel = async (car_price_from, car_price_to) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as matching_vehicles_count
            FROM tbl_cars 
            WHERE is_deleted = 0 
            AND is_active = 1 
            AND totalPrice IS NOT NULL
            AND totalPrice != ''
            AND totalPrice >= ?
            AND totalPrice <= ?
        `;

        const results = await db.query(query, [car_price_from, car_price_to]);

        return {
            matching_vehicles_count: parseInt(results[0].matching_vehicles_count || 0)
        };

    } catch (error) {
        console.error("Price Range Analytics Model Error:", error);
        throw error;
    }
};

export const getLeasingRangeAnalyticsModel = async (leasing_price_from, leasing_price_to) => {
    const query = `
        SELECT COUNT(*) AS total
        FROM tbl_cars
        WHERE is_active = 1
          AND is_deleted = 0
          AND leasingPrice IS NOT NULL
          AND leasingPrice <> ''
          AND CAST(REPLACE(REPLACE(leasingPrice, 'CHF', ''), ',', '') AS DECIMAL(15,2)) BETWEEN ? AND ?
    `;

    const results = await db.query(query, [leasing_price_from, leasing_price_to]);
    return parseInt(results[0]?.total || 0, 10);
};

// code by raj
// Vehicle Conditions

export const getMfkWarrantyCountsModel = async (filters = {}) => {

    // ============================================
    // MFK COUNT
    // Independent of MFK and Warranty selections
    // Apply all other filters
    // ============================================

    const mfkFilters = { ...filters, mfk: false, warranty: false };
    const mfkResult = buildFacetedConditions(mfkFilters, {
        alias: "c",
        excludeFacet: "mfk"
    });

    const mfkWhereClause =
        buildWhereClause(mfkResult.conditions);

    const mfkRows = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_cars c
        ${mfkWhereClause}
        AND c.mfk_status_id IS NOT NULL
        `,
        mfkResult.params
    );

    const mfkCount =
        toSafeNumber(mfkRows[0]?.total, 0);


    // ============================================
    // WARRANTY COUNT
    // Independent of Warranty and MFK selections
    // Apply all other filters
    // ============================================

    const warrantyFilters = { ...filters, mfk: false, warranty: false };
    const warrantyResult = buildFacetedConditions(warrantyFilters, {
        alias: "c",
        excludeFacet: "warranty"
    });

    const warrantyWhereClause =
        buildWhereClause(warrantyResult.conditions);

    const warrantyRows = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_cars c
        LEFT JOIN tbl_warranty_types wtt
            ON wtt.id = c.mfk_warrenty_id
        ${warrantyWhereClause}
            AND wtt.warranty_key != 'no_warranty'
        `,
        warrantyResult.params
    );

    const warrantyCount =
        toSafeNumber(warrantyRows[0]?.total, 0);


    // ============================================
    // TOTAL CARS
    // Apply ALL active filters
    // ============================================

    const totalCars =
        await getFacetedTotalCarsModel(filters);


    return {
        mfk_count: mfkCount,
        warranty_count: warrantyCount,
        total_cars: totalCars
    };
};

export const getMfkStatusListModel = async (lang = "en") => {
    try {
        return await db.query(
            `
            SELECT
                ms.id,
                ms.status_key,
                ms.status,
                COALESCE(mst.name, ms.status) AS name
            FROM tbl_mfk_status ms
            LEFT JOIN tbl_mfk_status_translations mst
                ON mst.mfk_status_id = ms.id
               AND mst.language_code = ?
            WHERE ms.is_active = 1
            ORDER BY ms.id ASC
            `,
            [lang]
        );
    } catch (error) {
        console.error(
            "getMfkStatusListModel error:",
            error?.sqlMessage || error?.message
        );
        throw error;
    }
};

export const getSortListModel = async (lang = "en") => {
    try {
        return await db.query(
            `
            SELECT
                so.id,
                so.sort_key,
                so.icon,
                so.sort_order,
                COALESCE(sot.title, so.sort_key) AS name
            FROM sort_options so
            LEFT JOIN sort_option_translations sot
                ON sot.sort_option_id = so.id
               AND sot.language = ?
            WHERE so.is_active = 1
            ORDER BY so.sort_order ASC, so.id ASC
            `,
            [lang]
        );
    } catch (error) {
        console.error(
            "getSortListModel error:",
            error?.sqlMessage || error?.message
        );
        throw error;
    }
};

export const getExtrasListModel = async (lang = "en", filters = {}) => {
    try {
        const selectedBrandNames = getTextValues(filters.brand_name ?? filters.brandName);
        const selectedModels = getTextValues(filters.model_name ?? filters.model ?? filters.carModel);

        const allConditions = buildWhereConditions(filters, selectedBrandNames, selectedModels);
        const userSearchConditions = allConditions.filter(
            cond => !cond.includes("c.is_deleted") && !cond.includes("c.listing_status") && !cond.includes("c.is_active")
        );

        const query = `
            SELECT
                eo.id,
                eo.extra_key,
                eo.display_key,
                eo.icon,
                eo.sort_order,
                eo.is_active,
                eo.real_name_id,
                COALESCE(eot.title, eo.display_key, eo.extra_key) AS title,
                COALESCE(eot.title, eo.display_key, eo.extra_key) AS name,
                COUNT(
                    DISTINCT CASE
                        WHEN (eo.id = 6 OR eo.real_name_id = 6 OR eo.extra_key = 'eight_tyres' OR eo.extra_key = 'two_sets_of_tires') THEN
                            CASE
                                WHEN cf.id IS NOT NULL THEN c.id
                                WHEN (
                                    c.extras IS NOT NULL
                                    AND (
                                        c.extras = '6'
                                        OR FIND_IN_SET('6', REPLACE(REPLACE(REPLACE(c.extras, '[', ''), ']', ''), ' ', '')) > 0
                                        OR LOWER(TRIM(c.extras)) = '8 tires'
                                        OR LOWER(TRIM(c.extras)) = 'eight_tyres'
                                        OR FIND_IN_SET('eight_tyres', REPLACE(LOWER(c.extras), ' ', '')) > 0
                                    )
                                ) THEN c.id
                            END
                        WHEN eo.real_name_id IS NOT NULL THEN c.id
                    END
                ) AS count

            FROM extras_options eo

            LEFT JOIN extra_option_translations eot
                ON eot.extra_option_id = eo.id
               AND eot.language = ?

            LEFT JOIN tbl_car_feature cf
                ON cf.feature_id = eo.real_name_id

            LEFT JOIN tbl_cars c
                ON (
                    (eo.real_name_id IS NOT NULL AND c.id = cf.car_id)
                    OR (
                        (eo.id = 6 OR eo.real_name_id = 6 OR eo.extra_key = 'eight_tyres' OR eo.extra_key = 'two_sets_of_tires')
                        AND c.extras IS NOT NULL
                    )
                )
               AND c.is_deleted = 0
               AND c.is_active = 1
               AND c.listing_status = 'published'
               ${userSearchConditions.length ? `AND ${userSearchConditions.join(" AND ")}` : ""}

            LEFT JOIN tbl_users u
                ON u.id = c.user_id

            WHERE eo.is_active = 1

            GROUP BY
                eo.id,
                eo.extra_key,
                eo.display_key,
                eo.icon,
                eo.sort_order,
                eo.is_active,
                eo.real_name_id,
                eot.title

            ORDER BY eo.sort_order ASC, eo.id ASC
        `;

        return await db.query(query, [lang]);

    } catch (error) {
        console.error(
            "getExtrasListModel error:",
            error?.sqlMessage || error?.message
        );
        throw error;
    }
};

export const getFeaturesListModel = async (lang = "en") => {
    try {
        return await db.query(
            `
            SELECT
                f.id,
                f.feature_key,
                f.display_key,
                f.sort_order,
                COALESCE(
                    ft.title,
                    f.display_key
                ) AS name
            FROM features f
            LEFT JOIN feature_translations ft
                ON ft.feature_id = f.id
               AND ft.language = ?
            WHERE f.is_active = 1
            ORDER BY f.sort_order ASC, f.id ASC
            `,
            [lang]
        );

    } catch (error) {
        console.error(
            "getFeaturesListModel error:",
            error?.sqlMessage || error?.message
        );
        throw error;
    }
};
