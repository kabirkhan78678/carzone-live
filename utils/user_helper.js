import crypto from 'crypto';
import db from '../config/db.js';
import base64url from 'base64url';
import bcrypt from 'bcrypt';
import Msg from '../utils/message.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import { sendEmail, sendSupportEmail } from '../utils/emailService.js';
import { insertUserNotifications, updateUsersProfile } from '../models/user.model.js';
import admin from 'firebase-admin';
import mime from 'mime-types';
import os from 'os';
import { getUserFcmToken, getAllUserFcmTokens } from '../models/user.model.js';
import { forgotPasswordTranslations, variableTypes, emailVerificationTranslations } from './constant.js';
import { detectModerationLabels } from '../services/rekognitionService.js';
import { normalizeFacetedFilters } from '../services/facetedFilters/normalizeFilters.js';
import { baseurl } from '../config/path.js';

const serviceAccount = JSON.parse(
    await fs.readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const capitalizeFirstLetterOfWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const randomStringAsBase64Url = (size) => {
    return base64url(crypto.randomBytes(size));
};

export const generateToken = (user) => {
    return jwt.sign({ data: { id: user.id, role: user.role }, }, process.env.AUTH_SECRETKEY);
};

export const authenticateUser = async (res, lang, password, userData, fcmToken, moduleType, isDirectSignup, role) => {
    let user = userData[0];
    user.role = role;
    if (isDirectSignup == 1) {
        const jwt_token = generateToken(user);
        let response = { jwt_token: jwt_token, role: role, userId: user.id }
        return response;
    } else {
        const match = bcrypt.compareSync(password, user.password);
        if (!match) {
            return handleError(res, 400, getMessage(lang, 'invalidPassword'), [],lang);
        }
        if (moduleType == "userLogin") {
            let data = { fcmToken: fcmToken }
            await updateUsersProfile(data, user.id);
        }
        const jwt_token = generateToken(user);
        let response = { jwt_token: jwt_token, role: role, userId: user.id }
        return handleSuccess(res, 200, getMessage(lang, 'loginSuccess'), response,lang);
    }
};

export const hashPassword = async (password) => {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Password hashing failed");
    }
};

export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        throw new Error("Password comparison failed");
    }
};

export const sendHtmlResponse = (res, statusCode, message) => {
    res.status(statusCode).send(`
        <div style="text-align: center; padding: 20px;">
            <h3>${message}</h3>
        </div>
    `);
};

export const generateRandomString = async (length) => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const getEmailLogoConfig = async () => {
    const logoCid = "carzone-logo@carzone";
    const publicLogoUrl = process.env.PUBLIC_LOGO_URL;
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const attachments = [];
    let logoUrl = publicLogoUrl || `cid:${logoCid}`;

    if (!publicLogoUrl) {
        try {
            await fs.access(logoPath);
            attachments.push({
                filename: "logo.png",
                path: logoPath,
                cid: logoCid,
                contentType: "image/png",
                contentDisposition: "inline"
            });
        } catch (err) {
            console.warn("Logo file not found at", logoPath);
        }
    }

    return { logoUrl, attachments };
};

export const sendVerificationEmail = async ({ userData, code, res }) => {
    const lang = userData?.language || 'en';
    const translations = emailVerificationTranslations[lang] || emailVerificationTranslations["en"];
    const supportEmail = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'carzonecti@gmail.com';
    const { logoUrl, attachments } = await getEmailLogoConfig();

    const context = {
        verification_code: code,
        t: translations,
        msg: Msg.verifiedMessage,
        logo_url: logoUrl,
        support_email: supportEmail
    };

    const projectRoot = path.resolve();
    const emailTemplatePath = path.join(projectRoot, "views", "otp_verification.handlebars");
    const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
    const template = handlebars.compile(templateSource);
    const emailHtml = template(context);
    const emailOptions = {
        to: userData.email,
        subject: getMessage(lang, variableTypes.ACCOUNT_VERIFICATION),
        html: emailHtml,
        attachments
    };
    await sendEmail(emailOptions);
    if (res) {
        return handleSuccess(res, 200, getMessage(lang, variableTypes.ACCOUNT_VERIFIED_CODE_SENT));
    }
    return { success: true, message: getMessage(lang, variableTypes.ACCOUNT_VERIFIED_CODE_SENT) };
};

export const sendResendForgotPasswordEmail = async ({ userData, code, res }) => {
    const lang = userData?.language || 'en';
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

    const projectRoot = path.resolve();
    const emailTemplatePath = path.join(projectRoot, "views", "forget_template.handlebars");
    const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
    const template = handlebars.compile(templateSource);
    const emailHtml = template(context);

    const emailOptions = {
        to: userData?.email,
        subject: getMessage(lang, variableTypes.FORGOT_PASSWORD_OTP_SUBJECT),
        html: emailHtml,
        attachments
    };

    await sendEmail(emailOptions);
    if (res) {
        return handleSuccess(res, 200, getMessage(lang, variableTypes.ACCOUNT_VERIFIED_CODE_SENT));
    }
    return { success: true, message: getMessage(lang, variableTypes.ACCOUNT_VERIFIED_CODE_SENT) };
};

export const sendNotification = async (message, language) => {
    console.log("message", message);
    await insertUserNotifications(message, "success");

    if (!message.token) {
        return {};
    }

    try {
        const response = await admin.messaging().send(message);
        const responseText = JSON.stringify(response);
        return responseText;
    } catch (error) {
        console.error("❌ Error sending FCM notification:", error);
        // Optionally log the error to your DB or monitoring service
        return { error: error.message || "Failed to send notification" };
    }
};


export const createNotificationMessage = async ({
    notificationSend,
    fullName,
    id,
    userId,
    usersfetchFcmToken,
    notificationType,
    slots,
    price
}) => {
    let notification = {};
    switch (notificationSend) {
        case 'carlisting':
            notification = {
                title: `${fullName} just listed a new car!`,
                body: `${fullName} has added a new car. Check it out in their profile.`
            };
            break;

        case 'commentsOnPost':
            notification = {
                title: `${fullName} ${Msg.commentOnPosts}`,
                body: `${fullName} ${Msg.hasCommentedCheckPost}`
            };
            break;

        case 'sendMessage':
            notification = {
                title: fullName,
                body: "sent you a message"
            };
            break;

        case 'likedPost':
            notification = {
                title: `${fullName} ${Msg.likeOnPost}`,
                body: `${fullName} ${Msg.hasLikedCheckPost}`
            };
            break;

        case 'sellerApproved':
            notification = {
                title: `${fullName} ${Msg.hasApprovedAsSeller}`,
                body: `Congratulations, ${fullName}! ${Msg.hasApprovedBodyData}`
            };
            break;
        case 'slotRequestApproved':
            notification = {
                title: 'Slot Request Approved!',
                body: `Your request for ${slots} slots has been approved at a price of ${getChfFormattedPrice(price)}. Tap to view your new custom plan!`
            };
            break;

        case 'slotRequestRejected':
            notification = {
                title: 'Slot Request Rejected',
                body: 'Your slot request has been rejected. Please choose another available slot.'
            };
            break;
        case 'sellerRejected':
            notification = {
                title: `${Msg.hasRejectAsASeller}`,
                body: `Sorry, ${fullName}.${Msg.hasRejectBodyData}`
            };
            break;
        default:
            notification = {
                title: `${fullName} ${Msg.hasFollowingYou}`,
                body: `${fullName} ${Msg.hasFollowCheckProfile}`
            };
            break;
    }
    return {
        notification,
        data: {
            sendFrom: String(id || "-1"),
            sendTo: String(userId || ""),
            notificationType: String(notificationType || ""),
        },
        token: usersfetchFcmToken || ""
    };
};


export const getMimeType = (file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    console.log("File Extension:", ext);
    console.log("Detected MIME Type:", file.mimetype);

    switch (ext) {
        case ".jpg":
        case ".jpeg":
            return "image/jpeg";
        case ".png":
            return "image/png";
        case ".gif":
            return "image/gif";
        case ".mp4":
            return file.mimetype === "application/octet-stream" ? "video/mp4" : "video/mp4";
        case ".avi":
            return "video/x-msvideo";
        case ".mov":
            return "video/quicktime";
        case ".pdf":
            return "application/pdf";
        case ".txt":
            return "text/plain";
        case ".csv":
            return "text/csv";
        default:
            return mime.lookup(ext) || "application/octet-stream";
    }
};

export const generateUniqueProductID = () => {
    const randomNumber = crypto.randomInt(10000, 99999);
    return `TPD${randomNumber}`;
}

export const sendUserSupportEmail = async ({ fullName, data, res }) => {
    const supportEmail = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'carzonecti@gmail.com';
    const { logoUrl, attachments } = await getEmailLogoConfig();

    const context = {
        fullName: fullName,
        phoneNumber: data.phoneNumber,
        message: data.message,
        logo_url: logoUrl,
        support_email: supportEmail
    };
    const projectRoot = path.resolve();
    const emailTemplatePath = path.join(projectRoot, "views", "supportTemplate.handlebars");
    const templateSource = await fs.readFile(emailTemplatePath, "utf-8");
    const template = handlebars.compile(templateSource);
    const emailHtml = template(context);

    const emailOptions = {
        to: data.email,
        subject: Msg.userSupport,
        html: emailHtml,
        attachments
    };
    await sendSupportEmail(emailOptions);
    if (res) {
        return handleSuccess(res, 200, `${Msg.supportRequestSent}`);
    }
    return { success: true, message: `${Msg.supportRequestSent}.` };
};

export const getMessage = (lang, key) => {
    const message = Msg[key];
    if (!message) return key;
    return message[lang] || message["en"];
};

export const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

export const getChfFormattedPrice = (amount) => {
    if (!amount || isNaN(amount)) return amount;
 
    const num = parseFloat(amount).toFixed(2); // keep two decimals
    const [whole, decimal] = num.split(".");
 
    const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${formattedWhole}.${decimal}.–CHF`;
};

export const sendNotificationToUser = async (userId, message) => {
    try {
        const fcmToken = await getUserFcmToken(userId);

        if (!fcmToken) { return }
        const payload = {
            token: fcmToken,
            notification: {
                title: '📢 Plan Notification',
                body: message,
            },
            data: {
                type: 'plan_update',
            },
        };
        const response = await admin.messaging().send(payload);
        console.log(`✅ Notification sent to user ${userId}: ${response}`);
    } catch (error) {
        console.error(`❌ Error sending notification to user ${userId}:`, error.message);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));

    }
};

export const sendFcmNotificationToAllUsers = async (user_id) => {
    try {
        const users = await getAllUserFcmTokens(user_id);
        if (!Array.isArray(users) || users.length === 0) {
            return;
        }
        const tokens = users.map(u => u.fcmToken).filter(t => t && t.trim() !== "");

        if (tokens.length === 0) {
            return;
        }
        const response = await admin.messaging().sendMulticast({
            tokens,
            notification: {
                title: "New Car Listed 🚗",
                body: "A new car has just been listed. Check it out!"
            },
        });
        console.log(`✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);
    } catch (error) {
        console.error("❌ Error sending notifications:", error.message || error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const sendNotificationToAllUsers = async (senderId, carId) => {
    try {
        const users = await db.query("SELECT id FROM tbl_users WHERE id != ? AND isSeller = 0", [senderId]);
        for (let user of users) {
            const notification = {
                data: {
                    sendFrom: senderId,
                    sendTo: user.id,
                    notificationType: "NEW_CAR",
                    carId,
                    isSendTo: 1
                },
                notification: {
                    title: "New Car Listed 🚗",
                    body: "A new car has just been listed. Check it out!"
                }
            };
            await insertUserNotifications(notification, "UNREAD");
        }
        console.log("✅ Notifications sent to all users");
    } catch (error) {
        console.error("❌ Notification Error:", error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const hasExplicitContent = async (imageBuffer) => {
    try {
        const moderationLabels = await detectModerationLabels(imageBuffer);
        if (!moderationLabels || !Array.isArray(moderationLabels) || moderationLabels.length === 0) {
            return false;
        }

        return moderationLabels.some(label =>
            label.ParentName === 'Explicit Nudity' ||
            label.Name === 'Graphic Violence' ||
            label.Name === 'Graphic Male Nudity' ||
            label.Name === 'Graphic Female Nudity' ||
            label.Name === 'Swimwear or Underwear' ||
            label.Name === 'Female Swimwear or Underwear' ||
            label.Name === 'Non-Explicit Nudity' ||
            label.Name === 'Partially Exposed Female Breast' ||
            (label.Confidence > 70 && (
                label.Name?.includes('Nudity') ||
                label.Name?.includes('Swimwear') ||
                label.Name?.includes('Underwear') ||
                label.Name?.includes('Exposed')
            ))
        );
    } catch (error) {
        console.warn('Moderation check skipped due to error:', error.message);
        return false;
    }
};

export const getPurchasesWithPlanDetails = async (user_plan_id) => {
    // Get all purchases linked to this user_plan_id
    const purchases = await db.query(
        `SELECT p.*, pl.name as plan_name, pl.price as full_price, pl.slot_count
     FROM tbl_purchases p
     LEFT JOIN tbl_plans pl ON p.plan_id = pl.id
     WHERE p.user_plan_id = ?`,
        [user_plan_id]
    );

    // Handle additional slots (plan_id NULL)
    for (let purchase of purchases) {
        if (purchase.plan_id) {
            // Lookup per-slot price (from your plans table or config)
            const perSlotPlan = await db.query(
                `SELECT price FROM tbl_plans WHERE id = ? `, [purchase.plan_id]
            );

            if (perSlotPlan) {
                purchase.full_price = perSlotPlan[0].price;
            }
        }
    }

    return purchases;
};

export const recalcMfk = async (vehicleId) => {
    const [vehicle] = await db.query(`SELECT id, first_registration_date, last_mfk_date FROM tbl_cars WHERE id = ?`, [vehicleId]);

    if (!vehicle) return null;
    let { first_registration_date, last_mfk_date } = vehicle;
    let next_mfk_due = null;
    if (!first_registration_date) {
        await db.query(`UPDATE tbl_cars SET mfk_status = 'no_data', next_mfk_due = NULL WHERE id = ?`, [vehicleId]);
        return { status: "no_data", next_mfk_due: null };
    }
    const refDate = last_mfk_date || first_registration_date;
    const yearsSinceFirst = Math.floor(
        (new Date(refDate) - new Date(first_registration_date)) / (1000 * 60 * 60 * 24 * 365)
    );
    if (!last_mfk_date) {
        next_mfk_due = new Date(first_registration_date);
        next_mfk_due.setFullYear(next_mfk_due.getFullYear() + 5);
    } else if (yearsSinceFirst <= 5) {
        next_mfk_due = new Date(last_mfk_date);
        next_mfk_due.setFullYear(next_mfk_due.getFullYear() + 3);
    } else {
        next_mfk_due = new Date(last_mfk_date);
        next_mfk_due.setFullYear(next_mfk_due.getFullYear() + 2);
    }
    const monthsSinceLast = last_mfk_date ? (new Date() - new Date(last_mfk_date)) / (1000 * 60 * 60 * 24 * 30) : 0;
    let status = "no_data";

    if (last_mfk_date) {
        if (monthsSinceLast <= 21) status = "valid";
        else if (monthsSinceLast <= 24) status = "due_soon";
        else status = "overdue";
    }
    await db.query(`UPDATE tbl_cars SET mfk_status = ?, next_mfk_due = ? WHERE id = ? AND mfk_status_override IS NULL`, [status, next_mfk_due, vehicleId]);
    return { status, next_mfk_due };
};

export const addIdFilter = (column, value, sqlObj) => {
    const ids = value.split(',').map(v => Number(v)).filter(Boolean);
    if (ids.length) {
        sqlObj.sql += ` AND ${column} IN (${ids.map(() => '?').join(',')})`;
        sqlObj.params.push(...ids);
    }
};

export const buildMfk = (car) => {
  if (!car.last_mfk_date || !car.next_mfk_due) {
    return {
      status: "no_data",
      lastDate: null,
      nextDue: null
    };
  }

  const today = new Date();
  const nextDue = new Date(car.next_mfk_due);

  return {
    status: nextDue >= today ? "valid" : "expired",
    lastDate: car.last_mfk_date,
    nextDue: car.next_mfk_due
  };
};

export const buildFirstRegistrationDateFromMonthYear = (arg1 = {}, arg2) => {
  let registration_month, registration_year, first_registration_date;
  if (typeof arg1 === 'object' && arg1 !== null) {
    ({ registration_month, registration_year, first_registration_date } = arg1);
  } else {
    registration_month = arg1;
    registration_year = arg2;
  }

  if (first_registration_date) return first_registration_date;

  const hasMonth = registration_month !== undefined && registration_month !== null && registration_month !== "";
  const hasYear = registration_year !== undefined && registration_year !== null && registration_year !== "";

  if (!hasMonth && !hasYear) return undefined;
  if (hasMonth !== hasYear) return null; // incomplete pair

  const month = Number(registration_month);
  const year = Number(registration_year);
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(year) || year < 1900 || year > currentYear) return null;

  return `${year}-${String(month).padStart(2, "0")}-01`;
};

// WRITE helper (use in listCar before data object)
export const normalizeArrayField = (value) => {
  if (value === undefined || value === null || value === "") return null;

  if (Array.isArray(value)) {
    return JSON.stringify(value.map(v => String(v).trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    const raw = value.trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map(v => String(v).trim()).filter(Boolean));
      }
    } catch (_) {}
    return JSON.stringify(raw.split(",").map(v => v.trim()).filter(Boolean));
  }

  return JSON.stringify([String(value).trim()].filter(Boolean));
};

export const parseArrayField = (val, fallback = []) => {
  if (val === undefined || val === null || val === "") return fallback;
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    const raw = val.trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
    } catch (_) {}
    return raw.split(",").map(v => v.trim()).filter(Boolean);
  }
  return fallback;
};

export const parseJsonObjectSafe = (value) => {
  if (!value || typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (_) { }
  return {};
};

export const parseFacetedInput = (value) => {
  if (value === null || value === undefined) return {};
  if (typeof value === "string") return parseJsonObjectSafe(value);
  if (typeof value === "object" && !Array.isArray(value)) return value;
  return {};
};

export const parseSelectedIds = (value) => {
  if (value === null || value === undefined || value === "") return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? [value] : [];
  }

  return String(value)
    .split(",")
    .map((item) => Number(String(item).trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

export const parseSelectedRange = (selectedIdsValue, fallbackMin = null, fallbackMax = null) => {
  let min = null;
  let max = null;
  let hasSelection = false;

  if (selectedIdsValue !== null && selectedIdsValue !== undefined && selectedIdsValue !== "") {
    const rawParts = String(selectedIdsValue).split(",").map((item) => item.trim()).filter(Boolean);
    if (rawParts.length >= 2) {
      const parsedMin = Number(rawParts[0]);
      const parsedMax = Number(rawParts[1]);

      if (Number.isFinite(parsedMin) && Number.isFinite(parsedMax)) {
        min = parsedMin;
        max = parsedMax;
        hasSelection = true;
      }
    }
  }

  if (!hasSelection) {
    const parsedFallbackMin = fallbackMin === null || fallbackMin === undefined || fallbackMin === ""
      ? null
      : Number(fallbackMin);
    const parsedFallbackMax = fallbackMax === null || fallbackMax === undefined || fallbackMax === ""
      ? null
      : Number(fallbackMax);

    if (Number.isFinite(parsedFallbackMin) && Number.isFinite(parsedFallbackMax)) {
      min = parsedFallbackMin;
      max = parsedFallbackMax;
      hasSelection = true;
    }
  }

  if (hasSelection && min > max) {
    const swapValue = min;
    min = max;
    max = swapValue;
  }

  return { min, max, hasSelection };
};

export const hasActiveFiltersInQuery = (req) =>
  req?.query?.active_filters !== undefined || req?.query?.applied_filters !== undefined;

export const toTimeHHMM = (timeStr) => {
  if (!timeStr) return null;
  const str = String(timeStr).trim();
  if (/^\d{2}:\d{2}/.test(str)) return str.substring(0, 5);
  return str;
};

export const normalizeOpeningTimes = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    ...row,
    open_time: toTimeHHMM(row.open_time),
    close_time: toTimeHHMM(row.close_time)
  }));
};

export const stripHtml = (html) => {
  if (!html || typeof html !== "string") return html || "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/p>|<\/div>|<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

export { normalizeFacetedFilters };

// Register helpers on global scope for backward compatibility with older controllers
if (typeof global !== "undefined") {
  global.parseFacetedInput = parseFacetedInput;
  global.parseSelectedRange = parseSelectedRange;
  global.parseSelectedIds = parseSelectedIds;
  global.hasActiveFiltersInQuery = hasActiveFiltersInQuery;
  global.toTimeHHMM = toTimeHHMM;
  global.normalizeOpeningTimes = normalizeOpeningTimes;
  global.normalizeFacetedFilters = normalizeFacetedFilters;
  global.stripHtml = stripHtml;
}
