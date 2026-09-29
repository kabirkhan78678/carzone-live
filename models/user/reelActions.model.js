import db from '../../config/db.js';

export const removeSavedCarReel = async ({
    userId,
    carId,
    reelType
}) => {

    return db.query(
        `
        DELETE FROM tbl_saved_car_reels
        WHERE userId = ?
          AND carId = ?
          AND reelType = ?
        `,
        [
            userId,
            carId,
            reelType
        ]
    );
};

export const saveAcarReels = async (data) => {
    return db.query("INSERT INTO tbl_saved_car_reels SET ?", [data]);
};

export const fetchSavedReelsByCurrentUserLoggendIn = async (id, carId) => {
    return db.query("SELECT * FROM tbl_saved_car_reels WHERE userId = ? AND carId =? ", [id, carId]);
};

export const fetchSavedCarReelsByUserId = async (id) => {
    return db.query("SELECT * FROM tbl_saved_car_reels WHERE userId = ? ", [id]);
};

export const removeCarReels = (carId, id) => {
    return db.query("DELETE FROM tbl_saved_car_reels WHERE userId=? AND carId = ? ", [id, carId]);
}



//--------------------------beauty-------------------------------------------------//

export const insertProfileReel = async (data) => {
    return db.query("INSERT INTO users_reels SET ?", [data]);
};

export const fetchUsersReelsModel = async (user_id) => {

    const profileReels = await db.query(`
        SELECT
            id,
            user_id,
            reel_url,
            thumbnail,
            captions,
            'profile' AS reel_type,
            createdAt
        FROM users_reels
        WHERE user_id = ?
        ORDER BY createdAt DESC
    `, [user_id]);

    const carReels = await db.query(`
        SELECT
            id,
            user_id,
            carReel AS reel_url,
            reelThumbnails AS thumbnail,
            selectYear AS captions,
            'car' AS reel_type,
             carModel,
            brandName,
            selling_price,
            carMileage,
            first_registration_date AS year,
            createdAt
        FROM tbl_cars
        WHERE user_id = ?
        AND carReel IS NOT NULL
        AND carReel != ''
        AND is_active = 1
    `, [user_id]);

    const mergedReels = [
        ...profileReels,
        ...carReels
    ];

    mergedReels.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return mergedReels;
};

export const fetchAllProfileReels = async (currentUserId) => {
    return db.query(`
        SELECT
            id,
            user_id,
            reel_url,
            thumbnail,
            captions,
            createdAt
        FROM users_reels
        WHERE user_id != ?
          AND is_active = 1
        ORDER BY RAND()
    `, [currentUserId]);
};

export const deleteCarsReelByThereIds = async (id) => {
    const query = "UPDATE tbl_cars SET carReel = null, reelThumbnails = null WHERE id = ?";
    return db.query(query, [id]);
};

export const deleteUserProfileReelById = async (id) => {
    return db.query("DELETE FROM users_reels WHERE id = ?", [id]);
};

export const getProfileReelById = async (id) => {
    return db.query(
        `
        SELECT
            id,
            user_id,
            reel_url,
            thumbnail,
            captions,
            createdAt
        FROM users_reels
        WHERE id = ?
        `,
        [id]
    );
};

export const isSavedCarReelModel = (id, carId) => {
    return db.query("SELECT * FROM tbl_saved_car_reels WHERE userId = ? AND carId=? AND reelType='car' ", [id, carId]);
};

export const getUserReelsModel = async (userId) => {
    const query = `
        SELECT
            user_id,
            reel_url,
            thumbnail,
            captions
        FROM users_reels
        WHERE user_id = ?
    `;

    return await db.query(query, [userId]);
};
