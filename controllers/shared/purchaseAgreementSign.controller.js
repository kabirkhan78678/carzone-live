import { baseurl } from '../../config/path.js';
import { getPurchaseAgreementById, updatePurchaseAgreement } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const signPurchaseAgreement = async (req, res) => {
    try {
        const { id: userId, language } = req.user;
        const { id: agreementId } = req.params;

        console.log('==========================================');
        console.log('Sign Purchase Agreement Started');
        console.log('Agreement ID:', agreementId);
        console.log('User ID:', userId);
        console.log('==========================================');

        // =========================
        // Signature File
        // =========================

        const signatureFile =
            req.files?.signature?.[0];

        if (!signatureFile) {
            return handleError(
                res,
                400,
                getMessage(
                    language,
                    'Signature is required'
                )
            );
        }

        console.log(
            'Signature File:',
            signatureFile.filename
        );

        // =========================
        // Get Agreement
        // =========================

        const agreement =
            await getPurchaseAgreementById(
                agreementId
            );

        console.log(
            'Purchase Agreement:',
            agreement
        );

        if (!agreement) {
            return handleError(
                res,
                404,
                getMessage(
                    language,
                    'Purchase agreement not found'
                )
            );
        }

        // =========================
        // Check Status
        // =========================

        if (
            agreement.status === 'COMPLETED' ||
            agreement.status === 'REJECTED' ||
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

        // =========================
        // Authorization
        // =========================

        const isBuyer =
            Number(agreement.buyer_id) ===
            Number(userId);

        const isSeller =
            Number(agreement.seller_id) ===
            Number(userId);

        console.log(
            'Is Buyer:',
            isBuyer
        );

        console.log(
            'Is Seller:',
            isSeller
        );

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

        // =========================
        // Signature URL
        // =========================

        const signatureUrl =
            `${baseurl}/purchase-agreement/${signatureFile.filename}`;

        console.log(
            'Signature URL:',
            signatureUrl
        );

        const payload = {};

        // =========================
        // Buyer Signing
        // =========================

        if (isBuyer) {

            if (
                agreement.buyer_signature_url
            ) {
                return handleError(
                    res,
                    400,
                    getMessage(
                        language,
                        'Buyer has already signed the purchase agreement'
                    )
                );
            }

            payload.buyer_signature_url =
                signatureUrl;

            console.log(
                'Buyer signature added'
            );
        }

        // =========================
        // Seller Signing
        // =========================

        if (isSeller) {

            if (
                agreement.seller_signature_url
            ) {
                return handleError(
                    res,
                    400,
                    getMessage(
                        language,
                        'Seller has already signed the purchase agreement'
                    )
                );
            }

            payload.seller_signature_url =
                signatureUrl;

            console.log(
                'Seller signature added'
            );
        }

        // =========================
        // Check Both Signatures
        // =========================

        const buyerSigned =
            isBuyer ||
            !!agreement.buyer_signature_url;

        const sellerSigned =
            isSeller ||
            !!agreement.seller_signature_url;

        console.log(
            'Buyer Signed:',
            buyerSigned
        );

        console.log(
            'Seller Signed:',
            sellerSigned
        );

        // =========================
        // Agreement Completion
        // =========================

        if (
            buyerSigned &&
            sellerSigned
        ) {

            // If buyer provided a counter price,
            // use it as final agreed price.
            //
            // Otherwise use original selling price.
            const finalAgreedPrice =
                agreement.counter_price !== null &&
                agreement.counter_price !== undefined
                    ? agreement.counter_price
                    : agreement.sale_price;

            payload.agreed_price =
                finalAgreedPrice;

            payload.status =
                'COMPLETED';

            console.log(
                'Both parties signed'
            );

            console.log(
                'Final Agreed Price:',
                finalAgreedPrice
            );

            console.log(
                'Status:',
                'COMPLETED'
            );
        }

        // =========================
        // Update Agreement
        // =========================

        console.log(
            'Update Purchase Agreement Payload:',
            payload
        );

        await updatePurchaseAgreement(
            agreementId,
            payload
        );

        console.log(
            'Purchase Agreement Updated Successfully'
        );

        // =========================
        // Response
        // =========================

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                buyerSigned &&
                sellerSigned
                    ? 'Purchase agreement completed successfully'
                    : 'Purchase agreement signed successfully'
            )
        );

    } catch (error) {

        console.error(
            'signPurchaseAgreement error:',
            error
        );

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
