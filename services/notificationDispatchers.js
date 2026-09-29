import { sendNotificationToUser } from './notification.service.js';
import { getUsersWhoFavoritedCar, getAllUserFcmTokens } from '../models/user/notification.model.js';
import { findMatchingSavedSearches } from '../models/user/savedSearch.model.js';
import { getUserById } from '../models/notification.model.js';
import { sendEmail } from '../utils/emailService.js';
import { getChfFormattedPrice } from '../utils/user_helper.js';

/**
 * Notify all users who favorited a vehicle about status/price changes
 */
export const notifyFavoritedCarUsers = async ({ carId, event, carName, oldPrice, newPrice, excludeUserId = null }) => {
    try {
        console.log(`[notifyFavoritedCarUsers] START -> carId: ${carId}, event: ${event}, excludeUserId: ${excludeUserId}`);
        const favoriteUsers = await getUsersWhoFavoritedCar(carId);
        console.log(`[notifyFavoritedCarUsers] Found ${favoriteUsers?.length || 0} users in wishlist for car ${carId}`);
        if (!favoriteUsers || favoriteUsers.length === 0) {
            console.log(`[notifyFavoritedCarUsers] No favorite users found. Exiting.`);
            return;
        }

        let titleKey = 'FAVORITE_CAR_UPDATED';
        let bodyKey = 'FAVORITE_CAR_UPDATED_BODY';
        let category = 'favorited_vehicle_updates';
        const params = {
            car: carName || 'Saved Vehicle',
            oldPrice: oldPrice !== undefined && oldPrice !== null && oldPrice !== '' ? getChfFormattedPrice(oldPrice) : '',
            newPrice: newPrice !== undefined && newPrice !== null && newPrice !== '' ? getChfFormattedPrice(newPrice) : ''
        };

        switch (event) {
            case 'sold':
                titleKey = 'FAVORITE_CAR_SOLD';
                bodyKey = 'FAVORITE_CAR_SOLD_BODY';
                category = 'favorited_vehicle_updates';
                break;
            case 'deleted':
                titleKey = 'FAVORITE_CAR_DELETED';
                bodyKey = 'FAVORITE_CAR_DELETED_BODY';
                category = 'favorited_vehicle_updates';
                break;
            case 'price_reduced':
                titleKey = 'FAVORITE_CAR_PRICE_REDUCED';
                bodyKey = 'FAVORITE_CAR_PRICE_REDUCED_BODY';
                category = 'price_changes';
                break;
            case 'available_again':
                titleKey = 'FAVORITE_CAR_AVAILABLE_AGAIN';
                bodyKey = 'FAVORITE_CAR_AVAILABLE_AGAIN_BODY';
                category = 'favorited_vehicle_updates';
                break;
            case 'updated':
            default:
                titleKey = 'FAVORITE_CAR_UPDATED';
                bodyKey = 'FAVORITE_CAR_UPDATED_BODY';
                category = 'favorited_vehicle_updates';
                break;
        }

        for (const u of favoriteUsers) {
            if (excludeUserId && Number(u.user_id) === Number(excludeUserId)) {
                console.log(`[notifyFavoritedCarUsers] Skipping user ${u.user_id} because they are the seller (excludeUserId)`);
                continue;
            }
            console.log(`[notifyFavoritedCarUsers] Sending "${titleKey}" notification to user ${u.user_id}`);
            await sendNotificationToUser(u.user_id, {
                titleKey,
                bodyKey,
                params,
                category,
                data: {
                    type: 'favorite_update',
                    event,
                    carId: String(carId)
                }
            });
        }
    } catch (err) {
        console.error('Error in notifyFavoritedCarUsers:', err);
    }
};

/**
 * Check if a newly published vehicle matches any user's saved search
 */
export const notifyMatchingSearchUsers = async (car) => {
    try {
        const matches = await findMatchingSavedSearches(car);
        if (!matches || matches.length === 0) return;

        const carName = `${car.brandName || ''} ${car.carModel || ''}`.trim() || 'New Vehicle';

        for (const match of matches) {
            await sendNotificationToUser(match.user_id, {
                titleKey: 'NEW_MATCHING_VEHICLE',
                bodyKey: 'NEW_MATCHING_VEHICLE_BODY',
                params: {
                    car: carName,
                    searchName: match.search_name
                },
                category: 'new_matching_vehicles',
                data: {
                    type: 'saved_search_match',
                    carId: String(car.id),
                    searchId: String(match.saved_search_id)
                }
            });
        }
    } catch (err) {
        console.error('Error in notifyMatchingSearchUsers:', err);
    }
};

/**
 * Appointment lifecycle notification dispatcher
 */
export const notifyAppointmentEvent = async ({
    visitId,
    carId,
    buyerId,
    sellerId,
    event,
    carName,
    date,
    time,
    sellerName,
    reason
}) => {
    try {
        const carDisplay = carName || 'the vehicle';
        const params = {
            car: carDisplay,
            date: date || '',
            time: time || '',
            sellerName: sellerName || '',
            reason: reason || ''
        };

        if (event === 'confirmed' && buyerId) {
            await sendNotificationToUser(buyerId, {
                titleKey: 'APPOINTMENT_CONFIRMED',
                bodyKey: 'APPOINTMENT_CONFIRMED_BODY',
                params,
                category: 'appointments',
                data: { type: 'appointment', action: 'confirmed', visitId: String(visitId), carId: String(carId) }
            });
        } else if (event === 'rejected' && buyerId) {
            await sendNotificationToUser(buyerId, {
                titleKey: 'APPOINTMENT_REJECTED',
                bodyKey: 'APPOINTMENT_REJECTED_BODY',
                params,
                category: 'appointments',
                data: { type: 'appointment', action: 'rejected', visitId: String(visitId), carId: String(carId) }
            });
        } else if (event === 'rescheduled' && buyerId) {
            await sendNotificationToUser(buyerId, {
                titleKey: 'APPOINTMENT_RESCHEDULED',
                bodyKey: 'APPOINTMENT_RESCHEDULED_BODY',
                params,
                category: 'appointments',
                data: { type: 'appointment', action: 'rescheduled', visitId: String(visitId), carId: String(carId) }
            });
        } else if (event === 'reminder_24h') {
            if (buyerId) {
                await sendNotificationToUser(buyerId, {
                    titleKey: 'APPOINTMENT_REMINDER_24H',
                    bodyKey: 'APPOINTMENT_REMINDER_24H_BODY',
                    params,
                    category: 'appointments',
                    data: { type: 'appointment', action: 'reminder_24h', visitId: String(visitId), carId: String(carId) }
                });
            }
            if (sellerId) {
                await sendNotificationToUser(sellerId, {
                    titleKey: 'APPOINTMENT_REMINDER_24H',
                    bodyKey: 'APPOINTMENT_REMINDER_24H_BODY',
                    params,
                    category: 'appointments',
                    data: { type: 'appointment', action: 'reminder_24h', visitId: String(visitId), carId: String(carId) }
                });
            }
        } else if (event === 'reminder_today') {
            if (buyerId) {
                await sendNotificationToUser(buyerId, {
                    titleKey: 'APPOINTMENT_REMINDER_TODAY',
                    bodyKey: 'APPOINTMENT_REMINDER_TODAY_BODY',
                    params,
                    category: 'appointments',
                    data: { type: 'appointment', action: 'reminder_today', visitId: String(visitId), carId: String(carId) }
                });
            }
            if (sellerId) {
                await sendNotificationToUser(sellerId, {
                    titleKey: 'APPOINTMENT_REMINDER_TODAY',
                    bodyKey: 'APPOINTMENT_REMINDER_TODAY_BODY',
                    params,
                    category: 'appointments',
                    data: { type: 'appointment', action: 'reminder_today', visitId: String(visitId), carId: String(carId) }
                });
            }
        }
    } catch (err) {
        console.error('Error in notifyAppointmentEvent:', err);
    }
};

/**
 * Listing lifecycle notification dispatcher
 */
export const notifyListingEvent = async ({
    sellerId,
    carId,
    event,
    carName,
    days,
    reason
}) => {
    try {
        const carDisplay = carName || 'your vehicle';
        const params = { car: carDisplay, days: days || 1, reason: reason || '' };

        let titleKey = 'LISTING_PUBLISHED';
        let bodyKey = 'LISTING_PUBLISHED_BODY';
        let category = 'listing_updates';

        switch (event) {
            case 'published':
                titleKey = 'LISTING_PUBLISHED';
                bodyKey = 'LISTING_PUBLISHED_BODY';
                category = 'listing_updates';
                break;
            case 'incomplete_reminder':
                titleKey = 'INCOMPLETE_LISTING_REMINDER';
                bodyKey = 'INCOMPLETE_LISTING_REMINDER_BODY';
                category = 'listing_updates';
                break;
            case 'expiring_soon':
                titleKey = 'LISTING_EXPIRING_SOON';
                bodyKey = 'LISTING_EXPIRING_SOON_BODY';
                category = 'listing_updates';
                break;
            case 'expired':
                titleKey = 'LISTING_EXPIRED';
                bodyKey = 'LISTING_EXPIRED_BODY';
                category = 'plan_expired'; // Mandatory
                break;
            case 'rejected':
                titleKey = 'LISTING_REJECTED';
                bodyKey = 'LISTING_REJECTED_BODY';
                category = 'listing_rejected'; // Mandatory
                break;
            case 'extended':
                titleKey = 'LISTING_EXTENDED';
                bodyKey = 'LISTING_EXTENDED_BODY';
                category = 'listing_updates';
                break;
            case 'monthly_checkin':
                titleKey = 'SELLER_MONTHLY_CHECKIN';
                bodyKey = 'SELLER_MONTHLY_CHECKIN_BODY';
                category = 'listing_updates';
                break;
        }

        await sendNotificationToUser(sellerId, {
            titleKey,
            bodyKey,
            params,
            category,
            data: {
                type: 'listing',
                event,
                carId: carId ? String(carId) : ''
            }
        });
    } catch (err) {
        console.error('Error in notifyListingEvent:', err);
    }
};

/**
 * Account Security notification dispatcher
 */
export const notifyAccountSecurity = async ({ userId, activity }) => {
    try {
        await sendNotificationToUser(userId, {
            titleKey: 'ACCOUNT_SECURITY_ALERT',
            bodyKey: 'ACCOUNT_SECURITY_ALERT_BODY',
            params: {
                activity: activity || 'Your account password was recently changed.'
            },
            category: 'account_security', // Mandatory - cannot be disabled
            data: {
                type: 'account_security',
                action: 'security_alert'
            }
        });
    } catch (err) {
        console.error('Error in notifyAccountSecurity:', err);
    }
};

/**
 * System Broadcast / Target notification dispatcher
 * Teeno cases me array me user_ids accept karta hai:
 * - Single User: user_ids = [250]
 * - Multiple Users: user_ids = [210, 250, 252]
 * - All Users: user_ids = [] (Empty array) ya user_ids = ['all'] ya omitted
 */
export const sendSystemBroadcastNotification = async ({ title, body, isUrgent = false, user_ids = [] }) => {
    try {
        let recipientUserIds = [];

        // Check if array has specific user IDs
        if (Array.isArray(user_ids) && user_ids.length > 0) {
            // Agar array me 'all' nahi hai, to numeric IDs filter karein
            if (!user_ids.includes('all')) {
                recipientUserIds = user_ids
                    .map(id => Number(id))
                    .filter(id => Number.isFinite(id) && id > 0);
            }
        }

        // Agar array khali [] hai ya 'all' hai, to sabhi active users ko send karein
        if (recipientUserIds.length === 0) {
            const allUsers = await getAllUserFcmTokens();
            if (!allUsers || allUsers.length === 0) return { success: true, count: 0, total: 0 };
            recipientUserIds = allUsers.map(u => u.id);
        }

        const category = isUrgent ? 'system_mandatory' : 'marketing_promotional';
        let sentCount = 0;

        for (const userId of recipientUserIds) {
            // 1. Push + In-App Notification
            const res = await sendNotificationToUser(userId, {
                titleKey: 'SYSTEM_ANNOUNCEMENT',
                bodyKey: 'SYSTEM_ANNOUNCEMENT_BODY',
                params: { title, body },
                category,
                data: {
                    type: 'system_broadcast',
                    isUrgent: String(isUrgent)
                }
            });
            if (res && res.success) sentCount++;

            // 2. Email Announcement to User
            getUserById(userId).then(async (user) => {
                if (user && user.email) {
                    const recipientName = user.fullName || 'Valued User';
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #0b57d0; border-bottom: 2px solid #0b57d0; padding-bottom: 8px;">${title}</h2>
                            <p>Hello <strong>${recipientName}</strong>,</p>
                            <div style="background: #f8f9fa; border-left: 4px solid #0b57d0; padding: 15px; margin: 15px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 15px;">${body}</p>
                            </div>
                            <p style="margin-top: 20px; font-size: 13px; color: #666;">
                                Best regards,<br>
                                <strong>CarZone Team</strong>
                            </p>
                        </div>
                    `;
                    await sendEmail({
                        to: user.email,
                        subject: `[CarZone] ${title}`,
                        html: emailHtml
                    }).catch(mailErr => console.error(`Failed to send announcement email to ${user.email}:`, mailErr.message));
                }
            }).catch(userErr => console.error(`Error fetching user ${userId} for announcement email:`, userErr.message));
        }

        return { success: true, count: sentCount, total: recipientUserIds.length };
    } catch (err) {
        console.error('Error in sendSystemBroadcastNotification:', err);
        return { success: false, error: err.message };
    }
};
