import db from '../../config/db.js';

export const getSellerCarsModel = async (
    userId,
    language = "en",
    filters = {}
) => {
    const {
        search,
        brandName,
        body_type_id,
        totalPrice,
        minPrice,
        maxPrice,
        listing_status,
        sort_key
    } = filters;

    let query = `
        SELECT
            c.*,
            fit.label AS fuel_type_value,
            tt.label AS transmission_value,
            dt.label AS drive_type_value,
            btt.label AS body_type_value,
            btt.label AS body_type_label,
            btt.language_code AS body_type_language,
            vct.name AS condition_value,
            vc.condition_key AS car_condition,
            vst_state.label AS state_value,
            COALESCE(c.exterior_color_custom, ect.name) AS exterior_color_value,
            COALESCE(c.interior_color_custom, ict.name) AS interior_color_value,
            wtt_warranty.name AS warranty_value,
            wq.id AS warranty_type_id_resolved,
            wqt.label AS warranty_type_value,
            qs.id AS quality_seal_id_resolved,
            qs.name AS quality_seal_name,
            qs.image AS quality_seal_image,
            qs.description AS quality_seal_description,
            cl.monthly_price AS leasing_value,
            cl.interest_rate AS annual_interest_rate,
            cl.residual_percentage AS residual_value,
            cl.banking_partner
        FROM tbl_cars c

        LEFT JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = c.fuel_type_id
           AND fit.lang = ?

        LEFT JOIN tbl_transmissions t
            ON t.id = c.transmission_id
           AND t.is_active = 1

        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
           AND tt.language_code = ?

        LEFT JOIN tbl_drives d
            ON d.id = c.drive_type_id
           AND d.is_active = 1

        LEFT JOIN tbl_drive_translations dt
            ON dt.drive_id = d.id
           AND dt.language_code = ?

        LEFT JOIN tbl_body_types bt
            ON bt.id = c.body_type_id
           AND bt.is_active = 1

        LEFT JOIN tbl_body_type_translations btt
            ON btt.body_type_id = bt.id
           AND btt.language_code = ?

        LEFT JOIN tbl_vehicle_conditions vc
            ON vc.id = c.carCondition

        LEFT JOIN tbl_vehicle_condition_translations vct
            ON vct.condition_id = c.carCondition
           AND vct.language_code = ?

        LEFT JOIN tbl_vehicle_state_translations vst_state
            ON vst_state.vehicle_state_id = c.state_id
           AND vst_state.language_code = ?

        LEFT JOIN tbl_color_translations ect
            ON ect.color_id = c.exterior_color_id
           AND ect.language_code = ?

        LEFT JOIN tbl_color_translations ict
            ON ict.color_id = c.interior_color_id
           AND ict.language_code = ?

        LEFT JOIN tbl_warranty_types wt_warranty
            ON wt_warranty.id = c.mfk_warrenty_id
           AND wt_warranty.is_active = 1

        LEFT JOIN tbl_warranty_type_translations wtt_warranty
            ON wtt_warranty.warranty_type_id = wt_warranty.id
           AND wtt_warranty.language_code = ?

        LEFT JOIN warranty_qualities wq
            ON wq.id = c.warranty_type_text
           AND wq.is_active = 1

        LEFT JOIN warranty_qualities_translations wqt
            ON wqt.warranty_quality_id = wq.id
           AND wqt.language_code = ?

        LEFT JOIN tbl_quality_seals qs
            ON qs.id = c.quality_seal_id
           AND qs.is_delete = 0

        LEFT JOIN (
            SELECT
                l.car_id,
                l.monthly_price,
                l.interest_rate,
                l.residual_percentage,
                l.banking_partner
            FROM tbl_car_leasing l
            INNER JOIN (
                SELECT car_id, MAX(id) AS latest_id
                FROM tbl_car_leasing
                GROUP BY car_id
            ) latest
                ON latest.latest_id = l.id
        ) cl
            ON cl.car_id = c.id

        WHERE c.user_id = ?
          AND c.is_deleted = 0
          AND c.is_active = 1
    `;

    const params = [
        language, // fuel
        language, // transmission
        language, // drive
        language, // body type
        language, // condition
        language, // state
        language, // exterior color
        language, // interior color
        language, // warranty
        language, // warranty quality
        userId,
    ];

    // Listing status filter
    if (listing_status) {
        const statuses = Array.isArray(listing_status)
            ? listing_status
            : [listing_status];

        query += ` AND c.listing_status IN (${statuses.map(() => "?").join(",")})`;
        params.push(...statuses);
    } else {
        query += ` AND c.listing_status = 'published'`;
    }

    // Search by brand or model
    if (search) {
        query += `
            AND (
                c.brandName LIKE ?
                OR c.carModel LIKE ?
            )
        `;
        params.push(`%${search}%`, `%${search}%`);
    }

    // Brand filter (supports single or multiple)
    if (brandName) {
        const brands = Array.isArray(brandName)
            ? brandName
            : [brandName];

        query += ` AND c.brandName IN (${brands.map(() => "?").join(",")})`;
        params.push(...brands);
    }

    // Body Type filter (supports single or multiple)
    if (body_type_id) {
        const bodyTypes = Array.isArray(body_type_id)
            ? body_type_id
            : [body_type_id];

        query += ` AND c.body_type_id IN (${bodyTypes.map(() => "?").join(",")})`;
        params.push(...bodyTypes.map(Number));
    }

    // Exact total price
    if (totalPrice) {
        query += ` AND c.totalPrice = ?`;
        params.push(totalPrice);
    }

    // Price range
    if (minPrice) {
        query += ` AND c.selling_price >= ?`;
        params.push(minPrice);
    }

    if (maxPrice) {
        query += ` AND c.selling_price <= ?`;
        params.push(maxPrice);
    }

    const sortMap = {
        price_low_to_high: "CAST(c.selling_price AS DECIMAL(15,2)) ASC",
        price_high_to_low: "CAST(c.selling_price AS DECIMAL(15,2)) DESC",
        mileage_low_to_high: "CAST(c.carMileage AS DECIMAL(15,2)) ASC",
        mileage_high_to_low: "CAST(c.carMileage AS DECIMAL(15,2)) DESC",
        year_old_to_new: "c.first_registration_date ASC",
        year_new_to_old: "c.first_registration_date DESC",
        brand_model_a_to_z: "c.brandName ASC, c.carModel ASC",
        brand_model_z_to_a: "c.brandName DESC, c.carModel DESC",
        horsepower_low_to_high: "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2)) ASC",
        horsepower_high_to_low: "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2)) DESC",
        published_most_recent: "c.createdAt DESC",
        published_oldest: "c.createdAt ASC"
    };

    const normalizedSortKeys = (
        Array.isArray(sort_key)
            ? sort_key
            : String(sort_key || "").split(",")
    )
        .map((key) => String(key).trim().toLowerCase())
        .filter(Boolean);

    const orderParts = normalizedSortKeys
        .map((key) => sortMap[key])
        .filter(Boolean);

    const orderClause = `
        ORDER BY
        ${
            orderParts.length
                ? orderParts.join(", ")
                : sortMap.published_most_recent
        },
        c.id DESC
    `;

    query += orderClause;

    // Fetch cars
    const cars = await db.query(query, params);

    if (!cars.length) {
        return [];
    }

    // Get all car ids
    const carIds = cars.map((car) => car.id);
    const placeholders = carIds.map(() => "?").join(",");

    // Fetch images
    const carImages = await db.query(
        `
        SELECT
            carId,
            images
        FROM tbl_cars_images
        WHERE carId IN (${placeholders})
        ORDER BY id ASC
        `,
        carIds
    );

    // Group images by carId
    const imageMap = {};
    carImages.forEach((img) => {
        if (!imageMap[img.carId]) {
            imageMap[img.carId] = [];
        }
        imageMap[img.carId].push(img.images);
    });

    // Attach images and formatted fields
    cars.forEach((car) => {
        const imgs = imageMap[car.id] || [];
        car.images = imgs;
        car.carImages = imgs;

        const powerParts = [];
        if (car.power_ps != null) {
            powerParts.push(`${car.power_ps} PS`);
        }
        if (car.power_kw != null) {
            powerParts.push(`${car.power_kw} KW`);
        }
        car.powerOutput = powerParts.length ? powerParts.join(" / ") : car.powerOutput || null;

        car.warranty_type_id = car.warranty_type_id_resolved ?? car.warranty_type_text ?? null;
        car.quality_seal = (car.quality_seal_id || car.quality_seal_id_resolved) ? {
            id: car.quality_seal_id_resolved || car.quality_seal_id,
            name: car.quality_seal_name ?? null,
            image: car.quality_seal_image ?? null,
            description: car.quality_seal_description ?? null
        } : null;

        delete car.warranty_type_id_resolved;
    });

    return cars;
};
