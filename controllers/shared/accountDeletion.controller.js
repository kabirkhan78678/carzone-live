import { deleteUserAccountAndDataModel, fetchUsersById } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage, comparePassword } from '../../utils/user_helper.js';

/**
 * Shared core handler for deleting user account and all associated data permanently.
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {string} platform 'web' | 'mobile' | 'shared'
 */
export const processAccountDeletion = async (req, res, platform = 'shared') => {
    try {
        const userId = req.user?.id;
        const lang = req.user?.language || req.body?.language || req.query?.language || 'en';
        const password = req.body?.password;

        if (!userId) {
            return handleError(res, 401, getMessage(lang, variableTypes.INVALID_OR_MISSING_TOKEN));
        }

        const userRows = await fetchUsersById(userId);
        if (!userRows || userRows.length === 0) {
            return handleError(res, 404, getMessage(lang, variableTypes.USER_NOT_FOUND));
        }

        const user = userRows[0];

        // If user passed a password and user has a hashed password in database, verify it
        if (password && user.password) {
            const isMatch = await comparePassword(password, user.password);
            if (!isMatch) {
                return handleError(res, 400, getMessage(lang, variableTypes.CURRENT_PASSWORD_INCORRECT));
            }
        }

        // Perform irreversible permanent deletion of all data
        const deletionResult = await deleteUserAccountAndDataModel(userId);
        if (!deletionResult.success) {
            return handleError(res, 404, getMessage(lang, variableTypes.USER_NOT_FOUND));
        }

        return handleSuccess(res, 200, getMessage(lang, variableTypes.ACCOUNT_DELETED_SUCCESSFULLY));
    } catch (error) {
        console.error(`[deleteAccount] Error deleting account:`, error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const deleteAccount = async (req, res) => {
    return processAccountDeletion(req, res, 'shared');
};
