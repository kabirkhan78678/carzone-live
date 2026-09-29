import { getSellerGoogleData, updateSellerGoogleRating } from '../../models/user/sellerMediaTeam.model.js';
import { getSellerListModel, getSellerCountModel, getSellerByIdModel, getSellerVideosModel } from '../../models/user/sellerProfileSummary.model.js';
import { fetchUsersById, fetchUserRoleData, getSellerOpeningTimesModel } from '../../models/user.model.js';
import { getUserTotalSlots } from '../../models/user/userPlans.model.js';
import { countUserCars } from '../../models/user/carCrud.model.js';
import axios from 'axios';
import db from '../../config/db.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccessNew, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const getSellerGoogleRating = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('userId', userId);

        const seller = await getSellerGoogleData(userId);
        if (!seller) {
            return handleError(res, 404, getMessage("en", variableTypes.SELLER_NOT_FOUND));
        }

        if (
            seller.google_rating &&
            seller.google_rating_updated_at &&
            new Date() - new Date(seller.google_rating_updated_at) < 86400000
        ) {
            return handleSuccess(res, 200, getMessage("en", variableTypes.DATA_FOUND_SUCCESSFULLY), { rating: seller.google_rating });
        }

        if (!seller.google_place_id) {
            return handleSuccess(res, 200, getMessage("en", variableTypes.DATA_FOUND_SUCCESSFULLY), { rating: 0 });
        }

        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/details/json",
            {
                params: {
                    place_id: seller.google_place_id,
                    fields: "rating",
                    key: process.env.GOOGLE_API_KEY
                }
            }
        );

        const rating = response.data.result?.rating || 0;

        await updateSellerGoogleRating(userId, rating);

        return handleSuccess(res, 200, getMessage("en", variableTypes.DATA_FOUND_SUCCESSFULLY), { rating });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllSellerProfiles = async (req, res) => {
    const { language } = req.user;
    const lang = language;

    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);
        const offset = (page - 1) * limit;

        // Get seller ids with pagination
        const sellers = await getSellerListModel(limit, offset);

        // Total sellers
        const total = await getSellerCountModel();

        // Build complete profile for each seller
        const sellerProfiles = await Promise.all(
            sellers.map(async (seller) => {
                return await buildSellerProfile(seller.user_id);
            })
        );

        return handleSuccessNew(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: sellerProfiles.filter(Boolean),
            }
        );
    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

// in doubt

export const buildSellerProfile = async (user_id) => {
    try {
        // Check user
        let checkUser = await fetchUsersById(user_id);

        if (!checkUser || checkUser.length === 0) {
            return null;
        }

        // Get roles
        let roleData = await fetchUserRoleData(user_id);
        roleData = Array.isArray(roleData) ? roleData : [];

        const sellerRole =
            roleData.find((role) => role.role === "seller") || null;

        // Get slot information
        const slotLimit = await getUserTotalSlots(user_id);
        const listedCars = await countUserCars(user_id);

        const slotLeft = Math.max(0, slotLimit - listedCars);
        const slotAvailable = slotLeft > 0;

        // Prepare user profile
        let userProfile = checkUser[0];

        userProfile.profileImage = userProfile.profileImage || null;
        userProfile.sellerType = sellerRole?.seller_type || null;
        userProfile.accountType = userProfile.account_type || null;
        userProfile.businessPhone =
            userProfile.business_phone ||
            userProfile.phoneNumber ||
            null;
        userProfile.mobilePhone =
            userProfile.phoneNumber || null;

        const activationCode = Number(userProfile.is_activated);

        userProfile.companyApprovalStatus =
            userProfile.account_type !== "company"
                ? null
                : activationCode === 1
                ? "approved"
                : activationCode === 2
                ? "rejected"
                : "pending";

        // WhatsApp same as phone
        userProfile.isWhatsappSameAsPhone =
            userProfile.phoneNumber === userProfile.whatsappNumber;

        // Slot info
        userProfile.slotAvailable = slotAvailable;
        userProfile.slotLeft = slotLeft;
        userProfile.slotLimit = slotLimit;

        // Roles
        userProfile.roleData = roleData;

        // Default arrays
        userProfile.openingTimes = [];
        userProfile.advantages = [];
        userProfile.services = [];
        userProfile.showroomImages = [];
        userProfile.showroomVideos = [];
        userProfile.teamMembers = [];

        // Seller-specific data
        
            try {
                // Opening Times
                const openingTimes =
                    await getSellerOpeningTimesModel(user_id);

                userProfile.openingTimes = openingTimes || [];

                // Advantages
                const advantages = await db.query(
                    "SELECT title FROM seller_advantages WHERE user_id = ?",
                    [user_id]
                );

                userProfile.advantages =
                    advantages.map((item) => item.title) || [];

                // Services
                const services = await db.query(
                    "SELECT service_name, isActive FROM seller_services WHERE user_id = ?",
                    [user_id]
                );

                userProfile.services = services || [];

                // Showroom Images
                const showroomImages = await db.query(
                    "SELECT imageUrl FROM seller_images WHERE user_id = ?",
                    [user_id]
                );

                userProfile.showroomImages =
                    showroomImages.map((item) => item.imageUrl) || [];

                // Showroom Videos
                const showroomVideos = await db.query(
                    "SELECT videoUrl FROM seller_videos WHERE user_id = ?",
                    [user_id]
                );

                userProfile.showroomVideos =
                    showroomVideos.map((item) => item.videoUrl) || [];

                // Team Members
                const teamMembers = await db.query(
                    `SELECT
                        id,
                        fullName,
                        role,
                        phoneNumber,
                        email,
                        languages,
                        profilePhoto
                    FROM seller_team_members
                    WHERE user_id = ?`,
                    [user_id]
                );

                userProfile.teamMembers = teamMembers || [];
            } catch (sellerDataError) {
                console.error(
                    `Error fetching seller data for user ${user_id}:`,
                    sellerDataError
                );
            }
        

        return userProfile;
    } catch (error) {
        console.error(`Error building profile for user ${user_id}:`, error);
        return null;
    }
};
