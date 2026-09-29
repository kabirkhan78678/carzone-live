import { getPurchaseAgreementById, deletePurchaseAgreement as softDeletePurchaseAgreementModel } from '../../models/user/purchaseAgreement.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

/**
 * Controller for soft-deleting an existing Purchase Agreement draft.
 * Endpoint: DELETE /purchase-agreements/:id
 */
export const deletePurchaseAgreementController = async (req, res) => {
    try {
        const lang = req.user?.language || 'en';

        // 1. Authorization: User must be authenticated
        if (!req.user || !req.user.id) {
            return handleError(
                res,
                401,
                getMessage(lang, 'User authentication is required')
            );
        }

        // 2. Authorization: User must be a company / dealer
        if (req.user.account_type !== 'company') {
            return handleError(
                res,
                403,
                getMessage(lang, 'PURCHASE_AGREEMENT_DEALER_ONLY')
            );
        }

        // 3. Agreement ID verification
        const { id: agreementId } = req.params;
        if (!agreementId || isNaN(Number(agreementId))) {
            return handleError(
                res,
                400,
                getMessage(lang, 'PURCHASE_AGREEMENT_ID_REQUIRED')
            );
        }

        const numericAgreementId = Number(agreementId);

        // 4. Fetch existing agreement record (deleted_at IS NULL)
        const existingAgreement = await getPurchaseAgreementById(numericAgreementId);

        // 5. Ownership & Existence check
        if (!existingAgreement || Number(existingAgreement.seller_user_id) !== Number(req.user.id)) {
            return handleError(
                res,
                404,
                getMessage(lang, 'PURCHASE_AGREEMENT_NOT_FOUND')
            );
        }

        // 6. Status check: Only DRAFT agreements can be deleted
        if (existingAgreement.status !== 'DRAFT') {
            return handleError(
                res,
                400,
                getMessage(lang, 'PURCHASE_AGREEMENT_ONLY_DRAFT_CAN_BE_DELETED')
            );
        }

        // 7. Perform Soft Delete (sets deleted_at = CURRENT_TIMESTAMP)
        await softDeletePurchaseAgreementModel(numericAgreementId, req.user.id);

        return handleSuccess(
            res,
            200,
            getMessage(lang, 'PURCHASE_AGREEMENT_DELETED_SUCCESS'),
            {
                id: numericAgreementId
            },
            lang
        );

    } catch (error) {
        console.error('deletePurchaseAgreementController error:', error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const deletePurchaseAgreement = deletePurchaseAgreementController;
export default deletePurchaseAgreementController;
