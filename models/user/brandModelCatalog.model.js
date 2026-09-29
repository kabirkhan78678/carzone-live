import db from '../../config/db.js';

export const getModelsByMakeModel = async (
    brand_id,
    search = ""
) => {

    let whereClause = `WHERE m.brand_id = ?`;

    const params = [brand_id];

    if (search) {
        whereClause += ` AND LOWER(m.model_name) LIKE ?`;
        params.push(`%${search.toLowerCase()}%`);
    }

    const query = `
        SELECT
            m.id,
            m.model_name,
            m.vehicle_type,
            COUNT(c.id) AS total_cars
 
        FROM tbl_vehicle_catalog_models m
 
        LEFT JOIN tbl_vehicle_catalog_brands b
            ON b.id = m.brand_id
 
        LEFT JOIN tbl_cars c
            ON LOWER(c.carModel) = LOWER(m.model_name)
            AND LOWER(c.brandName) = LOWER(b.brand_name)
            AND c.is_active = 1
            AND c.is_deleted = 0
            AND c.listing_status = 'published'
 
        ${whereClause}
 
        GROUP BY m.id
 
        ORDER BY total_cars DESC, m.model_name ASC
    `;

    const rows = await db.query(query, params);

    const totalCars = rows.reduce(
        (sum, row) => sum + Number(row.total_cars),
        0
    );

    return {
        total_car_count: totalCars,
        models: rows
    };
};

export const getBrandsListModel = async () => {

    const query = `
        SELECT
            id,
            brand_name
        FROM tbl_vehicle_catalog_brands
        ORDER BY brand_name ASC
    `;

    return db.query(query);

};

export const getModelsListModel = async (brand_id) => {

    const query = `
        SELECT
            id,
            brand_id,
            vehicle_type,
            model_name
        FROM tbl_vehicle_catalog_models
        WHERE brand_id = ?
        ORDER BY model_name ASC
    `;

    return db.query(query, [brand_id]);

};


//         SELECT
//             id,
//             model_id,
//             fzkey,
//             version_name,
//             production_from,
//             production_to
//         FROM tbl_vehicle_catalog_versions
//         WHERE model_id = ?
//         ORDER BY version_name ASC
//     `;


// };

export const getAllMakesModel = async (search = "") => {

    try {

        const params = [];
        let whereClause = "";

        if (search) {
            whereClause = `WHERE LOWER(b.brand_name) LIKE ?`;
            params.push(`%${search.toLowerCase()}%`);
        }

        const query = `
            SELECT
                b.id,
                b.brand_name,
                COUNT(car.id) AS count
            FROM tbl_vehicle_catalog_brands b
            LEFT JOIN tbl_cars car
                ON LOWER(TRIM(car.brandName)) = LOWER(TRIM(b.brand_name))
                AND car.is_active = 1
                AND car.is_deleted = 0
                AND car.listing_status = 'published'
            ${whereClause}
            GROUP BY b.id, b.brand_name
            ORDER BY b.brand_name ASC
        `;

        const rows = await db.query(query, params);

        return rows.map(row => ({
            id: row.id,
            brand_name: row.brand_name,
            count: Number(row.count || 0)
        }));

    } catch (error) {
        console.error("getAllMakesModel ERROR:", error);
        throw error;
    }
};

// ======================================================
// GET MODELS BY MAKE
//by krn 
// ======================================================

//     brand_id,
//     search = ""
// ) => {

//         WHERE m.brand_id = ?
//     `;



//         whereClause += `
//             AND LOWER(m.model_name)
//             LIKE ?
//         `;

//         params.push(`%${search.toLowerCase()}%`);
//     }


//         SELECT

//             m.id,
//             m.model_name,
//             m.vehicle_type,

//             COUNT(c.id) AS total_cars

//         FROM tbl_vehicle_catalog_models m

//         LEFT JOIN tbl_vehicle_catalog_brands b
//             ON b.id = m.brand_id

//         LEFT JOIN tbl_cars c
//             ON LOWER(c.carModel) = LOWER(m.model_name)
//             AND LOWER(c.brandName) = LOWER(b.brand_name)

//         ${whereClause}

//         GROUP BY m.id

//         ORDER BY total_cars DESC,
//         m.model_name ASC
//     `;


//         (sum, row) => sum + Number(row.total_cars),
//         0
//     );

//         total_car_count: totalCars,
//         models: rows
//     };
// };
