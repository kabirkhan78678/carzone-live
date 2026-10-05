import dotenv from 'dotenv';
import db from '../../config/db.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { variableTypes } from '../../utils/constant.js';
import { fetchUsersById, fetchUserRoleData, getUserActivePlans, getUserTotalSlots, countUserCars, getSellerOpeningTimesModel } from '../../models/user.model.js';
import { getUserNotificationSettings } from '../../models/user/notificationSettings.model.js';
import { getMessage } from '../../utils/user_helper.js';
import { processAccountDeletion } from '../shared/accountDeletion.controller.js';

dotenv.config();

export const getUserProfilemobile = async (req, res) => {
    let { language, id: user_id } = req.user;
    let lang = language;

    try {
        let checkUser = await fetchUsersById(user_id);
        if (!checkUser || checkUser.length === 0) {
            return handleError(res, 404, getMessage(lang, variableTypes.USER_NOT_FOUND));
        }

        let roleData = await fetchUserRoleData(user_id);
        roleData = Array.isArray(roleData) ? roleData : [];
        const sellerRole = roleData.find(role => role.role === 'seller') || null;

        // Get active plan
        const plans = await getUserActivePlans(user_id);
        //const slotLimit = plans?.[0]?.slot_count || 0;
        const slotLimit = await getUserTotalSlots(user_id);

        console.log('slotLimit---', slotLimit)

        // Count user's listed (active) cars
        const listedCars = await countUserCars(user_id); // where is_deleted = 0

        console.log('listedCars', listedCars)

        // Calculate how many slots are left
        const slotLeft = Math.max(0, slotLimit - listedCars);
        const slotAvailable = slotLeft > 0;

        // Prepare user profile (orginal data )
        let userProfile = checkUser[0];
        userProfile.profileImage = userProfile.profileImage || null;
        userProfile.sellerType = sellerRole?.seller_type || null;
        userProfile.accountType = userProfile.account_type || null;
        userProfile.businessPhone = userProfile.business_phone || userProfile.phoneNumber || null;
        userProfile.mobilePhone = userProfile.phoneNumber || null;
        const activationCode = Number(userProfile.is_activated);
        userProfile.companyApprovalStatus =
            userProfile.account_type !== "company"
                ? null
                : activationCode === 1
                    ? "approved"
                    : activationCode === 2
                        ? "rejected"
                        : "pending";

        // code by raj - Add whatsapp phone comparison right after whatsapp number
        const phoneNumber = userProfile.phoneNumber;
        const whatsappNumber = userProfile.whatsappNumber;
        userProfile.isWhatsappSameAsPhone = (phoneNumber === whatsappNumber);

        // Add slot info
        userProfile.slotAvailable = slotAvailable;
        userProfile.slotLeft = slotLeft;
        userProfile.slotLimit = slotLimit;
        userProfile.roleData = roleData;
        userProfile.notificationSettings = await getUserNotificationSettings(user_id);
        userProfile.openingTimes = [];
        userProfile.advantages = [];
        userProfile.services = [];
        userProfile.showroomImages = [];
        userProfile.showroomVideos = [];
        userProfile.teamMembers = [];

        // code by raj
        // Fetch seller profile data if user is a seller
        if (sellerRole) {
            try {
                // Get opening times
                const openingTimes = await getSellerOpeningTimesModel(user_id);
                userProfile.openingTimes = openingTimes || [];

                // Get advantages
                const advantages = await db.query("SELECT title FROM seller_advantages WHERE user_id = ?", [user_id]);
                userProfile.advantages = advantages.map(item => item.title) || [];

                // Get services
                const services = await db.query("SELECT service_name, isActive FROM seller_services WHERE user_id = ?", [user_id]);
                userProfile.services = services || [];

                // Get showroom images
                const showroomImages = await db.query("SELECT imageUrl FROM seller_images WHERE user_id = ?", [user_id]);
                userProfile.showroomImages = showroomImages.map(item => item.imageUrl) || [];

                // Get showroom videos
                const showroomVideos = await db.query("SELECT videoUrl FROM seller_videos WHERE user_id = ?", [user_id]);
                userProfile.showroomVideos = showroomVideos.map(item => item.videoUrl) || [];

                // Get team members
                const teamMembers = await db.query("SELECT id, fullName, role, phoneNumber, email, languages, profilePhoto FROM seller_team_members WHERE user_id = ?", [user_id]);
                userProfile.teamMembers = teamMembers || [];
            } catch (sellerDataError) {
                console.error("Error fetching seller profile data:", sellerDataError);
            }
        }

        return handleSuccess(res, 200, getMessage(lang, variableTypes.USER_DETAILED_FOUND_SUCCESSFULLY), userProfile);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const deleteAccountMobile = async (req, res) => {
    return processAccountDeletion(req, res, 'mobile');
};
