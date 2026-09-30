import { getPurchasesWithPlanDetails } from '../../utils/user_helper.js';
import { getPlanById, deactivateUserPlans, insertUserPlan, insertPurchase, getUserActivePlans, updateUserPlanTotalSlots, reactivateUserCarsUpToLimit } from '../../models/user.model.js';
import Stripe from 'stripe';
import db from '../../config/db.js';
import { notifyListingEvent } from '../../services/notificationDispatchers.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = async (req, res) => {
    console.log("🔥 Webhook HIT");

    console.log("stripe webhook req body :------>", req.body)
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error("Webhook signature error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {

        const session = event.data.object;
        const transactionId = session.payment_intent || session.id;
      console.log("========== DATE DEBUG START ==========");

console.log(
    "Stripe Event Date:",
    new Date(event.created * 1000)
);

console.log(
    "Stripe Event ISO:",
    new Date(event.created * 1000).toISOString()
);

console.log(
    "Node Current Date:",
    new Date()
);

console.log(
    "Node Current ISO:",
    new Date().toISOString()
);

const [dbTime] = await db.query(`
    SELECT 
        NOW() AS db_now,
        UTC_TIMESTAMP() AS db_utc_now
`);

console.log("MySQL Time:", dbTime);

console.log("========== DATE DEBUG END ==========");

        // ✅ Idempotency check (ADD HERE)
        const existingTxn = await db.query(`SELECT id FROM tbl_purchases WHERE transaction_id = ?`, [transactionId]);
        if (existingTxn.length > 0) {
            console.log("Webhook already processed for txn:", transactionId);
            return res.status(200).send("Already processed");
        }
        const user_id = parseInt(session.metadata.user_id);
        const plan_id = parseInt(session.metadata.plan_id);
        const purchaseType = session.metadata.purchase_type;
        const proratedPrice = parseFloat(session.metadata.prorated_price);

        try {

            const now = new Date();

            console.log("NOW USED FOR DB:", now);
    console.log("NOW USED FOR DB ISO:", now.toISOString());
            const [plan] = await getPlanById(plan_id);
            const isYearly = (plan?.duration_type || session.metadata.duration_type || '').toLowerCase() === 'yearly' || 
                             (plan?.duration_type || session.metadata.duration_type || '').toLowerCase() === 'annual';
            const durationDays = isYearly ? 365 : 30;

            if (purchaseType === 'initial' || purchaseType === 'upgrade') {
                // ✅ Deactivate old main plans only
                await deactivateUserPlans(user_id);

                const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

                const existingPlans = await db.query(
                    `SELECT id FROM tbl_user_plans WHERE user_id = ? AND is_active = 1 LIMIT 1`,
                    [user_id]
                );

                console.log("========== USER PLAN DATE ==========");
console.log("start_date:", now);
console.log("end_date:", endDate);
console.log("start_date ISO:", now.toISOString());
console.log("end_date ISO:", endDate.toISOString());
console.log("====================================");
                const userPlanData = {
                    user_id,
                    start_date: now,
                    plan_id,
                    end_date: endDate,
                    total_slots: plan.slot_count,
                    is_active: 1,
                    is_basic_signup: existingPlans.length === 0 ? 1 : 0
                };

                console.log("USER PLAN DATA BEFORE INSERT:", userPlanData);

                const userPlanResult = await insertUserPlan(userPlanData);

                console.log("INSERT RESULT:", userPlanResult);

const [insertedPlan] = await db.query(
    `SELECT id, user_id, start_date, end_date, created_at
     FROM tbl_user_plans
     WHERE id = ?`,
    [userPlanResult.id]
);
console.log("INSERTED PLAN FROM DB:", insertedPlan)
                const user_plan_id = userPlanResult.insertId;
                const transactionId = session.payment_intent || session.id;
                const purchaseData = {
                    user_id,
                    user_plan_id,
                    plan_id,
                    purchased_slots: plan.slot_count,
                    prorated_price: plan.price,
                    payment_status: 'paid',
                    transaction_id: transactionId,
                    plan_type: 'main'
                };
                await insertPurchase(purchaseData);

                const specificCarId = session.metadata?.car_id ? Number(session.metadata.car_id) : null;
                if (specificCarId) {
                    await db.query(
                        `UPDATE tbl_cars SET is_active = 1, slot_deleted_at = NULL WHERE id = ? AND user_id = ? AND is_deleted = 0`,
                        [specificCarId, user_id]
                    );
                } else {
                    await reactivateUserCarsUpToLimit(user_id, plan.slot_count);
                }

                console.log(`Initial/renewal main plan activated for user ${user_id} with up to ${plan.slot_count} slots (specific car: ${specificCarId || 'none'})`);

            } else if (purchaseType === 'addon') {
                const mainPlan = await getUserActivePlans(user_id);
                console.log('mainPlan', mainPlan)
                if (!mainPlan || mainPlan.length === 0) {
                    console.error(`No active main plan found for addon purchase by user ${user_id}`);
                    return res.status(404).send("Active main plan not found");
                }

                // ✅ Update only total slots of main plan
                const newTotalSlots = mainPlan[0].total_slots + plan.slot_count;
                await updateUserPlanTotalSlots(mainPlan[0].user_plan_id, newTotalSlots);

                // ✅ Insert addon purchase row
                const purchaseData = {
                    user_id,
                    user_plan_id: mainPlan[0].user_plan_id, // associate with main plan
                    plan_id,
                    purchased_slots: plan.slot_count,
                    prorated_price: proratedPrice,
                    payment_status: 'paid',
                    transaction_id: transactionId,
                    plan_type: 'additional'
                };

                await insertPurchase(purchaseData);
        

                console.log(`Addon slots purchased for user ${user_id}. New total slots: ${newTotalSlots}`);
            }
            else if (purchaseType === 'renew') {
                console.log("renew code execution");
                if (session.metadata.action == 'keep') {
                    let renewal_user_plan_id = session.metadata.renewal_user_plan_id;
                    console.log(`Renewal KEEP flow for user_plan_id ${renewal_user_plan_id}`);

                    const oldPlan = await db.query(`SELECT * FROM tbl_user_plans where id = ?`, [renewal_user_plan_id]);
                    const oldPlanDetails = oldPlan[0];
                    const slotsToKeep = oldPlanDetails?.total_slots || 1;
                    const specificCarId = session.metadata?.car_id ? Number(session.metadata.car_id) : null;
                    if (specificCarId) {
                        await db.query(
                            `UPDATE tbl_cars SET is_active = 1, slot_deleted_at = NULL WHERE id = ? AND user_id = ? AND is_deleted = 0`,
                            [specificCarId, user_id]
                        );
                    } else {
                        await reactivateUserCarsUpToLimit(user_id, slotsToKeep);
                    }

                    let renewalDays = 30;
                    if (oldPlanDetails && oldPlanDetails.plan_id) {
                        const [oldPlanMeta] = await getPlanById(oldPlanDetails.plan_id);
                        if (oldPlanMeta && (oldPlanMeta.duration_type === 'yearly' || oldPlanMeta.duration_type === 'annual')) {
                            renewalDays = 365;
                        }
                    }

                    // 1. Deactivate old plans
                    await deactivateUserPlans(user_id);

                    const newPlan = await db.query(
                        `INSERT INTO tbl_user_plans (user_id, plan_id, start_date, end_date, total_slots, is_active) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?, 1)`,
                        [
                            oldPlanDetails.user_id,
                            oldPlanDetails.plan_id || null,
                            renewalDays,
                            oldPlanDetails.total_slots
                        ]
                    );

                    // 2. Get all old purchases (main + extras)
                    const oldPurchases = await getPurchasesWithPlanDetails(renewal_user_plan_id);

                    // 3. Insert new rows with full price
                    for (let purchase of oldPurchases) {
                        await db.query(
                            `INSERT INTO tbl_purchases
                            (user_id, user_plan_id, plan_id, purchased_slots, prorated_price, purchase_date, payment_status, plan_type, transaction_id)
                            VALUES (?, ?, ?, ?, ?, NOW(), 'paid', ?, ?)`,
                            [
                                user_id,
                                newPlan.insertId,
                                purchase.plan_id || null, // stays NULL for extras
                                purchase.purchased_slots,
                                purchase.full_price, // now always full price
                                purchase.plan_type,
                                transactionId
                            ]
                        );
                    }
                }
                else {
                    // ✅ Deactivate old main plans only
                    await deactivateUserPlans(user_id);

                    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

                    const userPlanData = {
                        user_id,
                        start_date: now,
                        plan_id,
                        end_date: endDate,
                        total_slots: plan.slot_count,
                        is_active: 1,
                        is_basic_signup: 0
                    };

                    console.log("USER PLAN DATA BEFORE INSERT:", userPlanData);

                    const userPlanResult = await insertUserPlan(userPlanData);

                    const [insertedPlan] = await db.query(
                        `SELECT id, user_id, start_date, end_date, created_at
                         FROM tbl_user_plans
                         WHERE id = ?`,
                        [userPlanResult.insertId]
                    );
                    const user_plan_id = userPlanResult.insertId;

                    const purchaseData = {
                        user_id,
                        user_plan_id,
                        plan_id,
                        purchased_slots: plan.slot_count,
                        prorated_price: plan.price,
                        payment_status: 'paid',
                        transaction_id: transactionId,
                        plan_type: 'main'
                    };
                    await insertPurchase(purchaseData);
                    const specificCarId = session.metadata?.car_id ? Number(session.metadata.car_id) : null;
                    if (specificCarId) {
                        await db.query(
                            `UPDATE tbl_cars SET is_active = 1, slot_deleted_at = NULL WHERE id = ? AND user_id = ? AND is_deleted = 0`,
                            [specificCarId, user_id]
                        );
                    } else {
                        await reactivateUserCarsUpToLimit(user_id, plan.slot_count);
                    }

                    console.log(`Initial/renewal main plan activated for user ${user_id} with up to ${plan.slot_count} slots (specific car: ${specificCarId || 'none'})`);

                }

                // Send listing extended confirmation notification
                notifyListingEvent({
                    sellerId: user_id,
                    event: 'extended',
                    days: durationDays
                }).catch(err => console.error("Error sending listing extended notification:", err));
            }

        } catch (error) {
            console.error("Error handling checkout.session.completed:", error);
        }
    }

    

    res.status(200).send("Webhook received");
};
