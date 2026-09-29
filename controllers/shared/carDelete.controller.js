import { findCarByIdAndUser, deleteCarImagesByCarId, deleteCarById, deleteCarImageByUrlModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { notifyFavoritedCarUsers } from '../../services/notificationDispatchers.js';

export const deleteCar = async (req, res) => {
    try {
        const { id: user_id, language } = req.user;
        const { carId } = req.params;

        const carExists = await findCarByIdAndUser(carId, user_id);
        if (!carExists || carExists.length === 0) {
            return handleError(res, 404, getMessage(language, variableTypes.CAR_NOT_FOUND_OR_UNAUTHORIZED));
        }

        const car = carExists[0];
        const carName = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';
        try {
            await notifyFavoritedCarUsers({ carId, event: 'deleted', carName, excludeUserId: user_id });
        } catch (notifErr) {
            console.error("Error notifying favorited car deleted:", notifErr);
        }

        await deleteCarImagesByCarId(carId);

        const result = await deleteCarById(carId, user_id);
        if (result.affectedRows === 0) {
            return handleError(res, 400, getMessage(language, variableTypes.DELETE_FAILED));
        }

        return handleSuccess(res, 200, getMessage(language, variableTypes.CAR_DELETED_SUCCESSFULLY));
    } catch (error) {
        console.error("Error deleting car:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const deleteCarImageByUrl = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        const user_id = req.user.id;
        const lang = req.user.language;
        if (!imageUrl) {
            return handleError(res, 400, getMessage(lang, variableTypes.IMAGE_URL_REQUIRED));
        }
        const result = await deleteCarImageByUrlModel(imageUrl, user_id);
        if (result.affectedRows === 0) {
            return handleError(res, 404, getMessage(lang, variableTypes.IMAGE_NOT_FOUND));
        }
        return handleSuccess(res, 200, getMessage(lang, variableTypes.IMAGE_DELETED_SUCCESSFULLY));
    } catch (error) {
        console.error("Error deleting car image:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
