import { getSellerByIdModel, fetchUsersById, fetchUserRoleData, getUserTotalSlots, countUserCars, getSellerOpeningTimesModel, getSellerCarsModel, getSellerVideosModel, getUserReelsModel } from '../../models/user.model.js';
import db from '../../config/db.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const getSellerProfileById = async (req, res) => {
     const lang = "en";

    try {
        const sellerId = Number(req.params.id);

        if (!sellerId || !Number.isInteger(sellerId) || sellerId <= 0) {
            return handleError(
                res,
                400,
                "Invalid seller id"
            );
        }

        // Check whether seller exists
        const seller = await getSellerByIdModel(sellerId);

        if (!seller) {
            return handleError(
                res,
                404,
                "Seller not found"
            );
        }

             const parseArray = (value) => {
            if (!value) return value;
        
            if (Array.isArray(value)) return value;
        
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : value;
            } catch {
                return value;
            }
        };

        const filters = {
               search:req.query.search,
     brandName: parseArray(req.query.brandName),
    body_type_id: parseArray(req.query.body_type_id),
      totalPrice:req.query.totalPrice,
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    listing_status: req.query.listing_status,
    sort_key: parseArray(req.query.sort_key),
};

        // Build complete seller profile
        const sellerProfile = await buildSellerProfileForSingle(req.params.id, filters,lang);

        if (!sellerProfile) {
            return handleError(
                res,
                404,
                "Seller profile not found"
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            sellerProfile
        );

    } catch (error) {
        console.error("getSellerProfileById error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const buildSellerProfileForSingle = async (user_id,filters = {},lang) => {
    try {
        // Check user
        let checkUser = await fetchUsersById(user_id);

        console.log("here-------")
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
        userProfile.cars = [];
        userProfile.sellerVideos = [];
        userProfile.reels = []

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

         const cars = await getSellerCarsModel(user_id, lang, filters);
            userProfile.cars = cars || [];

            const sellerVideos = await getSellerVideosModel(user_id);
            userProfile.sellerVideos = sellerVideos.map(video => video.videoUrl);

            const userReels = await getUserReelsModel(user_id);
             userProfile.reels = userReels || [];
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
