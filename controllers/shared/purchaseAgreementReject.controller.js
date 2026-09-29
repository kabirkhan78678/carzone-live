import { sendPurchaseAgreementNotification } from '../../services/notification.service.js';
import { getUserById } from '../../models/admin.model.js';
import { getPurchaseAgreementById, updatePurchaseAgreement, getCarById } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const rejectPurchaseAgreement = async (req, res) => {
    try {
        const {
            id: userId,
            language
        } = req.user;

        const {
            id: agreementId
        } = req.params;

        // =========================================
        // GET PURCHASE AGREEMENT
        // =========================================

        const agreement =
            await getPurchaseAgreementById(agreementId);

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

        // =========================================
        // CHECK USER AUTHORIZATION
        // =========================================

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

        // =========================================
        // CHECK STATUS
        // =========================================

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

        // =========================================
        // UPDATE AGREEMENT STATUS
        // =========================================

        await updatePurchaseAgreement(
            agreementId,
            {
                status: 'REJECTED'
            }
        );

        // =========================================
        // SELLER REJECTED
        // SEND NOTIFICATION TO BUYER
        // =========================================

        if (isSeller) {

            const buyerId =
                Number(agreement.buyer_id);

            // =====================================
            // GET SELLER
            // =====================================

            const sellerResult =
                await getUserById(userId);

            // getUserById returns array
            const seller =
                Array.isArray(sellerResult)
                    ? sellerResult[0]
                    : sellerResult;

            console.log(
                '========== SELLER DEBUG =========='
            );

            console.log(
                'Seller ID:',
                userId
            );

            console.log(
                'Seller Data:',
                seller
            );

            console.log(
                'Seller fullName:',
                seller?.fullName
            );

            console.log(
                '==================================='
            );

            const senderName =
                seller?.fullName ||
                seller?.full_name ||
                seller?.fullname ||
                seller?.name ||
                'Seller';

            // =====================================
            // CAR NAME
            // =====================================
console.log(agreement.car_id)
             const car =
                await getCarById(agreement.car_id);

              console.log(car,"car")

            const carName =
                car?.brandName ||
                agreement.car_name ||
                agreement.vehicleName ||
                'car';

            console.log(
                'Rejecting Seller ID:',
                userId
            );

            console.log(
                'Rejecting Seller Name:',
                senderName
            );

            console.log(
                'Buyer ID:',
                buyerId
            );

            console.log(
                'Agreement ID:',
                agreementId
            );

            console.log(
                'Car ID:',
                agreement.car_id
            );

            console.log(
                'Car Name:',
                carName
            );

            // =====================================
            // SEND NOTIFICATION
            // =====================================

            try {
                await sendPurchaseAgreementNotification({
                    agreementId:
                        Number(agreementId),

                    senderId:
                        Number(userId),

                    receiverId:
                        buyerId,

                    carId:
                        agreement.car_id
                            ? Number(agreement.car_id)
                            : null,

                    carName,

                    senderName,

                    salePrice:
                        agreement.sale_price,

                    counterPrice:
                        agreement.counter_price,

                    titleKey:
                        'PURCHASE_AGREEMENT_REJECTED',

                    bodyKey:
                        'PURCHASE_AGREEMENT_REJECTED_BODY',

                    notificationType:
                        'purchase_agreement_rejected'
                });
            } catch (notifErr) {
                console.error('Notification error on reject:', notifErr);
            }
        }

        // =========================================
        // SUCCESS
        // =========================================

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                'Purchase agreement rejected successfully'
            )
        );

    } catch (error) {

        console.error(
            'rejectPurchaseAgreement error:',
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
