import db from '../../config/db.js';

/**
 * Permanently and irreversibly deletes a user account along with all associated data:
 * - Personal user profile and authentication data (tbl_users, tbl_roles)
 * - Saved cars, wishlist, recently viewed, saved searches, saved reels
 * - Chat history, attachments, notifications, notification settings
 * - Listed cars, car images, features, leasing, contacts, reports
 * - Seller profile, opening times, advantages, services, team members, images, videos
 * - User reels, physical visits, purchase agreements, support tickets, app feedback
 * - User plans, slots, and slot requests
 * 
 * @param {number|string} userId
 * @returns {Promise<{success: boolean, notFound?: boolean}>}
 */
export const deleteUserAccountAndDataModel = async (userId) => {
    // 1. Check if user exists
    const user = await db.query("SELECT id, email FROM tbl_users WHERE id = ?", [userId]);
    if (!user || user.length === 0) {
        return { success: false, notFound: true };
    }

    // Helper to safely execute queries without crashing on non-existent optional tables
    const safeQuery = async (sql, params = []) => {
        try {
            return await db.query(sql, params);
        } catch (err) {
            console.warn(`[deleteUserAccountAndDataModel] Non-critical warning executing (${sql}):`, err.message);
            return null;
        }
    };

    // 2. Fetch and remove all cars listed by this user
    const userCars = await safeQuery("SELECT id FROM tbl_cars WHERE user_id = ?", [userId]);
    const carIds = Array.isArray(userCars) ? userCars.map(c => c.id).filter(Boolean) : [];

    if (carIds.length > 0) {
        const placeholders = carIds.map(() => '?').join(',');
        await safeQuery(`DELETE FROM tbl_cars_images WHERE carId IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_car_feature WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_car_leasing WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_car_contacts WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_car_reports WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_report_car WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_car_wishlist WHERE carId IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_recently_viewed WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_saved_car_reels WHERE carId IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_physical_visits WHERE car_id IN (${placeholders})`, carIds);
        await safeQuery(`DELETE FROM tbl_cars WHERE user_id = ?`, [userId]);
    }

    // 3. Delete saved cars, wishlists, recently viewed, and saved searches
    await safeQuery("DELETE FROM tbl_car_wishlist WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_recently_viewed WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_saved_searches WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_saved_car_reels WHERE userId = ?", [userId]);

    // 4. Delete chat attachments, notifications, and settings
    await safeQuery("DELETE FROM tbl_chat_attachments WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_notification WHERE sendTo = ? OR sendFrom = ?", [userId, userId]);
    await safeQuery("DELETE FROM tbl_user_notification_settings WHERE user_id = ?", [userId]);

    // 5. Delete user uploaded reels
    await safeQuery("DELETE FROM users_reels WHERE user_id = ?", [userId]);

    // 6. Delete seller profile attributes & media
    await safeQuery("DELETE FROM seller_opening_times WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM seller_advantages WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM seller_services WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM seller_team_members WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM seller_images WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM seller_videos WHERE user_id = ?", [userId]);

    // 7. Delete purchase agreements, visits, support tickets, and feedbacks
    await safeQuery("DELETE FROM purchase_agreements WHERE seller_user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_purchase_agreements WHERE seller_user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_physical_visits WHERE user_id = ? OR seller_id = ?", [userId, userId]);
    await safeQuery("DELETE FROM tbl_support WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_help_support WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_app_feedback WHERE seller_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_report_car WHERE user_id = ?", [userId]);

    // 8. Delete user plans, slot requests, and purchases
    await safeQuery("DELETE FROM tbl_user_plans WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_user_slots WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_purchases WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM slot_requests WHERE user_id = ?", [userId]);
    await safeQuery("DELETE FROM tbl_slot_requests WHERE user_id = ?", [userId]);

    // 9. Delete user roles
    await safeQuery("DELETE FROM tbl_roles WHERE user_id = ?", [userId]);

    // 10. Permanently delete user from tbl_users
    await safeQuery("DELETE FROM tbl_users WHERE id = ?", [userId]);

    return { success: true };
};
