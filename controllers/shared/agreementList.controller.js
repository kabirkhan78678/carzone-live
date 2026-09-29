import { getPurchaseAgreementsBySeller } from '../../models/user/purchaseAgreement.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Controller for listing all non-deleted Purchase Agreements created by the authenticated dealer.
 * Route: GET /purchase-agreements
 */
export const getPurchaseAgreements = async (req, res) => {
    try {
        const lang = req.query.lang || req.user?.language || 'en';

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
                getMessage(lang, 'Only dealer accounts can access purchase agreements') || 'Only dealer accounts can access purchase agreements'
            );
        }

        const agreements = await getPurchaseAgreementsBySeller(req.user.id, {
            limit: req.query.limit,
            offset: req.query.offset
        });

        // Format each agreement's warranty and snapshot
        const formattedList = (agreements || []).map(agreement => {
            let warranty_label = null;
            let warranty_text = null;
            const warranty_type = agreement.warranty_type || null;

            if (warranty_type === 'EXCLUDED') {
                warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED');
                warranty_text = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED_TEXT');
            } else if (warranty_type === 'TWO_YEAR_ART_210') {
                warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210');
                warranty_text = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210_TEXT');
            } else if (warranty_type === 'OTHER') {
                warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_OTHER');
                warranty_text = null;
            }

            return {
                id: agreement.id,
                status: agreement.status || 'DRAFT',
                vehicle_id: agreement.vehicle_id,
                make: agreement.make,
                model: agreement.model,
                vin: agreement.vin,
                buyer: {
                    full_name: agreement.buyer_full_name,
                    phone: agreement.buyer_phone
                },
                purchase_price: agreement.purchase_price !== null ? Number(agreement.purchase_price) : null,
                warranty: {
                    warranty_type,
                    warranty_label,
                    warranty_text,
                    warranty_other_text: agreement.warranty_other_text
                },
                payment_type: agreement.payment_type,
                handover_date: agreement.handover_date ? new Date(agreement.handover_date).toISOString().split('T')[0] : null,
                created_at: agreement.created_at,
                updated_at: agreement.updated_at
            };
        });

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FETCHED_SUCCESSFULLY),
            formattedList,
            lang
        );
    } catch (error) {
        console.error('getPurchaseAgreements error:', error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getPurchaseAgreementList = getPurchaseAgreements;
export default getPurchaseAgreements;
