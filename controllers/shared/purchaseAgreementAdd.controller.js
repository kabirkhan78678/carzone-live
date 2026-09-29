import { fetchUserById, addPurchaseAgreementModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const addPurchaseAgreement = async (req, res) => {
    try {
        const lang = req.user?.language || 'en';
        const buyer_id = req.body.buyer_id || req.user.id;
        const seller_id = req.body.seller_id;
        const car_id = req.body.car_id;

        const payload = {
            ...req.body,
            buyer_id,
            seller_id,
            car_id
        };

        const result = await addPurchaseAgreementModel(payload);

        if (result && result.insertId) {
            return handleSuccess(
                res,
                200,
                getMessage(lang, variableTypes.PURCHASE_AGREEMENT_ADDED_SUCCESS)
            );
        } else {
            return handleError(
                res,
                400,
                getMessage(lang, variableTypes.FAILED_TO_ADD_PURCHASE_AGREEMENT)
            );
        }
    } catch (error) {
        console.error("addPurchaseAgreement Error:", error);
        return handleError(
            res,
            500,
            getMessage("en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};
