import { fetchSlotRequestsById } from '../../models/admin.model.js';
import { insertSlotRequest, fetchSlotRequests, fetchApprovedSlotRequestsByUserId, getActiveUserPlan, getPurchasesForUserPlan } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const requestSlot = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user?.language || "en";
        const message = req.body.message !== undefined ? req.body.message : req.body.description;
        const requestedSlots = req.body.requested_slots ?? req.body.requestedSlots;
        const rawPreference = req.body.subscription_preference ?? req.body.subscriptionPreference ?? req.body.duration_type ?? req.body.durationType;

        const numSlots = Number(requestedSlots);
        if (!numSlots || !Number.isInteger(numSlots) || numSlots <= 0) {
            return handleError(res, 400, getMessage(lang, "INVALID_REQUESTED_SLOTS") || "Invalid requested slots.");
        }

        if (!rawPreference || typeof rawPreference !== 'string') {
            return handleError(res, 400, "subscription_preference is required (MONTHLY or ANNUAL).");
        }

        const normalizedPref = rawPreference.trim().toUpperCase();
        if (!['MONTHLY', 'ANNUAL', 'YEARLY'].includes(normalizedPref)) {
            return handleError(res, 400, "subscription_preference must be MONTHLY or ANNUAL.");
        }

        const canonicalPref = normalizedPref === 'YEARLY' ? 'ANNUAL' : normalizedPref;

        const result = await insertSlotRequest({
            user_id,
            requested_slots: numSlots,
            message: message ? String(message).trim() : null,
            status: "pending",
            duration_type: canonicalPref
        });

        return handleSuccess(
            res,
            200,
            getMessage(lang, "SLOT_REQUEST_SENT_SUCCESSFULLY") || "Slot request sent successfully.",
            { requestId: result.insertId }
        );
    } catch (error) {
        console.error("Request slot error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getAllSlotRequests = async (req, res) => {
    try {

        const userId = req.user.id;

        const requests = await fetchSlotRequests({ userId });
        console.log(`requests for user ${userId}`, requests);

        return handleSuccess(
            res,
            200,
            getMessage('en', "DATA_FETCHED_SUCCESSFULLY"),
            requests
        );
    } catch (error) {
        console.error("Get user slot requests error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getMyApprovedSlotRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('userId', userId);

        const lang = req.user.language;

        const approvedRequests = await fetchApprovedSlotRequestsByUserId(userId);
        console.log('approvedRequests', approvedRequests);

        if (approvedRequests.length === 0) {
            return handleError(res, 404, getMessage(lang, "NO_APPROVED_REQUESTS_FOUND"));
        }

        return handleSuccess(
            res,
            200,
            getMessage(lang, "APPROVED_REQUESTS_FETCHED_SUCCESSFULLY"),
            approvedRequests
        );
    } catch (error) {
        console.error("Fetch approved requests error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getRenewalOverview = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log('user_id', user_id)

        const activePlan = await getActiveUserPlan(user_id);

        // If it's an array, take the first element
        const plan = Array.isArray(activePlan) ? activePlan[0] : activePlan;

        if (!plan) {
            return handleError(res, 404, "No active plan found.");
        }

        console.log('plan', plan);

        // Now pass the correct id
        const purchases = await getPurchasesForUserPlan(plan.id);

        console.log('purchases', purchases)

        // Check if purchases were found before proceeding
        if (!purchases || purchases.length === 0) {
            return handleError(res, 404, "No purchases found for the active plan.");
        }

        // Separate the main plan from add-ons using the 'plan_type'
        const mainPlanPurchase = purchases.find(p => p.plan_type !== 'additional');
        const addOnPurchases = purchases.filter(p => p.plan_type === 'additional');

        // Check if a main plan was found
        if (!mainPlanPurchase) {
            return handleError(res, 404, "Main plan purchase not found.");
        }

        // Calculate totals
        const totalAddOnSlots = addOnPurchases.reduce((sum, purchase) => sum + purchase.purchased_slots, 0);
        const totalAddOnCost = addOnPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.prorated_price), 0);

        // Prepare the final response object
        const renewalOverview = {
            mainPlan: {
                name: mainPlanPurchase.plan_name,
                slots: mainPlanPurchase.purchased_slots,
                price: parseFloat(mainPlanPurchase.prorated_price),
            },
            addOns: {
                purchases: addOnPurchases.map(p => ({
                    name: p.plan_name,
                    slots: p.purchased_slots,
                    price: parseFloat(p.prorated_price)
                })),
                totalSlots: totalAddOnSlots,
                totalCost: totalAddOnCost,
            },
            currentTotalSlots: activePlan.total_slots,
        };

        return res.status(200).json({
            success: true,
            message: "Renewal overview fetched successfully.",
            data: renewalOverview
        });

    } catch (error) {
        console.error("Error fetching renewal overview:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch renewal overview."
        });
    }
};

// --------------------------------------------------------temprary using apis----------------------------------------//

export const getSlotRequestsById = async (req, res) => {
    try {
        let slotId = req.query.slotId || req.query.id || req.params.id;
        if (!slotId) {
            return handleError(res, 400, 'slotId is required');
        }
        const requests = await fetchSlotRequestsById(slotId);
        return handleSuccess(
            res,
            200,
            'Request fetch successfully',
            Array.isArray(requests) ? requests[0] || null : requests || null
        );
    } catch (error) {
        console.error("Get user slot requests error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
