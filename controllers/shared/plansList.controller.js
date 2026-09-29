import { variableTypes } from '../../utils/constant.js';
import { getChfFormattedPrice, getMessage } from '../../utils/user_helper.js';
import { getUserLastPlan, getUserBasicPlan, getUserPlan, countUserCars, countSwapsThisMonth, getAllPlans, fetchSlotRequests } from '../../models/user.model.js';
import Stripe from 'stripe';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getAllPlan = async (req, res) => {
    try {
        const user_id = req.user?.id;
        console.log('user_id', user_id)

        const plans = await getAllPlans(user_id);
        console.log(plans);

        const isExpired = await getUserLastPlan(user_id);

        let navigateRenewScreen = 0

        if (isExpired.length > 0 && isExpired[0].is_active == 0) {
            navigateRenewScreen = 1
        }

        const existingBasicPlan = await getUserBasicPlan(user_id, 1);

        console.log('existingBasicPlan', existingBasicPlan)

        const requestedSlots = user_id ? await fetchSlotRequests({ userId: user_id }) : [];

        const enrichedPlans = plans.map(plan => {
            const formattedPrice = getChfFormattedPrice(Number(plan.price));

            return { ...plan, price: formattedPrice };
        });

        return res.status(200).json({
            success: true,
            message: "Plans fetched successfully",
            plans: enrichedPlans,
            alreadyUsed: existingBasicPlan.length > 0 ? 1 : 0,
            navigateRenewScreen,
            requestedSlots: requestedSlots || []
        });

    } catch (error) {
        console.error("Fetch plans error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch plans"
        });
    }
};

export const getMyPlan = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Fetch all active purchases (main + additional)
        const purchases = await getUserPlan(user_id);

        console.log('purchases', purchases)

        if (!purchases || purchases.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No active plan",
                planData: null
            });
        }

        // Common expiry = latest end_date
        const commonExpiry = purchases.reduce((max, p) => {
            const endDate = new Date(p.end_date);
            return endDate > max ? endDate : max;
        }, new Date(purchases[0].end_date));

        // Cumulative slots = sum of all purchased slots
        // ✅ CORRECT: take total_slots from the active main plan
        const mainPlan = purchases.find(p => p.purchase_type === "main");
        const cumulativeSlots = mainPlan ? mainPlan.total_slots : 0;

        console.log('cumulativeSlots', cumulativeSlots)

        // Supporting counts
        const listedCount = await countUserCars(user_id);
        const swapCount = await countSwapsThisMonth(user_id);

        // Days left
        const daysLeft = Math.max(
            0,
            Math.ceil((commonExpiry - new Date()) / (1000 * 60 * 60 * 24))
        );

        // Prepare history (all purchases)
        const history = purchases.map(p => ({
            purchase_id: p.purchase_id,
            plan_name: p.plan_name,
            //plan_price: p.plan_price,
            purchase_type: p.purchase_type,   // main / additional
            purchased_slots: p.purchased_slots,
            prorated_price: p.prorated_price,
            start_date: p.start_date,
            end_date: p.end_date,
            created_at: p.created_at
        }));

        // Main response object
        const planData = {
            user_id,
            user_plan_id: purchases[0].user_plan_id,
            is_active: purchases[0].is_active,
            start_date: purchases[0].start_date_new,   // main plan start
            end_date: purchases[0].end_date_new,
            total_slots: cumulativeSlots,
            cars_listed: `${listedCount} / ${cumulativeSlots}`,
            cars_swapped: `${swapCount}`,
            days_left: daysLeft,
            history
        };

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Active plan",
            planData
        });

    } catch (err) {
        console.error("Get plan error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch user plans"
        });
    }
};

function formatDateUTC(date) {
    if (!date) return null;
    const d = new Date(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export const getChooseListingPlan = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return handleError(
                res,
                401,
                "Authentication token is required"
            );
        }

        const token = authHeader.split(" ")[1];

        const chooseListingPlanUrl =
            `http://13.51.226.81/choose-listing-plan?authentication=${encodeURIComponent(token)}`;

        return handleSuccess(
            res,
            200,
            "Choose listing plan URL generated successfully",
            {
                url: chooseListingPlanUrl
            }
        );

    } catch (error) {
        console.error(
            "GET CHOOSE LISTING PLAN ERROR =>",
            error
        );

        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};
