import { getPurchaseAgreementById, updatePurchaseAgreement } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const counterPurchaseAgreement = async (req, res) => {
    try {
        const { id: userId, language } = req.user;
        const { id: agreementId } = req.params;
        const { counter_price } = req.body;

        if (counter_price === undefined || counter_price === null) {
            return handleError(
                res,
                400,
                getMessage(language, 'Counter price is required')
            );
        }

        const counterPrice = Number(counter_price);

        if (!Number.isFinite(counterPrice) || counterPrice <= 0) {
            return handleError(
                res,
                400,
                getMessage(language, 'Counter price must be greater than zero')
            );
        }

        const agreement = await getPurchaseAgreementById(agreementId);

        if (!agreement) {
            return handleError(
                res,
                404,
                getMessage(language, 'Purchase agreement not found')
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
                getMessage(language, 'Purchase agreement is no longer active')
            );
        }

        const isBuyer = Number(agreement.buyer_id) === Number(userId);
        const isSeller = Number(agreement.seller_id) === Number(userId);

        // if (!isBuyer || !isSeller) {
        //         res,
        //         403,
        //         getMessage(
        //             language,
        //             'You are not authorized for this purchase agreement'
        //         )
        //     );
        // }

        // Counter is not allowed once signing has started
        if (agreement.status === 'PENDING_SIGNATURES') {
            return handleError(
                res,
                400,
                getMessage(
                    language,
                    'Purchase agreement is already pending for signature'
                )
            );
        }

        const payload = {
            counter_price: counterPrice,
            agreed_price: null,
            status: 'negotiating'
        };

        await updatePurchaseAgreement(agreementId, payload);

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                'Counter price submitted successfully'
            )
        );

    } catch (error) {
        console.error('counterPurchaseAgreement error:', error);

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
