import { findCarByIdAndUser, isCarAlreadySwapped, getUserActivePlan, insertSellerCars, markCarAsDeleted, insertCarSwap } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const swapCar = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user.language;
        const { oldCarId } = req.body;

        const [car] = await findCarByIdAndUser(oldCarId, user_id);

        if (!car) {
            return handleError(res, 404, getMessage(lang, variableTypes.CAR_NOT_FOUND));
        }

        console.log("Checking swap for oldCarId:", oldCarId);
        console.log("Checking swap for oldCarId:", oldCarId);
        const alreadySwapped = await isCarAlreadySwapped(oldCarId);

        if (alreadySwapped.length > 0) {
            return handleError(res, 400, "This car has already been swapped. You can’t swap it again.");
        }

        const [activePlan] = await getUserActivePlan(user_id);
        const today = new Date();
        const isPlanActive = activePlan && new Date(activePlan.end_date) >= today;

        if (!isPlanActive) {
            return handleError(res, 400, "You must have an active plan to swap cars.");
        }

        const carData = { ...req.body, user_id };
        delete carData.oldCarId;

        const result = await insertSellerCars(carData);
        const newCarId = result.insertId;

        await markCarAsDeleted(oldCarId);

        await insertCarSwap(user_id, oldCarId, newCarId);

        const [newCar] = await findCarByIdAndUser(newCarId, user_id);

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.CAR_SWAPPED_SUCCESSFULLY),
            newCar
        );

    } catch (error) {
        console.error("Swap car error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
