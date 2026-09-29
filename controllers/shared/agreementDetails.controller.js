import { getPurchaseAgreementById } from '../../models/user/purchaseAgreement.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Controller for retrieving a single Purchase Agreement immutable snapshot by ID.
 * Route: GET /purchase-agreements/:id
 */
export const getPurchaseAgreementThroughId = async (req, res) => {
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

        const { id: agreementId } = req.params;
        if (!agreementId || isNaN(Number(agreementId))) {
            return handleError(
                res,
                400,
                getMessage(lang, 'Agreement ID must be a numeric value.') || 'Agreement ID must be a numeric value.'
            );
        }

        // 3. Fetch immutable snapshot from database (deleted_at IS NULL)
        const agreement = await getPurchaseAgreementById(Number(agreementId));

        // 4. Security & Existence check:
        // Must exist and must belong to the authenticated seller (purchase_agreements.seller_user_id = req.user.id)
        if (!agreement || Number(agreement.seller_user_id) !== Number(req.user.id)) {
            return handleError(
                res,
                404,
                getMessage(lang, 'Purchase agreement not found') || 'Purchase agreement not found'
            );
        }

        // 5. Format Warranty with multilingual legal text
        let warranty_label = null;
        let warranty_text = null;
        const warranty_type = agreement.warranty_type || null;
        const warranty_other_text = agreement.warranty_other_text || null;

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

        // 6. Build structured immutable snapshot response
        const responseData = {
            id: agreement.id,
            status: agreement.status || 'DRAFT',

            seller: {
                user_id: agreement.seller_user_id,
                company_name: agreement.seller_company_name,
                address: agreement.seller_address,
                phone: agreement.seller_phone,
                contact_person: agreement.seller_contact_person,
                is_legal_owner: agreement.seller_is_legal_owner === null ? true : Boolean(agreement.seller_is_legal_owner)
            },

            buyer: {
                full_name: agreement.buyer_full_name,
                date_of_birth: agreement.buyer_date_of_birth ? new Date(agreement.buyer_date_of_birth).toISOString().split('T')[0] : null,
                address: agreement.buyer_address,
                phone: agreement.buyer_phone
            },

            vehicle: {
                vehicle_id: agreement.vehicle_id,
                make: agreement.make,
                model: agreement.model,
                body_type: agreement.body_type,
                color: agreement.color,
                engine_displacement: agreement.engine_displacement,
                power: agreement.power,
                transmission: agreement.transmission,
                vin: agreement.vin,
                stammnummer: agreement.stammnummer,
                type_approval_number: agreement.type_approval_number,
                first_registration_date: agreement.first_registration_date ? new Date(agreement.first_registration_date).toISOString().split('T')[0] : null,
                mileage: agreement.mileage !== null ? Number(agreement.mileage) : null,
                last_mfk_date: agreement.last_mfk_date ? new Date(agreement.last_mfk_date).toISOString().split('T')[0] : null
            },

            purchase: {
                purchase_price: agreement.purchase_price !== null ? Number(agreement.purchase_price) : null,
                second_key_available: agreement.second_key_available !== null ? Boolean(agreement.second_key_available) : null,
                accident_free: agreement.accident_free !== null ? Boolean(agreement.accident_free) : null,
                vehicle_remarks: agreement.vehicle_remarks,
                defects_known: agreement.defects_known !== null ? Boolean(agreement.defects_known) : null,
                defect_remarks: agreement.defect_remarks,
                service_book_available: agreement.service_book_available !== null ? Boolean(agreement.service_book_available) : null,
                service_book_remarks: agreement.service_book_remarks
            },

            warranty: {
                warranty_type,
                warranty_label,
                warranty_text,
                warranty_other_text
            },

            payment: {
                payment_type: agreement.payment_type,
                payment_other_text: agreement.payment_other_text
            },

            handover: {
                date: agreement.handover_date ? new Date(agreement.handover_date).toISOString().split('T')[0] : null,
                location: agreement.handover_location
            },

            created_at: agreement.created_at,
            updated_at: agreement.updated_at
        };

        return handleSuccess(
            res,
            200,
            getMessage(lang, 'Purchase agreement fetched successfully') || 'Purchase agreement fetched successfully',
            responseData,
            lang
        );

    } catch (error) {
        console.error('getPurchaseAgreementThroughId error:', error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

// Aliases for backward compatibility in imports
export const getPurchaseAgreementDetails = getPurchaseAgreementThroughId;
export default getPurchaseAgreementThroughId;
