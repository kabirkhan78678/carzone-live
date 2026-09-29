import { fetchRoleByUsersId, insertUserRole, updateUsersProfile, insertSellerRole, updateBusinessSellerDetails } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const changeMode = async (req, res) => {
    let { id, language } = req.user
    try {
        const { isSeller } = req.body
        let role;
        if (isSeller == 1) {
            role = 'seller'
            let isSeller = true
            let isSellerExists = await fetchRoleByUsersId(id, role)
            if (isSellerExists.length > 0) {
                return handleSuccess(res, 200, getMessage(language, variableTypes.SUCESSFULLY_SWITCH_AS_SELLER_MODE), { isSeller });
            } else {
                const rolePayload = { user_id: id, role: 'seller', seller_type: 'personal', is_active: 1 };
                await insertUserRole(rolePayload);
                return handleSuccess(res, 200, getMessage(language, variableTypes.SUCESSFULLY_SWITCH_AS_SELLER_MODE), { isSeller });
            }
        } else {
            role = 'buyer'
            let isBuyer = true
            let seller_type = null
            let isBuyerExists = await fetchRoleByUsersId(id, role)
            if (isBuyerExists.length > 0) {
                return handleSuccess(res, 200, getMessage(language, variableTypes.SUCESSFULLY_SWITCH_AS_BUYER_MODE), { isBuyer });
            } else {
                const rolePayload = { user_id: id, role: role, seller_type: null, is_active: 1 };
                await insertUserRole(rolePayload);
                return handleSuccess(res, 200, getMessage(language, variableTypes.SUCESSFULLY_SWITCH_AS_BUYER_MODE), { isBuyer });
            }
        }
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const changeNotificationStatus = async (req, res) => {
    try {
        const { id, language } = req.user;
        const { isNotification } = req.body;

        if (isNotification !== 0 && isNotification !== 1) {
            return handleError(res, 400, getMessage(language, variableTypes.INVALID_VALUE_FOR_NOTIFICATION_STATUS));
        }
        const updateNotification = { isNotification };
        await updateUsersProfile(updateNotification, id);
        return handleSuccess(res, 200, getMessage(language, variableTypes.NOTIFICATION_STATUS_UPDATED_SUCCESSFULLY));
    } catch (error) {
        return handleError(res, 500, getMessage(language, variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const changeLanguage = async (req, res) => {
    try {
        const { id } = req.user;
        const rawLanguage = req.body?.language || req.body?.lang || req.query?.language || req.query?.lang || 'en';
        const language = String(rawLanguage).toLowerCase();
        const allowedLanguages = ['en', 'de', 'it', 'fr'];
        if (!allowedLanguages.includes(language)) {
            return handleError(res, 400, getMessage('en', variableTypes.INVALID_LANGUAGE_CODE));
        }
        await updateUsersProfile({ language }, id);
        if (req.user) {
            req.user.language = language;
        }
        if (res.locals) {
            res.locals.language = language;
        }
        return handleSuccess(
            res,
            200,
            getMessage(language, variableTypes.LANGUAGE_UPDATED_SUCCESSFULLY),
            { language },
            language
        );
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const updateBuyerToSeller = async (req, res) => {
    try {
        const user_id = req.user.id;
        console.log('user_id??????????????????', user_id);

        let { language } = req.user
        console.log('language>>>>>>>>>', language);

        const { seller_type, legalForm, companyName, companyAddress, vat } = req.body;
        const role = 'seller';
        let buyerAllredyAsSeller = await fetchRoleByUsersId(user_id, role)
        if (buyerAllredyAsSeller.length > 0) {
            return handleSuccess(res, 200, getMessage(language, variableTypes.ALRAEDY_SELLER_JUST_SWITCH_ROLE));
        }
        else {
            if (seller_type === 'personal') {
                const data = { user_id, role, seller_type };
                const result = await insertSellerRole(data);
                return handleSuccess(res, 200, getMessage(language, variableTypes.USER_UPDATED_PERSONAL_SELLER_SUCCESSFULLY));
            } else {
                const businessData = {
                    legalForm,
                    companyName,
                    companyAddress,
                    vat
                };
                const updateResult = await updateBusinessSellerDetails(businessData, user_id);
                (updateResult.affectedRows > 0)
                const data = { user_id, role, seller_type };
                await insertSellerRole(data);
                return handleSuccess(res, 200, getMessage(language, variableTypes.USER_UPDATED_BUSINESS_SELLER_SUCCESSFULLY));
            }
        }
    } catch (error) {
        console.error("Error updating buyer to seller:", error);
        return handleError(res, 500, getMessage(variableTypes.INTERNAL_SERVER_ERROR));
    }
};

// ----------------------------------------------seller module--------------------------------------------//
