import { variableTypes } from '../../utils/constant.js';
import { getEligiblePlans, getUserActivePlans, getActiveCarCount, getPlanById, getUserBasicPlan, getUserPlan } from '../../models/user.model.js';
import Stripe from 'stripe';
import db from '../../config/db.js';
import { handleError, handleSuccess, handleSuccessNew, getRequestLanguage } from '../../utils/responseHandler.js';
import { getPurchasesWithPlanDetails, getMessage } from '../../utils/user_helper.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getUpgradeDowngradePlans = async (req, res) => {
    try {

        const user_id = req.user.id;

        const { upgrade, downgrade, totalSlots } = await getEligiblePlans(user_id);

        return res.status(200).json({
            message: "Eligible plans fetched successfully",
            data: {
                totalSlots,
                upgrade,
                downgrade
            }
        });
    } catch (error) {
        console.error("Upgrade/Downgrade plans error:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

export const renewPlan = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = getRequestLanguage(req);
        const { action, chosen_plan_id, chosen_total_slots, renewalPrice, renewal_user_plan_id } = req.body;
        let activePlan = await getUserActivePlans(user_id);
        if (!activePlan || activePlan.length === 0) {
            // Check if user has an expired plan that they want to renew
            activePlan = await getUserPlan(user_id);
        }
        if (!activePlan || activePlan.length === 0) return handleError(res, 400, "No plan found to renew");

        const active = activePlan[0];
        const activeCars = await getActiveCarCount(user_id, 1);

        // console.log('user_id', user_id);

        console.log('activePlan', activePlan)
        console.log('activeCars', activeCars, activeCars.length)
        let finalPriceInCents = 0;

        let target_slots;
        if (action === 'keep') {
            finalPriceInCents = Math.round(renewalPrice * 100)
        } else if (action === 'downgrade') {
            target_slots = parseInt(chosen_total_slots);
            if (target_slots < activeCars.length) {
                return handleError(res, 400, `Please remove ${activeCars.length - target_slots} cars before downgrading.`);
            }

            const plan = await getPlanById(chosen_plan_id);
            if (plan.length === 0) {
                return handleError(res, 404, getMessage(lang, "PLAN_NOT_FOUND"));
            }

            const existingBasicPlan = await getUserBasicPlan(user_id, plan.id);
            if (plan[0].id === 1 && existingBasicPlan.length > 0) {
                return handleError(res, 400, getMessage(lang, "BASIC_PLAN_ALREADY_USED"));
            }

            finalPriceInCents = Math.round(plan[0].price * 100)

        } else if (action === 'upgrade') {

            const plan = await getPlanById(chosen_plan_id);
            if (plan.length === 0) {
                return handleError(res, 404, getMessage(lang, "PLAN_NOT_FOUND"));
            }

            const existingBasicPlan = await getUserBasicPlan(user_id, plan.id);
            if (plan[0].id === 1 && existingBasicPlan.length > 0) {
                return handleError(res, 400, getMessage(lang, "BASIC_PLAN_ALREADY_USED"));
            }

            finalPriceInCents = Math.round(plan[0].price * 100)
        }
        else {
            return handleError(res, 404, getMessage(lang, "INVALID_ACTION"));
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", 'twint'],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "chf",
                        product_data: {
                            name: `Renewal Plan`
                        },
                        unit_amount: finalPriceInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user_id.toString(),
                plan_id: (chosen_plan_id !== undefined && chosen_plan_id !== null) ? chosen_plan_id.toString() : "0",
                renewal_user_plan_id: (renewal_user_plan_id !== undefined && renewal_user_plan_id !== null) ? renewal_user_plan_id.toString() : "0",
                car_id: (req.body.car_id || req.body.carId || "").toString(),
                action: (action || "keep").toString(),
                purchase_type: "renew",
                prorated_price: (finalPriceInCents / 100).toFixed(2),
            },
            success_url: `${process.env.CLIENT_URL}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
        });

        console.log(`User ${user_id} is purchasing plan for CHF ${finalPriceInCents / 100}`);

        return handleSuccess(res, 200, getMessage("en", variableTypes.DATA_FOUND_SUCCESSFULLY), { url: session.url });

    } catch (error) {
        console.error("Error purchasing slot plan:", error);
        return handleError(res, 500, getMessage('en', "INTERNAL_SERVER_ERROR"));
    }
};

export const getRenewalSummary = async (req, res) => {
    try {
        const { user_plan_id } = req.params;
        const lang = getRequestLanguage(req);

        // Fetch user_plan
        const userPlan = await db.query(
            `SELECT * FROM tbl_user_plans WHERE id = ?`,
            [user_plan_id]
        );

        console.log("userPlan", userPlan)

        if (!userPlan) {
            return handleError(res, 404, "User plan not found");
        }

        // Fetch all purchases for this cycle
        const purchases = await db.query(
            `SELECT * FROM tbl_purchases WHERE user_plan_id = ?`,
            [user_plan_id]
        );

        if (!purchases.length) {
            return handleError(res, 404, "No purchases found for plan");
        }

        // Calculate previous total
        const previous_total = purchases.reduce(
            (acc, p) => acc + parseFloat(p.prorated_price),
            0
        );

        // Calculate renewal full prices
        let breakdown = [];
        let renew_total = 0;

        for (let p of purchases) {
            // Get full plan price per slot (not prorated)
            const [plan] = await db.query(`SELECT * FROM tbl_plans WHERE id = ?`, [
                p.plan_id,
            ]);

            let fullPrice = 0;

            if (plan) {
                // If this was a predefined plan
                fullPrice = plan.price;
            } else {
                // Handle extra slot (per-slot plan)
                const [perSlotPlan] = await db.query(
                    `SELECT price FROM tbl_plans WHERE is_single_slot = 1 LIMIT 1`
                );
                fullPrice = perSlotPlan.price * p.purchased_slots;
            }

            renew_total = renew_total + parseFloat(fullPrice);

            breakdown.push({
                plan_type: p.plan_type,
                slots: p.purchased_slots,
                old_price: parseFloat(p.prorated_price),
                new_price: fullPrice,
            });
        }

        const details = await getPurchasesWithPlanDetails(user_plan_id)

        return res.json({
            previous_cycle: {
                slots: userPlan.total_slots,
                amount_paid: previous_total,
            },
            renewal_cycle: {
                slots: userPlan.total_slots,
                amount_due: renew_total,
            },
            breakdown,
            details
        });
    } catch (err) {
        console.error("Error in getRenewalSummary:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
