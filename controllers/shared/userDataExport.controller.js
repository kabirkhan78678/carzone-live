import { exportAndEmailUserData } from '../../services/userDataExport.service.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Controller to trigger the export of user data into a ZIP archive of CSVs
 * and send it to the user's registered email address.
 * 
 * @param {Object} req 
 * @param {Object} res 
 */
export const downloadUserDataController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const lang = req.user?.language || req.query?.language || req.body?.language || 'en';

        if (!userId) {
            return handleError(res, 401, getMessage(lang, variableTypes.INVALID_OR_MISSING_TOKEN));
        }

        const result = await exportAndEmailUserData(userId);

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.USER_DATA_DOWNLOAD_EMAIL_SENT),
            {
                email: result.email,
                fileName: result.fileName
            }
        );
    } catch (error) {
        console.error("[downloadUserDataController] Error exporting user data:", error);
        return handleError(res, 500, error.message || getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
