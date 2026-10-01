import { getChfFormattedPrice } from '../../utils/user_helper.js';
import db from '../../config/db.js';
import { fetchSavedReelsByCurrentUserLoggendIn } from './reelActions.model.js';

export const fetchActiveCarReels = async (
    id,
    lang = "en",
    filters = {},
) => {

    let conditions = [
        "c.is_active = 1",
        "c.is_deleted = 0",
        "c.carReel IS NOT NULL",
        "c.carReel != ''"
    ];

    let params = [lang, lang];

    if (filters.car_id) {
        conditions.push("(c.user_id != ? OR c.id = ?)");
        params.push(id, Number(filters.car_id));
    } else {
        conditions.push("c.user_id != ?");
        params.push(id);
    }

    // Make Filter
    if (
        Array.isArray(filters.make) &&
        filters.make.length > 0
    ) {
        const cleanedMakes = filters.make
            .map(item => String(item).replace(/\+/g, " ").trim().toLowerCase())
            .filter(Boolean);

        if (cleanedMakes.length > 0) {
            const placeholders = cleanedMakes.map(() => "?").join(",");

            conditions.push(`
                LOWER(TRIM(c.brandName)) IN (${placeholders})
            `);

            params.push(...cleanedMakes);
        }
    }

    // Body Type Filter
    if (
        Array.isArray(filters.body_type_id) &&
        filters.body_type_id.length > 0
    ) {
        const cleanedBodyTypes = filters.body_type_id
            .map(item => Number(item))
            .filter(item => Number.isFinite(item) && item > 0);

        if (cleanedBodyTypes.length > 0) {
            const placeholders = cleanedBodyTypes.map(() => "?").join(",");

            conditions.push(`
                c.body_type_id IN (${placeholders})
            `);

            params.push(...cleanedBodyTypes);
        }
    }

    // Price Range Filter
    if (filters.price_from && filters.price_to) {
        conditions.push("c.selling_price BETWEEN ? AND ?");
        params.push(
            Number(filters.price_from),
            Number(filters.price_to)
        );
    } else if (filters.price_from) {
        conditions.push("c.selling_price >= ?");
        params.push(Number(filters.price_from));
    } else if (filters.price_to) {
        conditions.push("c.selling_price <= ?");
        params.push(Number(filters.price_to));
    }

    const query = `
        SELECT
            c.id,
            c.user_id,
            c.carModel,
            c.brandName,
            c.selling_price,
            c.carReel,
            c.reelThumbnails,
            c.first_registration_date AS selectYear,
            c.carMileage,
            c.first_registration_date,
            c.powerOutput,
            c.power_ps,
            c.power_kw,
            c.consumption,
            c.body_type_id,

            COALESCE(fit.label, c.fuelType) AS fuel_type_value,
            COALESCE(tt.label, c.transmission) AS transmission_value,

            u.companyName,
            u.fullName,
            u.fullAddress,
            u.pincode,
            u.city,
            u.account_type,
            u.profileImage AS seller_profile_image,
            u.google_rating AS seller_rating

        FROM tbl_cars c

        JOIN tbl_users u
            ON u.id = c.user_id

        LEFT JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = c.fuel_type_id
            AND fit.lang = ?

        LEFT JOIN tbl_transmissions t
            ON t.id = c.transmission_id
            AND t.is_active = 1

        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
            AND tt.language_code = ?

        WHERE ${conditions.join(" AND ")}

        ORDER BY RAND()
    `;

    return db.query(query, params);
};

export const fetchCarReelById = async (
    reelId,
    currentUserId,
    lang = "en"
) => {

    const result = await db.query(`
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
            c.first_registration_date,
            c.powerOutput,
            c.consumption,

            COALESCE(fit.label, c.fuelType) AS fuel_type_value,
            COALESCE(tt.label, c.transmission) AS transmission_value,

            u.profileImage AS seller_profile_image,
            u.google_rating AS seller_rating

        FROM tbl_cars c

        JOIN tbl_users u
            ON u.id = c.user_id

        LEFT JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = c.fuel_type_id
            AND fit.lang = ?

        LEFT JOIN tbl_transmissions t
            ON t.id = c.transmission_id

        LEFT JOIN tbl_transmission_translations tt
            ON tt.transmission_id = t.id
            AND tt.language_code = ?

        WHERE c.id = ?
        LIMIT 1
    `, [lang, lang, reelId]);

    if (!result.length) return null;

    const item = result[0];

    const fetchReelsSaved =
        await fetchSavedReelsByCurrentUserLoggendIn(
            currentUserId,
            item.id
        );

    const isSavedReel =
        fetchReelsSaved.length > 0;

    const formattedPrice =
        getChfFormattedPrice(item.selling_price);

    const formattedMileage =
        item.carMileage
            ? `${Number(item.carMileage).toLocaleString("en-US")} km`
            : null;

    return {
        reelType: "car",

        id: item.id,

        fullModel:
            `${item.brandName} ${item.carModel}`.trim(),

        carReel: item.carReel,
        reelThumbnails: item.reelThumbnails,

        isSavedReel,

        carReelInfo:
            `${formattedPrice} | ${item.fuel_type_value} | ${formattedMileage}`,

        price: formattedPrice,
        year: item.selectYear || null,
        mileage: formattedMileage,

        fuelType:
            item.fuel_type_value || null,

        transmission:
            item.transmission_value || null,

        sellerLogo:
            item.seller_profile_image || null,

        sellerRating:
            item.seller_rating ?? null
    };
};
