import db from '../../config/db.js';

export const insertSellerCars = async (data) => {
    return db.query("INSERT INTO tbl_cars SET ?", [data]);
};

export const markCarAsDeleted = async (carId) => {
    return db.query(`UPDATE tbl_cars SET is_deleted = 1 WHERE id = ?`, [carId]);
};

export const addCarImagesByCarId = async (carImages, id) => {
    return db.query("INSERT INTO tbl_cars_images (carId, images) VALUES (?, ?)", [id, carImages]);
};

export const fetchCarImagesByCarId = async (id) => {
    return db.query('SELECT images FROM tbl_cars_images WHERE carId = ? ', [id]);
};

export const markCarAsExpired = async (carId, userId) => {
    try {
        await db.query("UPDATE tbl_cars SET is_active = 0 WHERE id = ?", [carId]);
        await db.query(
            "UPDATE tbl_user_plans SET is_active = 0 WHERE user_id = ? AND is_active = 1",
            [userId]
        );
        console.log(`✅ Marked car ${carId} and plans for user ${userId} as expired`);
    } catch (error) {
        console.error("❌ Error expiring car and plan:", error);
    }
};

export const getAllCars = async () => {
    return db.query("SELECT * FROM tbl_cars ORDER BY id DESC");
};

export const fetchAllActiveCars = async () => {
    return db.query("SELECT * FROM tbl_cars WHERE is_active = 1 AND is_deleted = 0 ORDER BY id DESC");
};

export const getCarsByIds = async (id) => {
    return db.query("SELECT id, user_id, carModel, brandName, selling_price, totalPrice, selectYear, carMileage, selling_price AS price, carReel, reelThumbnails FROM tbl_cars WHERE id = ? ", [id]);
};

export const updateCarById = async (carId, userId, data) => {
    return db.query("UPDATE tbl_cars SET ? WHERE id = ? AND user_id = ?", [data, carId, userId]);
};

export const findCarByIdAndUser = async (carId, userId) => {
    return db.query("SELECT * FROM tbl_cars WHERE id = ? AND user_id = ?", [carId, userId]);
};

export const deleteCarImagesByCarId = async (carId) => {
    return db.query("DELETE FROM tbl_cars_images WHERE carId = ?", [carId]);
};

export const deleteCarImageByUrlModel = async (imageUrl, userId) => {
    const rawVal = typeof imageUrl === 'string' ? imageUrl.trim() : imageUrl;
    const isNumericId = /^\d+$/.test(String(rawVal));

    if (isNumericId) {
        return db.query(
            `DELETE ci FROM tbl_cars_images ci
             JOIN tbl_cars c ON ci.carId = c.id
             WHERE (ci.id = ? OR ci.images = ?) AND c.user_id = ?`,
            [Number(rawVal), String(rawVal), userId]
        );
    }

    return db.query(
        `DELETE ci FROM tbl_cars_images ci
         JOIN tbl_cars c ON ci.carId = c.id
         WHERE ci.images = ? AND c.user_id = ?`,
        [String(rawVal), userId]
    );
};

export const deleteCarById = async (carId, userId) => {
    return db.query(`UPDATE tbl_cars SET is_deleted = 1, updatedAt = NOW() WHERE id = ? AND user_id = ?`, [carId, userId]);
};

export const getActiveCarCount = async (user_id, is_active) => {
    return await db.query(
        `SELECT *
         FROM tbl_cars
         WHERE user_id = ? AND is_active = ?`,
        [user_id, is_active]
    );
};

export const countUserCars = async (user_id) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count 
         FROM tbl_cars 
         WHERE user_id = ? 
         AND is_deleted = 0 
         AND is_active = 1
         AND listing_status = 'published'`,
        [user_id]
    );
    return rows?.count || 0;
};

export const getCarsByUserId = (userId) => {
    return db.query(
        "SELECT * FROM tbl_cars WHERE user_id = ?",
        [userId]
    );
};

export const insertCar = (car) => {
    const insertQuery = `
    INSERT INTO tbl_cars
    (user_id, brandName, carModel, selectYear, engineType, fuelType, co2Emission, powerOutput, carColor, mfkDate, totalPrice, vrn, isHotDeal, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

    const values = [
        car.userId,
        car.make,
        car.model,
        car.year,
        car.engineType,
        car.fuelType,
        car.co2Emission,
        car.powerOutput,
        car.color,
        car.mfkDate,
        car.totalPrice,
        car.vrn,
        car.isHotDeal,
    ];

    return db.query(insertQuery, values);
};

export const insertCarLeasing = async (data) => {
    return db.query("INSERT INTO tbl_car_leasing SET ?", [data]);
};

export const insertCarContact = async (data) => {
    return db.query("INSERT INTO tbl_car_contacts SET ?", [data]);
};

export const updateSellerCars = async (data, car_id) => {
    return db.query(
        "UPDATE tbl_cars SET ? WHERE id = ?",
        [data, car_id]
    );
};

// Ensure tbl_car_feature exists
export const ensureCarFeatureTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS tbl_car_feature (
                id INT AUTO_INCREMENT PRIMARY KEY,
                car_id INT NOT NULL,
                feature_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        console.error('Error creating tbl_car_feature:', e);
    }
};

// Immediately invoke to ensure table exists
ensureCarFeatureTable();

export const normalizeFeatureIds = (featureIdsRaw) => {
    if (featureIdsRaw === undefined || featureIdsRaw === null) {
        return [];
    }

    let parsed = featureIdsRaw;

    if (typeof featureIdsRaw === 'string') {
        const trimmed = featureIdsRaw.trim();
        if (!trimmed) return [];
        try {
            parsed = JSON.parse(trimmed);
        } catch (e) {
            parsed = trimmed.split(',').map(s => s.trim());
        }
    }

    // Flatten nested arrays e.g. [[1, 2, 3]] -> [1, 2, 3]
    const flatList = Array.isArray(parsed) ? parsed.flat(Infinity) : [parsed];

    // Convert items to integer numbers, filter positive integers, remove duplicates
    const validFeatureIds = [...new Set(
        flatList
            .map(id => Number(id))
            .filter(id => Number.isInteger(id) && id > 0)
    )];

    return validFeatureIds;
};

export const replaceCarFeatures = async (carId, featureIdsRaw) => {
    if (!carId) return;

    const validFeatureIds = normalizeFeatureIds(featureIdsRaw);

    await ensureCarFeatureTable();

    // Delete existing feature mappings for carId
    await db.query(`DELETE FROM tbl_car_feature WHERE car_id = ?`, [carId]);

    // Bulk insert new feature mappings if present
    if (validFeatureIds.length > 0) {
        const values = validFeatureIds.map(fId => [carId, fId]);
        await db.query(`INSERT INTO tbl_car_feature (car_id, feature_id) VALUES ?`, [values]);
    }
};

