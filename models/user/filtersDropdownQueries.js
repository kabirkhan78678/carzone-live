import db from '../../config/db.js';

export async function querySellerTypeFacet(sellerJoinExtra) {
    return await db.query(`
        SELECT
            CASE
                WHEN u.account_type = 'company' THEN 'business'
                WHEN u.account_type = 'private' THEN 'personal'
            END AS seller_type,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_users u
        LEFT JOIN tbl_cars c
            ON c.user_id = u.id
            AND c.is_active = 1
            AND c.is_deleted = 0
            AND c.listing_status = 'published'
            ${sellerJoinExtra.length ? `AND ${sellerJoinExtra.join(" AND ")}` : ""}
        WHERE u.account_type IN ('company','private')
        GROUP BY u.account_type
    `);
}

export async function queryBrandAndModelFacets(sellerJoin, baseWhere) {
    const brand_name_list = await db.query(`
        SELECT
            TRIM(c.brandName) AS brand_name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
            AND c.brandName IS NOT NULL
            AND TRIM(c.brandName) <> ''
        GROUP BY TRIM(c.brandName)
        ORDER BY brand_name ASC
    `);

    const model_name_list = await db.query(`
        SELECT
            TRIM(c.carModel) AS model_name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_cars c
        ${sellerJoin}
        ${baseWhere}
            AND c.carModel IS NOT NULL
            AND TRIM(c.carModel) <> ''
        GROUP BY TRIM(c.carModel)
        ORDER BY model_name ASC
    `);

    return { brand_name_list, model_name_list };
}

export async function queryCategoricalFacets(carJoinClause, sellerJoin, whereNonCar) {
    const bodyTypeQuery = `
        SELECT
            bt.id,
            bt.image,
            btt.label AS name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_body_types bt
        LEFT JOIN tbl_body_type_translations btt
            ON btt.body_type_id = bt.id
            AND btt.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.body_type_id = bt.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY bt.id, btt.label
    `;

    const fuelTypeQuery = `
        SELECT
            ft.id,
            ftt.label AS name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_fuel_types ft
        LEFT JOIN tbl_fuel_type_translations ftt
            ON ftt.fuel_type_id = ft.id
            AND ftt.lang = 'en'
        LEFT JOIN tbl_cars c
            ON c.fuel_type_id = ft.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY ft.id, ftt.label
    `;

    const transmissionQuery = `
        SELECT
            t.id,
            tt.label AS name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_transmissions t
        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
            AND tt.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.transmission_id = t.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY t.id, tt.label
    `;

    const driveQuery = `
        SELECT
            d.id,
            dt.label AS name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_drives d
        LEFT JOIN tbl_drive_translations dt
            ON dt.drive_id = d.id
            AND dt.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.drive_type_id = d.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY d.id, dt.label
    `;

    const stateQuery = `
        SELECT
            vs.id,
            vst.label AS name,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_vehicle_states vs
        LEFT JOIN tbl_vehicle_state_translations vst
            ON vst.vehicle_state_id = vs.id
            AND vst.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.state_id = vs.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY vs.id, vst.label
    `;

    const interiorColorQuery = `
        SELECT
            ic.id,
            ict.name,
            ic.hex_code,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_colors ic
        LEFT JOIN tbl_color_translations ict
            ON ict.color_id = ic.id
            AND ict.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.interior_color_id = ic.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY ic.id, ict.name, ic.hex_code
        ORDER BY ict.name ASC
    `;

    const exteriorColorQuery = `
        SELECT
            ec.id,
            ect.name,
            ec.hex_code,
            COUNT(DISTINCT c.id) AS total
        FROM tbl_colors ec
        LEFT JOIN tbl_color_translations ect
            ON ect.color_id = ec.id
            AND ect.language_code = 'en'
        LEFT JOIN tbl_cars c
            ON c.exterior_color_id = ec.id ${carJoinClause}
        ${sellerJoin}
        ${whereNonCar}
        GROUP BY ec.id, ect.name, ec.hex_code
    `;

    const [bodyType, fuelType, transmission, drive, state, interior_color, exterior_color] = await Promise.all([
        db.query(bodyTypeQuery),
        db.query(fuelTypeQuery),
        db.query(transmissionQuery),
        db.query(driveQuery),
        db.query(stateQuery),
        db.query(interiorColorQuery),
        db.query(exteriorColorQuery)
    ]);

    return { bodyType, fuelType, transmission, drive, state, interior_color, exterior_color };
}

export async function queryAgeOfListingFacet(sellerJoin, baseWhere) {
    const ageOfListingQuery = `
        SELECT bucket, COUNT(DISTINCT id) as total
        FROM (
            SELECT
                c.id,
                CASE
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) <= 1 THEN '1 day'
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) = 2 THEN '2 days'
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) = 3 THEN '3 days'
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) BETWEEN 4 AND 7 THEN '7 days'
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) BETWEEN 8 AND 10 THEN '10 days'
                    WHEN DATEDIFF(CURDATE(), c.first_registration_date) BETWEEN 11 AND 15 THEN '15 days'
                    ELSE '15+ days'
                END as bucket
            FROM tbl_cars c
            ${sellerJoin}
            ${baseWhere}
            AND c.first_registration_date IS NOT NULL
        ) as sub
        GROUP BY bucket
    `;
    return await db.query(ageOfListingQuery);
}
