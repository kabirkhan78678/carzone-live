import { fetchCarsByCarId, validateReportReasonIds, reportCarModel } from '../../models/user.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const reportCar = async (req, res) => {
    try {
        const { car_id } = req.params;
        const user_id = req.user?.id || null;
        let lang = req.user?.language || 'en';

        const {
            reasons,
            custom_message
        } = req.body;

        let reasonList = reasons;
        if (!reasonList && (req.body.reason_id || req.body.reasonId)) {
            reasonList = [Number(req.body.reason_id || req.body.reasonId)];
        }

        /*---------- VALIDATION ---------- */
        if (!Array.isArray(reasonList) || reasonList.length === 0) {
            return handleError(res, 400, "Please select at least one reason");
        }

        // Ensure all are integers
        reasonList = reasonList.map(id => Number(id)).filter(id => !isNaN(id));
        if (reasonList.length === 0) {
            return handleError(res, 400, "Invalid reason IDs");
        }

        /* ---------- CHECK CAR ---------- */
        const car = await fetchCarsByCarId(car_id);
        if (!car.length) {
            return handleError(res, 404, "Car not found");
        }

        /* ---------- VALIDATE REASON IDs FROM MASTER TABLE ---------- */
        const validReasons = await validateReportReasonIds(reasonList);

        if (validReasons.length !== reasonList.length) {
            return handleError(res, 400, "One or more invalid reason IDs");
        }

        /* ---------- SAVE REPORT ---------- */
        await reportCarModel({
            car_id,
            user_id,
            reasons: reasonList, // store IDs
            custom_message
        });

        return handleSuccess(
            res,
            201,
            "Report submitted successfully",
            null
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

/*------------------code by raj of api getreportsReasons----------*/
