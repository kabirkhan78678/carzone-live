import db from '../../config/db.js';

export const replaceOpeningTimes = async (userId, times) => {
    await db.query(
        "DELETE FROM seller_opening_times WHERE user_id = ?",
        [userId]
    );

    // Ensure times is an array
    if (!Array.isArray(times)) {
        console.error("Invalid opening times format:", times);
        throw new Error("openingTimes must be an array");
    }

    // Map full day names to enum values
    const dayMapping = {
        Monday: "mon",
        Tuesday: "tue",
        Wednesday: "wed",
        Thursday: "thu",
        Friday: "fri",
        Saturday: "sat",
        Sunday: "sun"
    };

    for (const t of times) {
        // Prevent undefined/null objects
        if (!t || typeof t !== "object") {
            console.warn("Invalid opening time entry:", t);
            continue;
        }

        // Validate day
        if (!t.day) {
            console.warn("Day is missing in opening time entry:", t);
            continue;
        }

        const day =
            dayMapping[t.day] ||
            String(t.day).toLowerCase().substring(0, 3);

        // Morning times
        const morningOpenTime =
            t.morning_open_time && t.morning_open_time !== ""
                ? t.morning_open_time
                : null;

        const morningCloseTime =
            t.morning_close_time && t.morning_close_time !== ""
                ? t.morning_close_time
                : null;

        // Afternoon times
        const afternoonOpenTime =
            t.afternoon_open_time && t.afternoon_open_time !== ""
                ? t.afternoon_open_time
                : null;

        const afternoonCloseTime =
            t.afternoon_close_time && t.afternoon_close_time !== ""
                ? t.afternoon_close_time
                : null;

        // Closed if no morning or afternoon timing is provided
        const isClosed =
            !morningOpenTime &&
            !morningCloseTime &&
            !afternoonOpenTime &&
            !afternoonCloseTime;

        await db.query(
            `INSERT INTO seller_opening_times (
                user_id,
                day,
                morning_open_time,
                morning_close_time,
                afternoon_open_time,
                afternoon_close_time,
                is_closed
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                day,
                morningOpenTime,
                morningCloseTime,
                afternoonOpenTime,
                afternoonCloseTime,
                isClosed
            ]
        );
    }
};


// advantages

export const replaceAdvantages = async (userId, advantages) => {
    await db.query("DELETE FROM seller_advantages WHERE user_id = ?", [userId]);

    for (const item of advantages) {
        // Handle both string format and object format from frontend
        const title = typeof item === 'string' ? item : (item.advantage || item.title || item);
        await db.query(
            "INSERT INTO seller_advantages (user_id, title) VALUES (?, ?)",
            [userId, title]
        );
    }
};


// services

export const replaceServices = async (userId, services) => {
    await db.query("DELETE FROM seller_services WHERE user_id = ?", [userId]);

    for (const s of services) {
        await db.query(
            `INSERT INTO seller_services (user_id, service_name, isActive)
       VALUES (?, ?, ?)`,
            [userId, s.service_name, s.isActive ? 1 : 0]
        );
    }
};

// code by raj implementing  on delete cascade POLISHED)

export const getSellerOpeningTimesModel = (userId) => {
    return db.query(
        `SELECT day, morning_open_time, morning_close_time,afternoon_open_time,afternoon_close_time, is_closed
     FROM seller_opening_times
     WHERE user_id = ?`,
        [userId]
    );
};
