import { recalcMfk } from './user_helper.js';
import db from '../config/db.js';
import cron from 'node-cron';
import moment from 'moment';
import { getAllActiveUserPlans, markCarAsExpired, markReminderSent, removeCarFromWishlistModelByCarId, getCarsByUserId, removeCarFromSlotsAfterTenDay, deleteExpiredCars, markExpiryNotificationSent } from '../models/user.model.js';
import { insertUserNotifications } from '../models/user.model.js';
// Every 1 minute (use '0 0 * * *' for every midnight)
cron.schedule('* * * * *', async () => {
    try {
        const plans = await getAllActiveUserPlans();
        //console.log('plans',plans);
        const now = moment().startOf('day');
        for (const plan of plans) {
            const endDate = moment(plan.end_date).startOf('day');
            const daysLeft = endDate.diff(now, 'days');
            //console.log('daysLeft',daysLeft);
            // 3-day reminder
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
                        body: `Your subscription plan will expire in 3 days.`
                    }
                };
                await insertUserNotifications(message, "success");
                await markReminderSent(plan.id);
            }
            // Expired plan
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
                        body: `Your subscription plan has expired.`
                    }
                };
                await insertUserNotifications(message, "expired");
                await markExpiryNotificationSent(plan.id);
                if (plan.user_id) {
                    const userCars = await getCarsByUserId(plan.user_id);
                    if (userCars.length > 0) {
                        for (const car of userCars) {
                            await markCarAsExpired(car.id, plan.user_id);
                            await removeCarFromWishlistModelByCarId(car.id);
                            await removeCarFromSlotsAfterTenDay(car.id)
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('Cron job error:', error);
    }
});

cron.schedule('* * * * *', async () => {
    try {
        const plans = await deleteExpiredCars();
        //console.log('cronjob>>working');
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