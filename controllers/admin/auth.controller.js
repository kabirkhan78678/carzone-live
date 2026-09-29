import crypto from 'crypto';
import path from 'path';
import ejs from 'ejs';
import { baseurl } from '../../config/path.js';
import { variableTypes } from '../../utils/constant.js';
import { modelLoginAdmin, get_admin_data_by_email, update_admin_data, get_admin_data_by, update_admin_data_by, updateAdminProfile, fetchAdminid, updateAdminPassword } from '../../models/admin.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Msg from '../../utils/message.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { comparePassword, hashPassword, getMessage, getEmailLogoConfig } from '../../utils/user_helper.js';
import { sendEmail } from '../../utils/emailService.js';

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    let result = await modelLoginAdmin(email);
    if (result.length === 0) {
      return handleError(res, 400, getMessage("en", variableTypes.EMAIL_NOT_FOUND), []);
    }
    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return handleError(res, 400, getMessage("en", variableTypes.PASSWORD_DO_NOT_MATCH));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return handleSuccess(res, 200, getMessage("en", variableTypes.LOGIN_SUCCESSFULLY), token);
  } catch (error) {
    console.error("Login error:", error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const render_forgot_password_page = (req, res) => {
  try {
    return res.render("resetPasswordAdmin.ejs");
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const forgot_password = async (req, res) => {
  try {
    const { email } = req.body;
    const [admin] = await get_admin_data_by_email(email);
    if (!admin) {
      return handleError(res, 404, getMessage("en", variableTypes.ADMIN_NOT_FOUND));
    }

    if (admin.is_verified === false) {
      return handleError(res, 400, Msg.VERIFY_EMAIL_FIRST);
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await update_admin_data(
      resetToken,
      resetTokenExpiry,
      email
    );
    const resetLink = `${req.protocol}://${req.get(
      "host"
    )}/api/admin/reset-password?token=${resetToken}`;
    const { logoUrl, attachments } = await getEmailLogoConfig();
    const emailTemplatePath = path.join(
      process.cwd(),
      "views",
      "forgotPasswordAdmin.ejs"
    );
    let emailHtml = `<p>Click <a href="${resetLink}">here</a> to reset your admin password.</p>`;
    try {
      emailHtml = await ejs.renderFile(emailTemplatePath, {
        resetLink,
        image_logo: logoUrl,
        support_email: process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'carzonecti@gmail.com'
      });
    } catch (renderErr) {
      console.warn("EJS render error:", renderErr.message);
    }

    try {
      await sendEmail({
        to: email,
        subject: "Password Reset Request",
        html: emailHtml,
        attachments
      });
    } catch (emailErr) {
      console.warn("Send email error:", emailErr.message);
    }

    return handleSuccess(res, 200, `Password reset link has been sent on your (${email})`);

  } catch (error) {
    console.error("forgot_password error:", error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const reset_password = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const [admin] = await get_admin_data_by(token);
    if (!admin) {
      return handleError(res, 400, getMessage("en", variableTypes.INVALID_TOKEN));
    }
    if (admin.show_password === newPassword) {
      return handleError(res, 400, getMessage("en", variableTypes.PASSWORD_CAN_NOT_SAME));
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const update_result = await update_admin_data_by(
      hashedPassword,
      newPassword,
      admin.id
    );
    if (update_result.affectedRows > 0) {
      return handleSuccess(res, 200, getMessage("en", variableTypes.PASSWORD_RESET_SUCCESSFULLY));
    } else {
      return handleError(res, 500, getMessage("en", variableTypes.PASSWORD_RESET_FAILED));
    }
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const render_success_reset = (req, res) => {
  return res.render("successReset.ejs");
};

export const getProfile = async (req, res) => {
  try {
    const data = req.admin;
    return handleSuccess(res, 200, getMessage("en", variableTypes.ADMIN_DETAILED_FOUND_SUCCESSFULLY), data);
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const adminObj = Array.isArray(req.admin) ? req.admin[0] : req.admin;
    const id = adminObj.id;
    const isAdminExists = await fetchAdminid(id);
    let profileImg;
    if (req.files && req.files.profileImage) {
      profileImg = `${baseurl}/profile/${req.files.profileImage[0].filename}`;
    } else {
      profileImg = isAdminExists[0]?.profileImage || null;
    }
    const result = await updateAdminProfile(firstName, lastName, profileImg, id);
    return handleSuccess(res, 200, getMessage("en", variableTypes.PROFILE_UPDATED_SUCCESSFULLY), result);
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const changePasswordd = async (req, res) => {
  try {
    let { old_password, new_password, confirm_password, current_password } = req.body;
    const currentPass = old_password || current_password;
    const newPass = new_password;
    const confirmPass = confirm_password || new_password;

    const adminObj = Array.isArray(req.admin) ? req.admin[0] : req.admin;
    let id = adminObj.id;
    let lang = req.user?.language || "en";

    const data = await fetchAdminid(id);
    if (data.length > 0) {
      const match = await comparePassword(currentPass, data[0].password);
      if (match) {
        if (newPass === confirmPass) {
          const hash = await hashPassword(confirmPass);
          let result = await updateAdminPassword(hash, id);
          if (result.affectedRows) {
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
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};
