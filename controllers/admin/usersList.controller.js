import { variableTypes } from '../../utils/constant.js';
import { fetchRoleByUsersId, fetchUserRoleData, getUserTotalSlots, countUserCars, countUserAllCars, getUserActivePlans, getSellerOpeningTimesModel } from '../../models/user.model.js';
import { getAllSellers, getAllBuyers, getAllPrivateUsers, getAllCompanyUsers, getUserById, getBuyerById, getSellerById, getSellerCarListings } from '../../models/admin.model.js';
import db from '../../config/db.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const getAllSellersAndBuyers = async (req, res) => {
  try {
    const role = req.query.role;
    const search = req.query.search || '';

    let users;
    if (role === "seller") {
      users = await getAllSellers(search);
    } else {
      users = await getAllBuyers(search);
    }
    users = await Promise.all(users.map(async (item) => {
      let fetchIsBlockedUser = await fetchRoleByUsersId(item.id, role);
      item.isBlocked = fetchIsBlockedUser?.[0]?.isBlocked ?? 0;
      return item;
    }));
    return handleSuccess(res, 200, getMessage("en", variableTypes.USER_DETAILED_FOUND_SUCCESSFULLY), users);
  } catch (error) {
    console.error(error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getAllPrivateAccounts = async (req, res) => {
  try {
    const search = req.query.search || '';

    let users;

    users = await getAllPrivateUsers(search);

    users = await Promise.all(users.map(async (item) => {
      let fetchIsBlockedUser = await fetchRoleByUsersId(item.id);
      item.isBlocked = fetchIsBlockedUser?.[0]?.isBlocked ?? 0;
      return item;
    }));
    return handleSuccess(res, 200, getMessage("en", variableTypes.USER_DETAILED_FOUND_SUCCESSFULLY), users);
  } catch (error) {
    console.error(error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getAllCompanyAccounts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const is_activated = req.query.is_activated; // '0', '1', '2', or undefined
 
    let users = await getAllCompanyUsers(search, is_activated);
 
    users = await Promise.all(users.map(async (item) => {
      let fetchIsBlockedUser = await fetchRoleByUsersId(item.id);
      item.isBlocked = fetchIsBlockedUser?.[0]?.isBlocked ?? 0;
      return item;
    }));
 
    return handleSuccess(res, 200, getMessage("en", variableTypes.USER_DETAILED_FOUND_SUCCESSFULLY), users);
  } catch (error) {
    console.error(error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getSingleBuyer = async (req, res) => {
  try {
    const id = req.query.id || req.query.userId || req.query.buyerId;

    if (!id) {
      return handleError(res, 400, 'User ID is required');
    }

    const buyer = await getBuyerById(id, 'buyer');

    if (!buyer || buyer.length === 0) {
      return handleError(res, 400, getMessage('en', variableTypes.BUYER_NOT_FOUND));
    }

    return handleSuccess(
      res,
      200,
      getMessage('en', variableTypes.BUYER_FETCHED_SUCCESSFULLY),
      buyer[0]
    );
  } catch (error) {
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const fetchUserById = async (req, res) => {
  try {
    const id = req.query.id || req.query.userId;

    if (!id) {
      return handleError(res, 400, 'User ID is required');
    }

    const users = await getUserById(id);

    if (!users || users.length === 0) {
      return handleError(res, 400, getMessage('en', variableTypes.BUYER_NOT_FOUND));
    }

    const user = users[0];

    if (user.account_type === 'company') {
      const roleData = await fetchUserRoleData(id);
      const slotLimit = await getUserTotalSlots(id);
      const listedCars = await countUserCars(id);
      const allCarsCount = await countUserAllCars(id);
      const slotLeft = Math.max(0, slotLimit - listedCars);
      
      user.totalListedCars = allCarsCount;
      user.activeCars = listedCars;
      user.seller_type = roleData?.[0]?.seller_type || null;
      user.profileImage = user.profileImage || null;
      user.isWhatsappSameAsPhone = user.phoneNumber === user.whatsappNumber;
      user.slotAvailable = slotLeft > 0;
      user.slotLeft = slotLeft;
      user.slotLimit = slotLimit;
      user.roleData = roleData;
      user.plans = await getUserActivePlans(id);

      if (roleData && roleData.some((role) => role.role === 'seller')) {
        try {
          const openingTimes = await getSellerOpeningTimesModel(id);
          const advantages = await db.query(
            "SELECT title FROM seller_advantages WHERE user_id = ?",
            [id]
          );
          const services = await db.query(
            "SELECT service_name, isActive FROM seller_services WHERE user_id = ?",
            [id]
          );
          const showroomImages = await db.query(
            "SELECT imageUrl FROM seller_images WHERE user_id = ?",
            [id]
          );
          const showroomVideos = await db.query(
            "SELECT videoUrl FROM seller_videos WHERE user_id = ?",
            [id]
          );
          const teamMembers = await db.query(
            "SELECT id, fullName, role, phoneNumber, email, languages, profilePhoto FROM seller_team_members WHERE user_id = ?",
            [id]
          );

          user.openingTimes = openingTimes || [];
          user.advantages = advantages.map((item) => item.title) || [];
          user.services = services || [];
          user.showroomImages = showroomImages.map((item) => item.imageUrl) || [];
          user.showroomVideos = showroomVideos.map((item) => item.videoUrl) || [];
          user.teamMembers = teamMembers || [];
        } catch (sellerDataError) {
          console.error("Error fetching admin company profile data:", sellerDataError);
          user.openingTimes = [];
          user.advantages = [];
          user.services = [];
          user.showroomImages = [];
          user.showroomVideos = [];
          user.teamMembers = [];
        }
      }
    }

    return handleSuccess(
      res,
      200,
      getMessage('en', variableTypes.BUYER_FETCHED_SUCCESSFULLY),
      user
    );
  } catch (error) {
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getSingleSeller = async (req, res) => {
  try {
    const id = req.query.id || req.query.userId || req.query.sellerId;

    if (!id) {
      return handleError(res, 400, 'Seller ID is required');
    }

    const seller = await getSellerById(id, 'seller');

    if (!seller || seller.length === 0) {
      return handleError(res, 400, getMessage('en', variableTypes.SELLER_NOT_FOUND));
    }

    const listings = await getSellerCarListings(id);

    return handleSuccess(
      res,
      200,
      getMessage('en', variableTypes.SELLER_FETCHED_SUCCESSFULLY),
      {
        ...seller[0],
        listings
      }
    );
  } catch (error) {
    console.error("Error fetching single seller:", error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};
