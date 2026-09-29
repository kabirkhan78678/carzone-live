import { sendChatNotification } from '../../services/notification.service.js';
import { fetchUsersById } from '../../models/user.model.js';
import { NotificationTypes, variableTypes } from '../../utils/constant.js';
import { handleSuccess, handleError, handleSuccessNew } from '../../utils/responseHandler.js';
import { createNotificationMessage, sendNotification, getMessage } from '../../utils/user_helper.js';

export const sendChatNotificationByChatId = async (req, res) => {
    try {
        const { chatId, senderId, reciverId, receiver_id, isSend } = req.query;
        const finalSenderId = senderId || req.user?.id;
        const finalReceiverId = reciverId || receiver_id || req.query.userId;
        const lang = req.user?.language || 'en';

        if (!finalReceiverId) {
            return handleError(res, 400, 'Receiver ID is required');
        }

        let userDetails = await fetchUsersById(finalSenderId);
        let fullName = userDetails?.[0]?.fullName || 'User';
        let reciverUserDetails = await fetchUsersById(finalReceiverId);
        let fcmToken = reciverUserDetails?.[0]?.fcmToken;

        const notificationType = NotificationTypes.SEND_MESSAGE_NOTIFICATION;
        const notificationSend = 'sendMessage';
        const postId = chatId || '1';

        try {
            let notificationMessage = await createNotificationMessage({
                notificationSend,
                fullName,
                id: finalSenderId,
                userId: finalReceiverId,
                followId: null,
                usersfetchFcmToken: fcmToken,
                notificationType,
                postId,
            });

            if (notificationMessage?.data) {
                notificationMessage.data.sendFrom = finalSenderId;
                notificationMessage.data.sendTo = finalReceiverId;
                notificationMessage.data.carId = '';
                notificationMessage.data.isSendTo = isSend || 1;
            }
            await sendNotification(notificationMessage, postId);
        } catch (notifErr) {
            console.warn('sendNotification warning:', notifErr.message);
        }

        return handleSuccess(res, 200, getMessage(lang, variableTypes.NOTIFICATION_CAR_SUCCESFULLY_LISTED));
    } catch (error) {
        console.error("Error sending chat notification by chat id:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send chat notification",
            error: error.message
        });
    }
};

//     try {
//     } catch (error) {
//     }
// };

export const sendChatNotificationController = async (req, res) => {
    try {
        const {
            user_id,
            chat_id,
            body,
            car_details
        } = req.body;

        const senderId = req.user?.id || null;
        const senderName = req.user?.fullName || "New Message";

        if (!user_id || !body) {
            return res.status(400).json({
                success: false,
                message: "user_id and body are required",
            });
        }

        const result = await sendChatNotification({
            userId: user_id,
            senderId,
            chatId: chat_id,
            body,
            carDetails: car_details,
            senderName,
        });

        console.log(
            "Chat notification service result:",
            result
        );

        return handleSuccess(res, 200, getMessage("en", variableTypes.DATA_FOUND_SUCCESSFULLY), result);

    } catch (error) {
        console.error(
            "sendChatNotificationController error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to send chat notification",
        });
    }
};
