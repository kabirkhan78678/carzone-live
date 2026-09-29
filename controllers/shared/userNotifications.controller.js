import { readAllNotificationsModel, readAllNotificationsModelByIdModel, removeAllNotificationByCurrentUserId, removeCarFromNotificationModelbyNotificationId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const readAllNotifications = async (req, res) => {
    try {
        const { id, language } = req.user;
        const rawLang = req.query?.lang || req.query?.language || req.headers?.language || req.headers?.['accept-language']?.split(',')[0]?.substring(0, 2) || language || 'en';
        const userLanguage = ['en', 'de', 'fr', 'it'].includes(String(rawLang).toLowerCase()) ? String(rawLang).toLowerCase() : 'en';

        let updateAllNotification = await readAllNotificationsModel(id);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'notificationsMarkedAsRead'),
            updateAllNotification,
            userLanguage
        );
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const readNotificationsById = async (req, res) => {
    try {
        const { id, language } = req.user;
        const rawLang = req.query?.lang || req.query?.language || req.headers?.language || req.headers?.['accept-language']?.split(',')[0]?.substring(0, 2) || language || 'en';
        const userLanguage = ['en', 'de', 'fr', 'it'].includes(String(rawLang).toLowerCase()) ? String(rawLang).toLowerCase() : 'en';
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
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const removeAllNotification = async (req, res) => {
    try {
        const { id, language } = req.user;
        const rawLang = req.query?.lang || req.query?.language || req.headers?.language || req.headers?.['accept-language']?.split(',')[0]?.substring(0, 2) || language || 'en';
        const userLanguage = ['en', 'de', 'fr', 'it'].includes(String(rawLang).toLowerCase()) ? String(rawLang).toLowerCase() : 'en';

        await removeAllNotificationByCurrentUserId(id);
        return handleSuccess(
            res,
            200,
            getMessage(userLanguage, 'allNotificationsCleared'),
            null,
            userLanguage
        );
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const removeNotificationById = async (req, res) => {
    try {
        const { language } = req.user || {};
        const rawLang = req.query?.lang || req.query?.language || req.headers?.language || req.headers?.['accept-language']?.split(',')[0]?.substring(0, 2) || language || 'en';
        const userLanguage = ['en', 'de', 'fr', 'it'].includes(String(rawLang).toLowerCase()) ? String(rawLang).toLowerCase() : 'en';
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
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
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
