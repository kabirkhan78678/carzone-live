import { isUsersExistsOrNot, updateUserForgotPasswordOtp, updateUserOtp, updateUsersProfile } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { sendResendForgotPasswordEmail, sendVerificationEmail, authenticateUser, getMessage } from '../../utils/user_helper.js';

export const resendOtp = async (req, res) => {
    const { email, isForgotPasswordPage } = req.body;
    let isUserExists = await isUsersExistsOrNot(email)
    let lang = isUserExists[0].language != null ? isUserExists[0].language : 'en';
    try {
        const code = Math.floor(1000 + Math.random() * 9000);
        let data;
        if (isUserExists.length > 0) {
            lang = isUserExists[0].language
            if (isForgotPasswordPage == 1) {
                data = { email, language: lang }
                await updateUserForgotPasswordOtp(code, email)
                await sendResendForgotPasswordEmail({ data, code, res });
            } else {
                data = { email, language: lang }
                await updateUserOtp(code, email)
                await sendVerificationEmail({ userData: data, code, res });
            }
        } else {
            return handleError(res, 400, getMessage(lang, variableTypes.USER_NOT_FOUND));
        }
    } catch (err) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const otpVerified = async (req, res) => {
    const { email, otp, isForgotPasswordPage, fcmToken } = req.body;
    const isDirectSignup = 1;
    const isUserExists = await isUsersExistsOrNot(email);

    try {
        if (isUserExists.length === 0) {
            return handleError(res, 400, getMessage('en', variableTypes.USER_NOT_FOUND));
        }

        const user = isUserExists[0];
        const lang = user.language || 'en';

        if (isForgotPasswordPage == 1) {
            if (user.forgotPasswordOtp == otp) {
                return handleSuccess(res, 200, getMessage(lang, variableTypes.OTP_VERIFIED));
            }
            return handleError(res, 400, getMessage(lang, variableTypes.INVALID_OTP));
        }

        if (user.code != otp) {
            return handleError(res, 400, getMessage(lang, variableTypes.INVALID_OTP));
        }

        await updateUsersProfile(
            {
                isVerified: 1,
                fcmToken: fcmToken
            },
            user.id
        );

        if (user.account_type === 'company') {
            const moduleType = "userLogin";
            const role = "user";
            const token = await authenticateUser(
                res,
                lang,
                user.password,
                isUserExists,
                fcmToken,
                moduleType,
                isDirectSignup,
                role
            );

            return handleSuccess(
                res,
                200,
                getMessage(lang, variableTypes.COMPANY_REGISTRATION_PENDING),
                token,
                user.id,
                user.fullName || ''
            );
        }

        const moduleType = "userLogin";
        const role = "user";
        const token = await authenticateUser(
            res,
            lang,
            user.password,
            isUserExists,
            fcmToken,
            moduleType,
            isDirectSignup,
            role
        );

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.ACCOUNT_SUCCESSFULLY_CREATED),
            token,
            user.id,
            user.fullName || ''
        );
    } catch (err) {
        console.log("err", err);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
