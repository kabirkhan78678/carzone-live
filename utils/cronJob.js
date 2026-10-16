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

        // 4. Private Seller Listings Expiry Lifecycle (1 Month Option)
        // A. 3-day reminder before vehicle listing expires
        const expiringCars = await db.query(`
            SELECT id, user_id, brandName, carModel, selectYear, listing_expires_at 
            FROM tbl_cars 
            WHERE listing_type = 'per_vehicle' 
              AND duration_option = '1_month' 
              AND is_active = 1 
              AND listing_status = 'published'
              AND listing_expires_at IS NOT NULL
              AND DATEDIFF(listing_expires_at, NOW()) = 3
        `);

        for (const car of expiringCars) {
            const carName = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';
            const reminderMsg = {
                data: {
                    sendFrom: 1,
                    sendTo: car.user_id,
                    notificationType: 'vehicle_listing_expiry_reminder',
                    carId: car.id,
                    isSendTo: 1
                },
                notification: {
                    title: "⏰ Listing Expiry Reminder",
                    body: `Your listing for ${carName} will expire in 3 days. Renew now to keep it visible on CarZone.`
                }
            };
            await insertUserNotifications(reminderMsg, "success");
        }

        // B. Vehicle listing expired (1 Month reached)
        const expiredCars = await db.query(`
            SELECT id, user_id, brandName, carModel, selectYear 
            FROM tbl_cars 
            WHERE listing_type = 'per_vehicle' 
              AND duration_option = '1_month' 
              AND is_active = 1 
              AND listing_status = 'published'
              AND listing_expires_at IS NOT NULL
              AND listing_expires_at <= NOW()
        `);

        for (const car of expiredCars) {
            const carName = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';
            await removeCarFromWishlistModelByCarId(car.id);
            await db.query(
                `UPDATE tbl_cars SET is_active = 0, listing_status = 'expired', payment_status = 'expired' WHERE id = ?`,
                [car.id]
            );

            const expiredMsg = {
                data: {
                    sendFrom: 1,
                    sendTo: car.user_id,
                    notificationType: 'vehicle_listing_expired',
                    carId: car.id,
                    isSendTo: 1
                },
                notification: {
                    title: "🚫 Listing Expired",
                    body: `Your listing for ${carName} has expired. Renew anytime from My Listings to reactivate it.`
                }
            };
            await insertUserNotifications(expiredMsg, "expired");
            console.log(`[Cron] Expired private listing ${car.id} for user ${car.user_id}`);
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