import { isUsersExistsOrNot, updateUserForgotPasswordOtp, fetchUsersById, changePassword, fetchUsersByEmail } from '../../models/user.model.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import Msg from '../../utils/message.js';
import { forgotPasswordTranslations, variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { sendEmail } from '../../utils/emailService.js';
import { comparePassword, hashPassword, getMessage, getEmailLogoConfig } from '../../utils/user_helper.js';
import { notifyAccountSecurity } from '../../services/notificationDispatchers.js';
import { baseurl } from '../../config/path.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const data = await isUsersExistsOrNot(email);
    const lang = data[0]?.language || "en";

    try {
        if (data.length === 0) {
            return handleError(res, 400, getMessage(lang, variableTypes.EMAIL_NOT_FOUND), []);
        }

        if (data[0].isVerified !== 1) {
            return handleError(res, 400, getMessage(lang, variableTypes.VERIFY_YOUR_ACCOUNT));
        }
        const code = Math.floor(1000 + Math.random() * 9000);
        await updateUserForgotPasswordOtp(code, email);

        const translations = forgotPasswordTranslations[lang] || forgotPasswordTranslations["en"];
        const supportEmail = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'carzonecti@gmail.com';
        const { logoUrl, attachments } = await getEmailLogoConfig();

        const context = {
            OTP: code,
            t: translations,
            msg: Msg.verifiedMessage,
            logo_url: logoUrl,
            support_email: supportEmail
        };

        const projectRoot = path.resolve(__dirname, "../../");
        const emailTemplatePath = path.join(projectRoot, "views", "forget_template.handlebars");
        const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
        const template = handlebars.compile(templateSource);
        const emailHtml = template(context);

        const emailOptions = {
            to: email,
            subject: getMessage(lang, variableTypes.FORGOT_PASSWORD_OTP_SUBJECT),
            html: emailHtml,
            attachments
        };

        try {
            await sendEmail(emailOptions);
        } catch (emailErr) {
            console.warn("Forgot password email send error (mocked/skipped):", emailErr.message);
        }
        return handleSuccess(res, 200, getMessage(lang, 'forgotPasswordOtpSend'));
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const changePasswordd = async (req, res) => {
    try {
        let {
            old_password,
            new_password,
            confirm_password
        } = req.body
        let { id } = req.user
        let lang = req.user?.language || "en";

        const data = await fetchUsersById(id);
        if (data.length > 0) {
            const match = await comparePassword(old_password, data[0].password);
            if (match) {
                if (new_password == confirm_password) {
                    const hash = await hashPassword(confirm_password);
                    let result = await changePassword(hash, id);
                    if (result.affectedRows) {
                        notifyAccountSecurity({
                            userId: id,
                            activity: 'Your password was changed from account settings.'
                        }).catch(err => console.error("Account security notification error:", err));
                        return handleSuccess(res, 200, getMessage(lang, variableTypes.PASSWORD_CHANGED));
                    } else {
                        return handleError(res, 400, getMessage(lang, variableTypes.PASSWORD_NOT_CHANGED));
                    }
                } else {
                    return handleError(res, 400, getMessage(lang, variableTypes.PASSWORD_DO_NOT_MATCH));
                }
            } else {
                return handleError(res, 400, getMessage(lang, variableTypes.CURRENT_PASSWORD_INCORRECT), []);
            }
        } else {
            return handleError(res, 400, getMessage(lang, variableTypes.DATA_NOT_FOUND), []);
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const resetPassword = async (req, res) => {
    let lang = req.user?.language || "en";
    try {
        const { email, new_password, confirm_password, newPassword, password } = req.body;
        const targetNewPassword = new_password || newPassword || password;
        const targetConfirmPassword = confirm_password || targetNewPassword;

        const data = await fetchUsersByEmail(email);
        if (data.length > 0) {
            if (targetNewPassword === targetConfirmPassword) {
                const hash = await hashPassword(targetConfirmPassword);
                const result = await changePassword(hash, data[0].id);

                if (result.affectedRows) {
                    notifyAccountSecurity({
                        userId: data[0].id,
                        activity: 'Your account password was reset.'
                    }).catch(err => console.error("Account security notification error:", err));
                    return handleSuccess(res, 200, getMessage(lang, variableTypes.PASSWORD_CHANGED));
                } else {
                    return handleError(res, 400, getMessage(lang, variableTypes.PASSWORD_NOT_CHANGED));
                }
            } else {
                return handleError(res, 400, getMessage(lang, variableTypes.PASSWORD_DO_NOT_MATCH));
            }
        } else {
            return handleError(res, 400, getMessage(lang, variableTypes.EMAIL_NOT_FOUND));
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR));
    }
};
// common for both rn
