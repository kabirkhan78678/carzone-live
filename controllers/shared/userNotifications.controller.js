import { readAllNotificationsModel, readAllNotificationsModelByIdModel, removeAllNotificationByCurrentUserId, removeCarFromNotificationModelbyNotificationId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, getRequestLanguage } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const readAllNotifications = async (req, res) => {
    try {
        const { id } = req.user;
        const userLanguage = getRequestLanguage(req);

        let updateAllNotification = await readAllNotificationsModel(id);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'notificationsMarkedAsRead'),
            updateAllNotification,
            userLanguage
        );
    } catch (error) {
        const userLanguage = getRequestLanguage(req);
        return handleError(res, 500, getMessage(userLanguage, variableTypes.INTERNAL_SERVER_ERROR), userLanguage);
    }
};

export const readNotificationsById = async (req, res) => {
    try {
        const userLanguage = getRequestLanguage(req);
        const targetId = req.body?.notificationId || req.body?.notification_id || req.body?.id || req.params?.notificationId;

        let updateNotificationByIds = await readAllNotificationsModelByIdModel(targetId);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'notificationsMarkedAsRead'),
            updateNotificationByIds,
            userLanguage
        );
    } catch (error) {
        const userLanguage = getRequestLanguage(req);
        return handleError(res, 500, getMessage(userLanguage, variableTypes.INTERNAL_SERVER_ERROR), userLanguage);
    }
};

export const removeAllNotification = async (req, res) => {
    try {
        const { id } = req.user;
        const userLanguage = getRequestLanguage(req);

        await removeAllNotificationByCurrentUserId(id);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'allNotificationsCleared'),
            null,
            userLanguage
        );
    } catch (error) {
        const userLanguage = getRequestLanguage(req);
        return handleError(res, 500, getMessage(userLanguage, variableTypes.INTERNAL_SERVER_ERROR), userLanguage);
    }
};

export const removeNotificationById = async (req, res) => {
    try {
        const userLanguage = getRequestLanguage(req);
        const targetId = req.body?.notificationId || req.body?.notification_id || req.body?.id || req.params?.notificationId;

        await removeCarFromNotificationModelbyNotificationId(targetId);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'allNotificationsCleared'),
            null,
            userLanguage
        );
    } catch (error) {
        const userLanguage = getRequestLanguage(req);
        return handleError(res, 500, getMessage(userLanguage, variableTypes.INTERNAL_SERVER_ERROR), userLanguage);
    }
};

const parseArrayFilter = (value) => {

    if (!value) return [];

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        try {

            const parsed = JSON.parse(value);

            return Array.isArray(parsed)
                ? parsed
                : [value];

        } catch (err) {

            return [value];
        }
    }

    return [];
};
