import { fetchSlotRequests } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { fetchAllUsersWithPurchases, getAllPlans, fetchSlotRequestsByStatus, fetchSlotRequestsById, fetchSlotRequestById, insertPlan, changeSlotRequestStatus, fetchAdminSideUsersById, getSellerSlotDetails } from '../../models/admin.model.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { createNotificationMessage, sendNotification, getMessage } from '../../utils/user_helper.js';

export const getAllUsersWithPurchaseHistory = async (req, res) => {
  try {
    const rows = await fetchAllUsersWithPurchases();

    const groupedResult = {};

    for (const row of rows) {
      const userId = row.id;

      if (!groupedResult[userId]) {
        groupedResult[userId] = {
          user_id: userId,
          name: row.fullName,
          phoneNumber: row.phoneNumber,
          email: row.email,
          profile_image: row.profileImage,
          // Add more fields if necessary
          purchases: []
        };
      }

      groupedResult[userId].purchases.push({
        purchase_id: row.purchase_id,
        plan_id: row.plan_id,
        plan_name: row.plan_name,
        is_active: row.is_active,
        slot_count: row.slot_count,
        price: row.price,
        payment_status: row.payment_status,
        created_at: row.created_at,
        start_date: row.start_date,
        end_date: row.end_date
      });
    }
    const data = Object.values(groupedResult);

    // ✅ Sort by latest purchase created_at from purchases array:
    data.sort((a, b) => {
      const latestA = new Date(a.purchases[0].created_at);
      const latestB = new Date(b.purchases[0].created_at);
      return latestB - latestA;
    });

    return handleSuccess(res, 200, getMessage('en', variableTypes.SELLER_FETCHED_SUCCESSFULLY), data);


  } catch (err) {
    console.error("Error in getAllUsersWithPurchaseHistory:", err);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const fetchAllPlans = async (req, res) => {
  try {
    const plans = await getAllPlans();

    return handleSuccess(res, 200, getMessage('en', variableTypes.SELLER_FETCHED_SUCCESSFULLY), plans);

  } catch (error) {
    console.error("Error fetching all plans:", error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getPendingSlotRequests = async (req, res) => {
  try {

    const requests = await fetchSlotRequestsByStatus("pending");

    return handleSuccess(
      res,
      200,
      getMessage('en', "DATA_FETCHED_SUCCESSFULLY"),
      requests
    );
  } catch (error) {
    console.error("Get pending slot requests error:", error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getAllSlotRequests = async (req, res) => {
  try {

    const requests = await fetchSlotRequests();
    console.log('requests', requests)
    if (requests.length == 0) {
      return handleSuccess(
        res,
        200,
        getMessage('en', "No Slots Requests"),
        requests
      );
    }
    requests.map((item) => {

    })

    return handleSuccess(
      res,
      200,
      getMessage('en', "DATA_FETCHED_SUCCESSFULLY"),
      requests
    );
  } catch (error) {
    console.error("Get pending slot requests error:", error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getSlotRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const [slotRequest] = await fetchSlotRequestsById(id);

    if (!slotRequest) {
      return res.status(404).json({ message: "Slot request not found" });
    }

    return handleSuccess(
      res,
      200,
      getMessage('en', "DATA_FETCHED_SUCCESSFULLY"),
      slotRequest
    );
  } catch (error) {
    console.error("Get slot request by ID error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateSlotRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminMessage, price, planType } = req.body;
    let lang = req.user?.language || "en";

    const request = await fetchSlotRequestById(id);

    if (!request || request.length === 0) {
      return handleError(res, 404, getMessage(lang, "REQUEST_NOT_FOUND"));
    }

    const originalRequest = request[0];

    if (originalRequest.status === "approved") {
      return handleError(res, 400, "This request has already been approved.");
    }

    if (action === "approved") {
      if (price === undefined || planType === undefined) {
        return handleError(res, 400, getMessage(lang, "MISSING_PRICE_OR_PLANTYPE"));
      }

      if (originalRequest.price && originalRequest.price > 0) {
        return handleError(res, 400, "Price has already been set and cannot be changed.");
      }

      const newPlan = await insertPlan({
        name: `Custom Plan for User ${originalRequest.user_id}`,
        price: price,
        slot_count: originalRequest.requested_slots,
        plan_type: planType,
        is_public: 0,
        user_id: originalRequest.user_id,
      });

      await changeSlotRequestStatus(id, action, adminMessage, price, newPlan.insertId);

      // --- FIX STARTS HERE ---
      console.log('originalRequest.user_id', originalRequest.user_id);

      const userFcmToken = await fetchAdminSideUsersById(originalRequest.user_id);
      console.log('userFcmToken', userFcmToken);


      let notificationMessage = await createNotificationMessage({
        notificationSend: 'slotRequestApproved',
        fullName: 'Admin',
        userId: originalRequest.user_id,
        usersfetchFcmToken: userFcmToken[0].fcmToken,
        notificationType: 'slot_request',
        slots: originalRequest.requested_slots,
        price: price,
      });
      console.log('Notification Message:', notificationMessage);
      notificationMessage.data.isSendTo = '1'
      const message = await sendNotification(notificationMessage, lang);
      // --- FIX ENDS HERE ---

    } else if (action === "rejected") {
      await changeSlotRequestStatus(id, action, adminMessage);

      const userFcmToken = await fetchAdminSideUsersById(originalRequest.user_id);
      console.log('userFcmToken', userFcmToken);


      let notificationMessage = await createNotificationMessage({
        notificationSend: 'slotRequestRejected',
        fullName: 'Admin',
        userId: originalRequest.user_id,
        usersfetchFcmToken: userFcmToken[0].fcmToken,
        notificationType: 'slot_request',
        slots: originalRequest.requested_slots,
        price: price,
      });
      console.log('Notification Message:', notificationMessage);
      notificationMessage.data.isSendTo = 1
      const message = await sendNotification(notificationMessage, lang);
    } else {
      return handleError(res, 400, "Invalid Action");
    }

    const updatedRequest = await fetchSlotRequestById(id);

    return handleSuccess(
      res,
      200, `Slot Request ${action.toUpperCase()} Successfully`,
      updatedRequest[0]
    );
  } catch (error) {
    console.error("Update slot request status error:", error);
    return handleError(res, 500, getMessage("en", "INTERNAL_SERVER_ERROR"));
  }
};

export const fetchSellerSlotDetails = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const data = await getSellerSlotDetails(sellerId);

    if (!data.summary) {
      return res.status(404).json({
        success: false,
        message: "Seller not found or no purchases",
      });
    }

    return res.status(200).json({
      success: true,
      seller: data.summary,
      listings: data.listings,
    });
  } catch (error) {
    console.error("Error fetching seller details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller slot details",
    });
  }
};
