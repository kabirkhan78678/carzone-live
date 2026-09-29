import db from '../../config/db.js';

export async function queryRangeAndTotalsFacets(filters, sellerJoin, baseWhere) {
    const { year_from, year_to, km_from, km_to, price_from, price_to } = filters;

    const yearRangeQuery = `
        SELECT
            COUNT(DISTINCT CASE
                    WHEN YEAR(c.first_registration_date) BETWEEN ${Number(year_from || 0)}
                    AND ${Number(year_to || new Date().getFullYear())}
                    THEN c.id
                END
            ) as selected_model_years,

            COUNT(DISTINCT CASE
                WHEN YEAR(c.first_registration_date) < ${Number(year_from || 0)}
                THEN c.id
            END
            ) as older_model_years,

            COUNT(DISTINCT CASE
                WHEN YEAR(c.first_registration_date) > ${Number(year_to || new Date().getFullYear())}
                THEN c.id
            END
            ) as newly_model_years,

            COUNT(DISTINCT c.id) as total_cars_found
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
    `;

    const kilometerRangeQuery = `
        SELECT
            COUNT(DISTINCT CASE
                    WHEN c.carMileage BETWEEN ${Number(km_from || 0)}
                    AND ${Number(km_to || 999999999)}
                    THEN c.id
                END
            ) as selected_mileage,

            COUNT(DISTINCT CASE
                WHEN c.carMileage < ${Number(km_from || 0)}
                THEN c.id
            END
            ) as lower_mileage,

            COUNT(DISTINCT CASE
                WHEN c.carMileage > ${Number(km_to || 999999999)}
                THEN c.id
            END
            ) as higher_mileage,

            COUNT(DISTINCT c.id) as total_cars_found
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
    `;

    const priceRangeQuery = `
        SELECT
            COUNT(DISTINCT CASE
                    WHEN c.selling_price BETWEEN ${Number(price_from || 0)}
                    AND ${Number(price_to || 999999999)}
                    THEN c.id
                END
            ) as matching_vehicles,

            COUNT(DISTINCT c.id) as total_cars_found
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
    `;

    const mfkWarrantyCountQuery = `
        SELECT
            COUNT(DISTINCT CASE
                WHEN c.mfk_status_id IS NOT NULL
                     AND c.mfk_status_id NOT IN (4, 5)
                THEN c.id
            END) AS mfk_count,

            COUNT(DISTINCT CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM tbl_warranty_types wtt
                    WHERE wtt.id = c.mfk_warrenty_id
                      AND wtt.warranty_key IS NOT NULL
                      AND TRIM(wtt.warranty_key) != ''
                      AND wtt.warranty_key != 'no_warranty'
                )
                THEN c.id
            END) AS warranty_count
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
    `;

    const totalCarsQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
    `;

    const [year_range, kilometer_range, price_range, mfkWarrantyCountRaw, total_cars_raw] = await Promise.all([
        db.query(yearRangeQuery),
        db.query(kilometerRangeQuery),
        db.query(priceRangeQuery),
        db.query(mfkWarrantyCountQuery),
        db.query(totalCarsQuery)
    ]);

    const totalCarsFound = total_cars_raw[0]?.total || 0;
    if (year_range[0]) year_range[0].total_cars_found = totalCarsFound;
    if (kilometer_range[0]) kilometer_range[0].total_cars_found = totalCarsFound;
    if (price_range[0]) price_range[0].total_cars_found = totalCarsFound;

    return {
        year_range: year_range[0] || {},
        kilometer_range: kilometer_range[0] || {},
        price_range: price_range[0] || {},
        mfk_warranty: {
            mfk: Number(mfkWarrantyCountRaw[0]?.mfk_count || 0),
            warranty: Number(mfkWarrantyCountRaw[0]?.warranty_count || 0)
        },
        total_cars: totalCarsFound
    };
}
