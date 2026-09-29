import { getUserNotificationSettings, updateUserNotificationSettings } from '../../models/user/notificationSettings.model.js';
import { handleSuccess, handleError } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.user?.language || 'en';

        const settings = await getUserNotificationSettings(userId);
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY) || 'Notification settings fetched successfully',
            settings,
            lang
        );
    } catch (err) {
        console.error('Error in getNotificationSettings:', err);
        return handleError(res, 500, getMessage(req.user?.language || 'en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.user?.language || 'en';

        const updatedSettings = await updateUserNotificationSettings(userId, req.body);
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.NOTIFICATION_STATUS_UPDATED_SUCCESSFULLY) || 'Notification settings updated successfully',
            updatedSettings,
            lang
        );
    } catch (err) {
        console.error('Error in updateNotificationSettings:', err);
        return handleError(res, 500, getMessage(req.user?.language || 'en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
