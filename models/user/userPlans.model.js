import db from '../../config/db.js';

export const getAllPlans = async (currentUserId) => {
    try {

        const publicPlansQuery = `
            SELECT * FROM tbl_plans WHERE is_public = 1 ORDER BY price ASC;
        `;
        const publicPlans = await db.query(publicPlansQuery);


        const customPlanQuery = `
            SELECT * FROM tbl_plans WHERE user_id = ? AND is_public = 0;
        `;
        const customPlans = await db.query(customPlanQuery, [currentUserId]);

        const allPlans = [...publicPlans, ...customPlans];

        return allPlans;
    } catch (error) {
        console.error("Error fetching all plans:", error);
        throw error;
    }
};

export const isBasicPlanUsedByUser = async (user_id) => {
    return db.query(`
        SELECT plan_id 
        FROM tbl_purchases
        WHERE user_id = ? AND is_basic_signup = 1 
        LIMIT 1
    `, [user_id]);
};

export const getPlanById = (plan_id) => {
    return db.query("SELECT * FROM tbl_plans WHERE id = ?", [plan_id]);
};


export const createUserPlan = async ({ user_id, plan_id, start_date, end_date }) => {
    return db.query(
        "INSERT INTO tbl_purchases(user_id, plan_id, start_date, end_date) VALUES (?, ?, ?, ?)",
        [user_id, plan_id, start_date, end_date]
    );
};

export const getUserActivePlan = async (user_id) => {
    const rows = await db.query(
        `SELECT 
            up.id AS user_plan_id,
            up.user_id,
            up.start_date,
            up.end_date,
            up.total_slots,
            up.is_active,
            p.name AS plan_name,
            p.slot_count AS plan_slot_count,
            p.price AS plan_price
         FROM tbl_user_plans up
         JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ? AND up.is_active = 1
         ORDER BY up.created_at ASC
         LIMIT 1`,
        [user_id]
    );
    return rows;
};

export const getUserActivePlans = async (user_id) => {
    return db.query(
        `SELECT 
            up.id AS user_plan_id,
            up.user_id,
            up.start_date,
            up.end_date,
            up.total_slots,
            up.is_active,
            up.created_at,
            up.is_basic_signup,
            up.reminder_sent,
            p.name AS plan_name,
            p.price AS plan_price,
            p.slot_count AS plan_slot_count,
            pur.plan_type AS purchase_type,
            pur.purchased_slots,
            pur.prorated_price
         FROM tbl_user_plans up
         LEFT JOIN tbl_purchases pur ON pur.user_plan_id = up.id
         LEFT JOIN tbl_plans p ON up.plan_id = p.id
         WHERE up.user_id = ? AND up.is_active = 1
         ORDER BY up.created_at DESC, pur.id ASC`,
        [user_id]
    );
};

export const countSwapsThisMonth = async (user_id) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM tb_car_swaps 
         WHERE user_id = ? 
         AND MONTH(swapped_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(swapped_at) = YEAR(CURRENT_DATE())`,
        [user_id]
    );
    return rows.count || 0;
};

export const updateIsBasicSignup = async (user_id) => {
    return db.query(
        `UPDATE tbl_purchases SET is_basic_signup = 1 WHERE user_id = ? AND plan_id = 1 ORDER BY created_at DESC LIMIT 1`,
        [user_id]
    );
};

export const insertCarSwap = async (user_id, oldCarId, newCarId) => {
    return db.query(`
        INSERT INTO tb_car_swaps (user_id, old_car_id, new_car_id)
        SELECT ?, ?, ?
        FROM DUAL
        WHERE NOT EXISTS (
            SELECT 1 FROM tb_car_swaps WHERE user_id = ? AND old_car_id = ?
        )
    `, [user_id, oldCarId, newCarId, user_id, oldCarId]);
};

export const getMonthlySwapCount = async (user_id) => {
    return db.query(
        `SELECT COUNT(*) AS count FROM tb_car_swaps
         WHERE user_id = ?
         AND MONTH(swapped_at) = MONTH(CURRENT_DATE())
         AND YEAR(swapped_at) = YEAR(CURRENT_DATE())`,
        [user_id]
    );
};

export const getUserBasicPlan = async (user_id, plan_id) => {
    // This query now correctly checks the `tbl_user_plans` table for the is_basic_signup flag.
    return db.query(
        `SELECT * FROM tbl_user_plans WHERE user_id = ? AND is_basic_signup = 1 AND is_active = 1`,
        [user_id]
    );
};

export const insertBasicPlanForUser = async (payload) => {
    const {
        user_id,
        plan_id,
        is_active,
        payment_status,
        start_date,
        end_date,
        is_basic_signup
    } = payload;

    return db.query(
        `INSERT INTO tbl_purchases(user_id, plan_id, is_active, payment_status, start_date, end_date, is_basic_signup)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, plan_id, is_active, payment_status, start_date, end_date, is_basic_signup]
    );
};

export const isCarAlreadySwapped = async (oldCarId) => {
    return db.query(
        `SELECT * FROM tb_car_swaps WHERE old_car_id = ? LIMIT 1`,
        [oldCarId]
    );
};

export const getMostRecentDeletedCar = async (user_id) => {
    return db.query(`
    SELECT id FROM tbl_cars
    WHERE user_id = ? AND is_deleted = 1 
    ORDER BY updatedAt DESC LIMIT 1`,
        [user_id]
    );
};

export const markPlanAsInactive = async (user_id) => {
    return db.query("UPDATE tbl_purchases SET is_active = 0 WHERE user_id = ?", [user_id]);
};

export const markReminderSent = async (planId) => {
    await db.query(
        `UPDATE tbl_user_plans SET reminder_sent = 1 WHERE id = ?`,
        [planId]
    );
};

export const markUserPlanExpired = async (planId) => {
    await db.query(`UPDATE tbl_purchases SET is_active = 0 WHERE id = ?`, [planId]);
};

export const getAllActiveUserPlans = () => {
    return db.query(`
        SELECT id, user_id, end_date, reminder_sent 
        FROM tbl_user_plans 
        WHERE is_active = 1
    `);
};

export const getUserTotalSlots = async (user_id) => {
    const query = `
       SELECT total_slots
        FROM tbl_user_plans
        WHERE user_id = ? 
          AND is_active = 1
        ORDER BY end_date DESC
        LIMIT 1
    `;

    const [result] = await db.query(query, [user_id]);
    return result?.total_slots || 0;
};
