import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { fetchReportReasons } from '../../models/user.model.js';

export const getReportReasons = async (req, res) => {
    try {
        const lang = req.user?.language || 'en';
        const reasons = await fetchReportReasons(lang);

        return handleSuccess(
            res,
            200,
            "Report reasons fetched successfully",
            reasons
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};
