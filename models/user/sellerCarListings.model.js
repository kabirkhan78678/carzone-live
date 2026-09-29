import db from '../../config/db.js';

export const getSellerCarsModel = async (
    userId,
    language,
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
            btt.language_code AS body_type_language,
            btt.label AS body_type_label,
            vc.condition_key AS car_condition,
            tt.label AS transmission_value,
            fit.label AS fuel_type_value
        FROM tbl_cars c

        LEFT JOIN tbl_body_type_translations btt
            ON c.body_type_id = btt.body_type_id
           AND btt.language_code = ?

        LEFT JOIN tbl_vehicle_conditions vc
            ON c.carCondition = vc.id

        LEFT JOIN tbl_transmissions t
            ON t.id = c.transmission_id
           AND t.is_active = 1

        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
           AND tt.language_code = ?

        LEFT JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = c.fuel_type_id
           AND fit.lang = ?

        WHERE c.user_id = ?
          AND c.is_deleted = 0
    `;

    const params = [
        language, // body type translation
        language, // transmission translation
        language, // fuel type translation
        userId,
    ];

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

        query += ` AND c.body_type_id IN (${bodyTypes
            .map(() => "?")
            .join(",")})`;

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

    // Listing status (supports single or multiple)
    if (listing_status) {
        const statuses = Array.isArray(listing_status)
            ? listing_status
            : [listing_status];

        query += ` AND c.listing_status IN (${statuses
            .map(() => "?")
            .join(",")})`;

        params.push(...statuses);
    }

    // query += ` ORDER BY c.createdAt DESC`;

    const sortMap = {
    price_low_to_high:
        "CAST(c.selling_price AS DECIMAL(15,2)) ASC",

    price_high_to_low:
        "CAST(c.selling_price AS DECIMAL(15,2)) DESC",

    mileage_low_to_high:
        "CAST(c.carMileage AS DECIMAL(15,2)) ASC",

    mileage_high_to_low:
        "CAST(c.carMileage AS DECIMAL(15,2)) DESC",

    year_old_to_new:
        "c.first_registration_date ASC",

    year_new_to_old:
        "c.first_registration_date DESC",

    brand_model_a_to_z:
        "c.brandName ASC, c.carModel ASC",

    brand_model_z_to_a:
        "c.brandName DESC, c.carModel DESC",

    horsepower_low_to_high:
        "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2)) ASC",

    horsepower_high_to_low:
        "CAST(NULLIF(c.power_ps, '') AS DECIMAL(15,2)) DESC",

    published_most_recent:
        "c.createdAt DESC",

    published_oldest:
        "c.createdAt ASC"
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

    // Attach images
    cars.forEach((car) => {
        car.images = imageMap[car.id] || [];
    });

    return cars;
};
