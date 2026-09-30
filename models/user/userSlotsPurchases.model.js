import db from '../../config/db.js';

export const insertSlotRequest = ({ user_id, requested_slots, message, duration_type }) => {

    return db.query(
        `INSERT INTO slot_requests (user_id, requested_slots, message, status,duration_type) VALUES (?, ?, ?, 'pending',?)`,
        [user_id, requested_slots, message,duration_type]
    );
};

export const getLatestSlotRequestStatus = (user_id) => {
    return db.query(
        `SELECT status FROM slot_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [user_id]
    );
};

export const fetchApprovedSlotRequestsByUserId = async (userId) => {
    try {
        const query = `
            SELECT
                sr.id,
                sr.user_id,
                sr.requested_slots,
                sr.message,
                sr.status,
                sr.admin_message,
                p.name AS plan_name,
                p.price AS plan_price,
                p.slot_count AS plan_slots
            FROM
                slot_requests sr
            LEFT JOIN
                tbl_plans p ON sr.plan_id = p.id
            WHERE
                sr.user_id = ? AND sr.status = 'approved' AND sr.plan_id IS NOT NULL;
        `;

        const rows = await db.query(query, [userId]);
        return rows;
    } catch (error) {
        console.error("Error fetching approved slot requests:", error);
        throw error;
    }
};

export const fetchSlotRequests = async ({ userId } = {}) => {
    const baseQuery = `
        SELECT 
            sr.*,
            sr.duration_type AS subscription_preference,
            u.fullName,
            u.phoneNumber,
            u.email,
            u.profileImage,
            COALESCE((
                SELECT up.total_slots 
                FROM tbl_user_plans up 
                WHERE up.user_id = sr.user_id AND up.is_active = 1 
                ORDER BY up.end_date DESC 
                LIMIT 1
            ), 0) AS current_slot_capacity,
            COALESCE((
                SELECT COUNT(*) 
                FROM tbl_cars c 
                WHERE c.user_id = sr.user_id 
                  AND c.is_deleted = 0 
                  AND c.is_active = 1 
                  AND c.listing_status = 'published'
            ), 0) AS active_vehicle_count
        FROM slot_requests sr
        LEFT JOIN tbl_users u ON sr.user_id = u.id
    `;

    const whereClause = userId ? `WHERE sr.user_id = ? ` : ``;
    const orderClause = `ORDER BY sr.created_at DESC`;
    const params = userId ? [userId] : [];

    const rows = await db.query(`${baseQuery} ${whereClause} ${orderClause}`, params);
    if (!rows || rows.length === 0) return [];

    return rows.map(r => {
        const currentCap = Number(r.current_slot_capacity || 0);
        const activeCars = Number(r.active_vehicle_count || 0);
        const available = Math.max(0, currentCap - activeCars);
        return {
            ...r,
            current_slot_capacity: currentCap,
            active_vehicle_count: activeCars,
            available_slots: available,
            subscription_preference: r.subscription_preference || r.duration_type || 'MONTHLY'
        };
    });
};

export const insertUserPlan = async (data) => {
    return db.query(
        `INSERT INTO tbl_user_plans (user_id, plan_id, start_date, end_date, total_slots, is_active, is_basic_signup) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.user_id,
            data.plan_id ?? null,
            data.start_date,
            data.end_date,
            data.total_slots,
            data.is_active ?? 1,
            data.is_basic_signup ?? 0
        ]
    );
};

export const updateUserPlanTotalSlots = async (user_plan_id, new_total_slots) => {
    return db.query(
        `UPDATE tbl_user_plans SET total_slots = ? WHERE id = ?`,
        [new_total_slots, user_plan_id]
    );
};

export const getActiveUserPlan = async (user_id) => {
    return db.query(
        `SELECT * FROM tbl_user_plans WHERE user_id = ? AND is_active = 1 LIMIT 1`,
        [user_id]
    );
};

export const insertPurchase = async (data) => {
    return db.query(
        `INSERT INTO tbl_purchases 
        (user_id, user_plan_id, plan_id, purchased_slots, prorated_price, payment_status, plan_type, transaction_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.user_id,
            data.user_plan_id,
            data.plan_id,
            data.purchased_slots,
            data.prorated_price,
            data.payment_status,
            data.plan_type,
            data.transaction_id
        ]
    );
};

export const getPurchasesForUserPlan = async (userPlanId) => {
    try {
        const result = await db.query(
            `SELECT p.*, plan.name AS plan_name, plan.plan_type
             FROM tbl_purchases p
             JOIN tbl_plans plan ON p.plan_id = plan.id
             WHERE p.user_plan_id = ?`,
            [userPlanId]
        );

        const rows = Array.isArray(result[0]) ? result[0] : result;
        return rows || [];
    } catch (error) {
        console.error("Error fetching purchases for user plan:", error);
        return [];
    }
};

export const deactivateUserPlans = async (user_id) => {
    return db.query(
        `UPDATE tbl_user_plans up
         JOIN tbl_purchases p ON p.user_plan_id = up.id
         SET up.is_active = 0
         WHERE up.user_id = ? 
           AND up.is_active = 1 
           AND p.plan_type = 'main'`,
        [user_id]
    );
};

export const getActiveMainPlan = async (user_id) => {
    return await db.query(
        `SELECT up.* 
         FROM tbl_user_plans up
         JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ? AND up.is_active = 1 AND p.plan_type = 'main'
         ORDER BY up.created_at DESC
         LIMIT 1`,
        [user_id]
    );
};

export const removeCarFromSlotsAfterTenDay = async (id) => {
    return db.query(`UPDATE tbl_cars SET slot_deleted_at = NOW(),is_active=0 WHERE id = ?`, [id]);
};

export const getEligiblePlans = async (user_id) => {
    const userSlotsResult = await db.query(
        `SELECT total_slots AS totalSlots
        FROM tbl_user_plans
        WHERE user_id = ?  
        ORDER BY is_active DESC, end_date DESC, created_at DESC
        LIMIT 1`,
        [user_id]
    );

    const totalSlots = userSlotsResult[0]?.totalSlots || 0;

    const plans = await db.query(
        `SELECT * 
        FROM tbl_plans
        WHERE plan_type != 'basic' 
          AND plan_type != 'additional'
          AND (is_public = 1 OR user_id = ?)`,
        [user_id]
    );

    const upgrade = plans.filter(plan => plan.slot_count > totalSlots);
    const downgrade = plans.filter(plan => plan.slot_count < totalSlots);

    return { upgrade, downgrade, totalSlots };
};

export const getUserPlan = async (user_id) => {
    return db.query(
        `SELECT 
    up.id AS user_plan_id,
    up.user_id,
    DATE_FORMAT(up.start_date, '%Y-%m-%d') AS start_date_new,
    DATE_FORMAT(up.end_date, '%Y-%m-%d') AS end_date_new,
    up.start_date,
    up.end_date,
    up.total_slots,
    up.is_active,
    up.created_at,
    up.is_basic_signup,
    up.reminder_sent,
    p.name AS plan_name,
    pur.id AS purchase_id,
    p.price AS plan_price,
    p.slot_count AS plan_slot_count,
    pur.plan_type AS purchase_type,
    pur.purchased_slots,
    pur.prorated_price
FROM tbl_user_plans up
JOIN (
    SELECT id
    FROM tbl_user_plans
    WHERE user_id = ?
    ORDER BY is_active DESC, end_date DESC, created_at DESC
    LIMIT 1
) latest ON up.id = latest.id
LEFT JOIN tbl_purchases pur ON pur.user_plan_id = up.id
LEFT JOIN tbl_plans p ON pur.plan_id = p.id
ORDER BY pur.id ASC`,
        [user_id]
    );
};

export const deleteExpiredCars = () => {
    // Keep cars safe in database so they remain visible in user's "My Listings"
    // No hard deletion (is_deleted stays 0)
    return Promise.resolve();
};

export const deactivateUserCarsAfterGracePeriod = async (user_id) => {
    return db.query(`
        UPDATE tbl_cars 
        SET is_active = 0, slot_deleted_at = NOW() 
        WHERE user_id = ? 
          AND is_deleted = 0 
          AND is_active = 1
    `, [user_id]);
};

export const reactivateUserCars = async (user_id) => {
    return db.query(`
        UPDATE tbl_cars 
        SET is_active = 1, slot_deleted_at = NULL 
        WHERE user_id = ? 
          AND is_deleted = 0
    `, [user_id]);
};

export const reactivateSingleCar = async (carId, user_id) => {
    return db.query(`
        UPDATE tbl_cars 
        SET is_active = 1, slot_deleted_at = NULL 
        WHERE id = ? 
          AND user_id = ? 
          AND is_deleted = 0
    `, [carId, user_id]);
};

export const getExpiredPlansPastGracePeriod = () => {
    return db.query(`
        SELECT MAX(up.id) AS id, up.user_id, MAX(up.end_date) AS end_date
        FROM tbl_user_plans up
        WHERE (up.is_active = 0 OR up.end_date <= NOW())
          AND up.end_date <= DATE_SUB(NOW(), INTERVAL 10 DAY)
          AND NOT EXISTS (
              SELECT 1 FROM tbl_user_plans active_up
              WHERE active_up.user_id = up.user_id
                AND active_up.is_active = 1
                AND active_up.end_date > NOW()
          )
          AND EXISTS (
              SELECT 1 FROM tbl_cars c
              WHERE c.user_id = up.user_id
                AND c.is_deleted = 0
                AND c.is_active = 1
          )
        GROUP BY up.user_id
    `);
};

export const markExpiryNotificationSent = async (planId) => {
    await db.query(
        `UPDATE tbl_user_plans SET expiry_notification_sent = 1, is_active = 0 WHERE id = ?`,
        [planId]
    );
};

export const getUserLastPlan = async (user_id, plan_id) => {
    return db.query(
        `SELECT * FROM tbl_user_plans WHERE user_id = ? ORDER BY id DESC LIMIT 1 `,
        [user_id]
    );
};
