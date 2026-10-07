import { getChfFormattedPrice } from '../../utils/user_helper.js';
import db from '../../config/db.js';

export const fetchProfileReelById = async (reelId) => {
    const result = await db.query(`
        SELECT *
        FROM users_reels
        WHERE id = ?
        LIMIT 1
    `, [reelId]);

    if (!result.length) return null;

    const item = result[0];

    return {
        reelType: "profile",
        id: item.id,
        fullModel: null,
        carReel: item.reel_url,
        reelThumbnails: item.thumbnail,
        isSavedReel: false,
        carReelInfo: null,
        price: null,
        year: null,
        mileage: null,
        firstRegistration: null,
        fuelType: null,
        power: null,
        transmission: null,
        consumption: null,
        accountType: null,
        sellerAddress: null,
        sellerRating: null,
        sellerLogo: null,
        captions: item.captions || null,
        user_id: item.user_id,
        createdAt: item.createdAt || null
    };
};

export const fetchMoreProfileReelsByUser = async (
    userId,
    excludeReelId,
    limit,
    offset
) => {
    const result = await db.query(`
        SELECT *
        FROM users_reels
        WHERE user_id = ?
        AND id != ?
        ORDER BY id DESC
        LIMIT ?
        OFFSET ?
    `, [
        userId,
        excludeReelId,
        limit,
        offset
    ]);

    return result.map(item => ({
        reelType: "profile",
        id: item.id,
        fullModel: null,
        carReel: item.reel_url,
        reelThumbnails: item.thumbnail,
        isSavedReel: false,
        carReelInfo: null,
        price: null,
        year: null,
        mileage: null,
        firstRegistration: null,
        fuelType: null,
        power: null,
        transmission: null,
        consumption: null,
        accountType: null,
        sellerAddress: null,
        sellerRating: null,
        sellerLogo: null,
        captions: item.captions || null,
        user_id: item.user_id,
        createdAt: item.createdAt || null
    }));
};

export const fetchMixedReelsByUser = async (
    userId,
    excludeProfileReelId,
    currentUserId,
    lang = "en"
) => {
    // Profile Reels
    const profileReels = await db.query(`
        SELECT *
        FROM users_reels
        WHERE user_id = ?
        AND id != ?
    `, [
        userId,
        excludeProfileReelId
    ]);

    // Car Reels
    const carReels = await db.query(`
        SELECT
            c.id,
            c.user_id,
            c.carModel,
            c.brandName,
            c.selling_price,
            c.carReel,
            c.reelThumbnails,
            c.selectYear,
            c.carMileage,
            COALESCE(fit.label, c.fuelType) AS fuel_type_value,
            COALESCE(tt.label, c.transmission) AS transmission_value,
            u.profileImage AS seller_profile_image,
            u.google_rating AS seller_rating
        FROM tbl_cars c
        JOIN tbl_users u ON u.id = c.user_id
        LEFT JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = c.fuel_type_id
            AND fit.lang = ?
        LEFT JOIN tbl_transmissions t
            ON t.id = c.transmission_id
        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
            AND tt.language_code = ?
        WHERE c.user_id = ?
        AND c.carReel IS NOT NULL
        AND c.carReel != ''
        AND c.is_deleted = 0
    `, [
        lang,
        lang,
        userId
    ]);

    const formattedProfileReels = profileReels.map(item => ({
        reelType: "profile",
        id: item.id,
        fullModel: null,
        carReel: item.reel_url,
        reelThumbnails: item.thumbnail,
        isSavedReel: false,
        carReelInfo: null,
        price: null,
        year: null,
        mileage: null,
        firstRegistration: null,
        fuelType: null,
        power: null,
        transmission: null,
        consumption: null,
        accountType: null,
        sellerAddress: null,
        sellerRating: null,
        sellerLogo: null,
        captions: item.captions || null,
        user_id: item.user_id,
        createdAt: item.createdAt || null
    }));

    const formattedCarReels = carReels.map(item => ({
        reelType: "car",
        id: item.id,
        fullModel: `${item.brandName || ''} ${item.carModel || ''}`.trim(),
        carReel: item.carReel,
        reelThumbnails: item.reelThumbnails,
        isSavedReel: false,
        carReelInfo: null,
        price: item.selling_price ? getChfFormattedPrice(item.selling_price) : null,
        year: item.selectYear || null,
        mileage: item.carMileage ? `${item.carMileage} km` : null,
        firstRegistration: null,
        fuelType: item.fuel_type_value || null,
        power: null,
        transmission: item.transmission_value || null,
        consumption: null,
        accountType: null,
        sellerAddress: null,
        sellerRating: item.seller_rating || null,
        sellerLogo: item.seller_profile_image || null,
        captions: null,
        user_id: item.user_id,
        createdAt: null
    }));

    // Combine
    return [...formattedProfileReels, ...formattedCarReels];
};
