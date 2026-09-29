import { getPurchaseAgreementById, updatePurchaseAgreement } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const cancelPurchaseAgreement = async (req, res) => {
    try {
        const { id: userId, language } = req.user;
        const { id: agreementId } = req.params;

        const agreement = await getPurchaseAgreementById(agreementId);

        if (!agreement) {
            return handleError(
                res,
                404,
                getMessage(language, 'Purchase agreement not found')
            );
        }

        const isBuyer =
            Number(agreement.buyer_id) === Number(userId);

        const isSeller =
            Number(agreement.seller_id) === Number(userId);

        if (!isBuyer && !isSeller) {
            return handleError(
                res,
                403,
                getMessage(
                    language,
                    'You are not authorized for this purchase agreement'
                )
            );
        }

        if (
            agreement.status === 'COMPLETED' ||
            agreement.status === 'CANCELLED' ||
            agreement.status === 'EXPIRED'
        ) {
            return handleError(
                res,
                400,
                getMessage(
                    language,
                    'Purchase agreement is no longer active'
                )
            );
        }

        await updatePurchaseAgreement(
            agreementId,
            {
                status: 'CANCELLED'
            }
        );

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                'Purchase agreement cancelled successfully'
            )
        );

    } catch (error) {
        console.error('cancelPurchaseAgreement error:', error);

        return handleError(
            res,
            500,
            getMessage(
                'en',
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};
