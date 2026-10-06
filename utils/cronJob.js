import { recalcMfk } from './user_helper.js';
import db from '../config/db.js';
import cron from 'node-cron';
import moment from 'moment';
import {
    getAllActiveUserPlans,
    markReminderSent,
    removeCarFromWishlistModelByCarId,
    getCarsByUserId,
    markExpiryNotificationSent,
    getExpiredPlansPastGracePeriod,
    deactivateUserCarsAfterGracePeriod
} from '../models/user.model.js';
import { insertUserNotifications } from '../models/user.model.js';

// Run once daily at 01:00 AM
cron.schedule('0 1 * * *', async () => {
    try {
        const plans = await getAllActiveUserPlans();
        const now = moment().startOf('day');

        for (const plan of plans) {
            const endDate = moment(plan.end_date).startOf('day');
            const daysLeft = endDate.diff(now, 'days');

            // 1. 3-day reminder before expiry
            if (daysLeft === 3 && !plan.reminder_sent) {
                const message = {
                    data: {
                        sendFrom: 1, // Admin
                        sendTo: plan.user_id,
                        notificationType: 'plan_expiry_reminder',
                        carId: null,
                        isSendTo: 1
                    },
                    notification: {
                        title: "⏰ Plan Expiry Reminder",
                        body: `Your subscription plan will expire in 3 days. Please renew to keep your listings active.`
                    }
                };
                await insertUserNotifications(message, "success");
                await markReminderSent(plan.id);
            }

            // 2. Day 0: Plan Expired Notice (10-day grace period starts)
            if (daysLeft < 0 && !plan.expiry_notification_sent) {
                const message = {
                    data: {
                        sendFrom: 1,
                        sendTo: plan.user_id,
                        notificationType: 'plan_expired',
                        carId: null,
                        isSendTo: 1
                    },
                    notification: {
                        title: "🚫 Plan Expired",
                        body: `Your subscription plan has expired. You have a 10-day grace period to renew before your listings are removed from public search.`
                    }
                };
                await insertUserNotifications(message, "expired");
                await markExpiryNotificationSent(plan.id);
            }
        }

        // 3. 10 Days After Expiry: Remove cars from public marketplace, but keep in My Listings
        const expiredUsers = await getExpiredPlansPastGracePeriod();
        if (expiredUsers && expiredUsers.length > 0) {
            for (const expiredUser of expiredUsers) {
                const user_id = expiredUser.user_id;
                const userCars = await getCarsByUserId(user_id);

                if (userCars.length > 0) {
                    for (const car of userCars) {
                        await removeCarFromWishlistModelByCarId(car.id);
                    }
                    await deactivateUserCarsAfterGracePeriod(user_id);

                    const delistMessage = {
                        data: {
                            sendFrom: 1,
                            sendTo: user_id,
                            notificationType: 'listings_delisted_expired',
                            carId: null,
                            isSendTo: 1
                        },
                        notification: {
                            title: "⚠️ Listings Deactivated from Search",
                            body: `Your subscription expired 10 days ago. Your car listings have been hidden from public search. Please renew your plan from My Listings to reactivate them.`
                        }
                    };
                    await insertUserNotifications(delistMessage, "expired");
                    console.log(`[Cron] Delisted cars for user_id ${user_id} after 10-day grace period`);
                }
            }
        }
    }
    catch (error) {
        console.error('Cron job error:', error);
    }
});

cron.schedule("0 2 * * *", async () => {
    console.log("⏳ Running daily MFK recalculation job...");
    try {
        // Get all vehicles that are not manually overridden
        const [vehicles] = await db.query(
            `SELECT id FROM tbl_cars WHERE mfk_status_override IS NULL`
        );
        for (const v of vehicles) {
            try {
                await recalcMfk(v.id);
            } catch (err) {
                console.error(`❌ Failed to recalc MFK for vehicle ${v.id}:`, err);
            }
        }
        console.log(`✅ MFK recalculation job completed for ${vehicles.length} vehicles`);
    } catch (err) {
        console.error("❌ Cron job error:", err);
    }
});