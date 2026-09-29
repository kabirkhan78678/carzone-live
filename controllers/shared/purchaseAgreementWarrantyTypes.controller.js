import { handleSuccess, handleError } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Controller to fetch allowed warranty types for Purchase Agreement dropdown.
 * Endpoint: GET /api/user/purchase-agreement/warranty-types
 */
export const getPurchaseAgreementWarrantyTypes = async (req, res) => {
    try {
        const lang = req.query.lang || req.user?.language || 'en';

        const data = [
            {
                value: 'EXCLUDED',
                label: getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED')
            },
            {
                value: 'TWO_YEAR_ART_210',
                label: getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210')
            },
            {
                value: 'OTHER',
                label: getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_OTHER')
            }
        ];

        return handleSuccess(
            res,
            200,
            getMessage(lang, 'Warranty types fetched successfully') || 'Warranty types fetched successfully',
            data,
            lang
        );
    } catch (error) {
        console.error('getPurchaseAgreementWarrantyTypes error:', error);
        return handleError(res, 500, 'Internal server error', req.query.lang || req.user?.language || 'en');
    }
};

export default getPurchaseAgreementWarrantyTypes;
