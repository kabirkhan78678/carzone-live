import { findCarByIdAndUser, isCarAlreadySwapped, getUserActivePlan, getUserActivePlans, insertSellerCars, markCarAsDeleted, insertCarSwap } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import db from '../../config/db.js';

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

export const swapActiveCarSlot = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user?.language || 'en';
        const { deactivate_car_id, activate_car_id, oldCarId, newCarId } = req.body;

        const deactivateId = Number(deactivate_car_id || oldCarId);
        const activateId = Number(activate_car_id || newCarId);

        if (!deactivateId || !activateId) {
            return handleError(res, 400, "Both deactivate_car_id and activate_car_id are required", lang);
        }

        if (deactivateId === activateId) {
            return handleError(res, 400, "Cannot swap the same car with itself", lang);
        }

        // Verify both cars belong to user
        const [deactivateCar] = await findCarByIdAndUser(deactivateId, user_id);
        const [activateCar] = await findCarByIdAndUser(activateId, user_id);

        if (!deactivateCar || !activateCar) {
            return handleError(res, 404, "One or both cars not found or unauthorized", lang);
        }

        // Verify active plan
        const activePlans = await getUserActivePlans(user_id);
        if (!activePlans || activePlans.length === 0) {
            return handleError(res, 400, "No active subscription plan found to swap car slots.", lang);
        }

        // Perform swap: Deactivate old car, Activate new car
        await db.query(`UPDATE tbl_cars SET is_active = 0, slot_deleted_at = NOW() WHERE id = ? AND user_id = ?`, [deactivateId, user_id]);
        await db.query(`UPDATE tbl_cars SET is_active = 1, slot_deleted_at = NULL WHERE id = ? AND user_id = ?`, [activateId, user_id]);

        return handleSuccess(res, 200, "Car slot swapped successfully", {
            deactivated_car: { id: deactivateId, is_active: 0, status: "inactive" },
            activated_car: { id: activateId, is_active: 1, status: "active" }
        });

    } catch (error) {
        console.error("swapActiveCarSlot error:", error);
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};
