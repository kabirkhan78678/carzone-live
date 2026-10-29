import { variableTypes } from '../../utils/constant.js';
import { getPlanById, getUserBasicPlan, getUserActivePlans } from '../../models/user.model.js';
import Stripe from 'stripe';
import db from '../../config/db.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const purchaseSlotPlan = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user.language || "en";
        const { success_url, cancel_url } = req.body;
        let plan_id = req.body.plan_id;

        // Auto-resolve plan_id if duration_option is passed for private listing
        const requestedDuration = req.body.duration_option || req.body.durationType;
        if (!plan_id && requestedDuration) {
            const mappedDuration = String(requestedDuration).toLowerCase().includes('sold') ? 'until_sold' : 'monthly';
            const matchedPlans = await db.query(
                `SELECT * FROM tbl_plans WHERE plan_type = 'private_listing' AND duration_type = ? LIMIT 1`,
                [mappedDuration]
            );
            if (matchedPlans && matchedPlans.length > 0) plan_id = matchedPlans[0].id;
        }

        const [plan] = await getPlanById(plan_id);
        if (!plan) {
            return handleError(res, 404, getMessage(lang, "PLAN_NOT_FOUND"));
        }

        // ================= PRIVATE SELLER PAY-PER-VEHICLE LISTING FLOW =================
        if (plan.plan_type === 'private_listing') {
            const carId = req.body.car_id || req.body.carId || req.query.car_id || req.query.carId;
            if (!carId) {
                return handleError(res, 400, "car_id is required for vehicle listing purchase");
            }
            const cars = await db.query(`SELECT * FROM tbl_cars WHERE id = ? AND user_id = ? AND is_deleted = 0`, [carId, user_id]);
            if (!cars || cars.length === 0) {
                return handleError(res, 404, "Vehicle not found or unauthorized");
            }
            const car = cars[0];
            const finalPrice = Number(plan.price);
            const stripeCurrency = 'chf';
            const finalPriceInCents = Math.round(finalPrice * 100);

            const successUrl = success_url || `${process.env.CLIENT_URL}/payment-success?car_id=${carId}`;
            const cancelUrl = cancel_url || `${process.env.CLIENT_URL}/payment-cancelled?car_id=${carId}`;

            const durationLabel = plan.duration_type === 'until_sold' ? 'Until Sold' : '1 Month';
            const carTitle = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card", 'twint'],
                mode: "payment",
                line_items: [
                    {
                        price_data: {
                            currency: stripeCurrency,
                            product_data: {
                                name: `Vehicle Listing: ${carTitle} (${durationLabel})`
                            },
                            unit_amount: finalPriceInCents,
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    user_id: user_id.toString(),
                    plan_id: plan.id.toString(),
                    car_id: carId.toString(),
                    purchase_type: 'private_vehicle_listing',
                    duration_option: plan.duration_type === 'until_sold' ? 'until_sold' : '1_month',
                    duration_type: plan.duration_type || 'monthly',
                    prorated_price: finalPrice.toFixed(2),
                },
                success_url: successUrl,
                cancel_url: cancelUrl,
            });

            console.log(`Private seller ${user_id} purchasing vehicle listing ${carId} for CHF ${finalPrice}`);
            return res.json({ url: session.url, session_id: session.id });
        }
        // ==============================================================================

        const existingBasicPlan = await getUserBasicPlan(user_id, plan.id);
        if (plan.id === 1 && existingBasicPlan.length > 0) {
            return handleError(res, 400, getMessage(lang, "BASIC_PLAN_ALREADY_USED"));
        }

        const now = new Date();
        console.log('user_id', user_id);

        const activePlan = await getUserActivePlans(user_id);
        console.log('activePlan', activePlan);

        const isUserActive = activePlan.length > 0 && activePlan[0] && activePlan[0].is_active;

        // Determine purchaseType cleanly:
        // 1. If explicit purchase_type is provided in request body, validate and use it
        // 2. Otherwise auto-detect:
        //    - If user has no active plan -> 'initial'
        //    - If user has an active plan AND plan is an additional/addon package -> 'addon'
        //    - If user has an active plan AND plan is a main/custom package -> 'upgrade'
        let purchaseType;
        const requestedPurchaseType = req.body.purchase_type || req.body.purchaseType;

        if (requestedPurchaseType && ['addon', 'upgrade', 'initial'].includes(requestedPurchaseType.toLowerCase())) {
            const normalizedReqType = requestedPurchaseType.toLowerCase();
            if (!isUserActive && normalizedReqType !== 'initial') {
                // If user is not active, force initial purchase
                purchaseType = 'initial';
            } else if (isUserActive && normalizedReqType === 'initial') {
                purchaseType = 'upgrade';
            } else {
                purchaseType = normalizedReqType;
            }
        } else if (!isUserActive) {
            purchaseType = 'initial';
        } else if (plan.plan_type === 'additional' || plan.is_single_slot === 1) {
            purchaseType = 'addon';
        } else {
            // Main plans or custom approved slot-request plans replace the existing package
            purchaseType = 'upgrade';
        }

        const finalPrice = Number(plan.price);
        const stripeCurrency = 'chf';
        const finalPriceInCents = Math.round(finalPrice * 100);

        console.log('Plan DB price:', plan.price);
        console.log('Final customer price:', finalPrice);
        console.log('Stripe currency:', stripeCurrency);
        console.log('Stripe amount in smallest unit:', finalPriceInCents);
        console.log('purchaseType determined:', purchaseType);

        const successUrl = success_url || `${process.env.CLIENT_URL}/payment-success`;
        const cancelUrl = cancel_url || `${process.env.CLIENT_URL}/payment-cancelled`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", 'twint'],
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: stripeCurrency,
                        product_data: {
                            name: `${plan.name} (${plan.slot_count} Slot${plan.slot_count > 1 ? "s" : ""})`
                        },
                        unit_amount: finalPriceInCents,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: user_id.toString(),
                plan_id: plan.id.toString(),
                car_id: (req.body.car_id || req.body.carId || req.query.car_id || req.query.carId || "").toString(),
                purchase_type: purchaseType,
                duration_type: plan.duration_type || 'monthly',
                prorated_price: finalPrice.toFixed(2),
            },
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        console.log(`User ${user_id} is purchasing plan for CHF ${finalPriceInCents / 100}`);

        console.log("url", session.url);
        return res.json({ url: session.url });

    } catch (error) {
        console.error("Error purchasing slot plan:", error);
        return handleError(res, 500, getMessage('en', "INTERNAL_SERVER_ERROR"));
    }
};
