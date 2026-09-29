import { sendNotificationToUser } from '../../services/notification.service.js';
import { modelCheckCarExists, modelAddRecentlyViewed, modelGetRecentlyViewed, getSellerEmailForInquiryModel } from '../../models/user.model.js';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { sendInqueryEmail } from '../../utils/emailService.js';
import { getMessage } from '../../utils/user_helper.js';

export const addRecentlyViewed = async (req, res) => {
    const { id: userId } = req.user;
    const carId = req.body.carId || req.body.car_id;

    if (!carId) {
        return handleError(res, 400, "carId is required");
    }

    const carExists = await modelCheckCarExists(carId);
    if (!carExists) {
        return handleError(res, 404, "Car does not exist");
    }

    const result = await modelAddRecentlyViewed(userId, carId);

    if (result.action === "updated") {
        return handleSuccess(res, 200, "Car already viewed (timestamp refreshed)");
    }

    return handleSuccess(res, 200, "Car added to recently viewed");
};

export const getRecentlyViewed = async (req, res) => {
    const { id: userId } = req.user;

    const recentlyViewed = await modelGetRecentlyViewed(userId);

    if (!recentlyViewed.length) {
        return handleSuccess(res, 200, "No recently viewed cars found", []);
    }

    const response = recentlyViewed.map(item => ({
        car_id: item.car_id,
        //title: `${item.brandName} ${item.carModel}`,
        //price: item.totalPrice,
        car_image: item.car_image,
        user_name: item.user_name,
        user_profile_image: item.user_profile_image
    }));

    return handleSuccess(
        res,
        200,
        "Recently viewed cars fetched",
        response
    );
};

export const sendCarInquiry = async (req, res) => {
    try {
        const buyer_user_id = req.user?.id || null;
        const language = req.user?.language || 'en';
        const {
            seller_id,
            car_id,
            full_name,
            email,
            phone_number,
            inquiry_type_text, // FE sends combined text for multi-select
            message
        } = req.body;

        if (!seller_id || !car_id || !full_name || !email || !phone_number || !inquiry_type_text) {
            return handleError(res, 400, "seller_id, car_id, full_name, email, phone_number and inquiry_type_text are required");
        }

        if (buyer_user_id && Number(buyer_user_id) === Number(seller_id)) {
            return handleError(res, 400, "You cannot send inquiry to your own listing");
        }

        const rows = await getSellerEmailForInquiryModel({ seller_id, car_id });
        const seller = rows?.[0];

        if (!seller || !seller.seller_email) {
            return handleError(res, 404, "Seller email not found for this car");
        }

        const publicBaseUrl =
            process.env.PUBLIC_BASE_URL ||
            `${req.protocol}://${req.get("host")}`;

        const toAbsoluteAssetUrl = (raw, fallback) => {
            const fallbackUrl = fallback || `${publicBaseUrl}/img/fav.png`;
            if (raw === null || raw === undefined) return fallbackUrl;
            const value = String(raw).trim();
            if (!value) return fallbackUrl;
            if (value.startsWith("data:")) return value;
            if (/^https?:\/\//i.test(value)) return value;
            if (value.startsWith("/")) return `${publicBaseUrl}${value}`;
            if (value.startsWith("profile/")) return `${publicBaseUrl}/${value}`;
            return `${publicBaseUrl}/profile/${value}`;
        };

        const resolveExistingFile = async (candidates = []) => {
            for (const filePath of candidates) {
                try {
                    await fs.access(filePath);
                    return filePath;
                } catch {
                    // continue to next candidate
                }
            }
            return null;
        };

        const findLogoInDirectory = async (directoryPath) => {
            try {
                const files = await fs.readdir(directoryPath, { withFileTypes: true });
                const logoFile = files.find(
                    (entry) =>
                        entry.isFile() &&
                        /logo/i.test(entry.name) &&
                        /\.(png|jpg|jpeg|webp)$/i.test(entry.name)
                );
                return logoFile ? path.join(directoryPath, logoFile.name) : null;
            } catch {
                return null;
            }
        };

        const templatesDir = path.join(process.cwd(), "templates");
        const publicImgPath = path.join(process.cwd(), "public", "img", "fav.png");

        let logoPath = await resolveExistingFile([
            path.join(templatesDir, "logo.png"),
            path.join(templatesDir, "logo.jpg"),
            path.join(templatesDir, "carzone-logo.png"),
            path.join(templatesDir, "carzone-logo.jpg"),
            path.join(templatesDir, "car_zone_logo.jpg"),
            publicImgPath
        ]);

        if (!logoPath) {
            logoPath = await findLogoInDirectory(templatesDir);
        }

        const templatePath = await resolveExistingFile([
            path.join(templatesDir, "car_inquiry_mail.hbs")
        ]);

        if (!templatePath) {
            return handleError(res, 500, "Mail template not found");
        }

        const attachments = [];
        const logoCid = "carzone-logo@carzone";
        const publicLogoUrl = process.env.PUBLIC_LOGO_URL || `${publicBaseUrl}/img/fav.png`;
        let logoUrl = publicLogoUrl;

        if (logoPath) {
            const logoExtension = path.extname(logoPath).toLowerCase();
            const logoMimeType =
                logoExtension === ".png"
                    ? "image/png"
                    : logoExtension === ".webp"
                        ? "image/webp"
                        : "image/jpeg";

            logoUrl = `cid:${logoCid}`;
            attachments.push({
                filename: path.basename(logoPath),
                content: await fs.readFile(logoPath),
                cid: logoCid,
                contentType: logoMimeType,
                contentDisposition: "inline"
            });
        }

        const carName = `${seller.brandName || ""} ${seller.carModel || ""}`.trim() || "N/A";
        const subject = "Mail for Inquiry";
        const templateSource = await fs.readFile(templatePath, "utf8");
        const template = handlebars.compile(templateSource);

        let imageFileName = null;
        if (seller.car_image_url && seller.car_image_url.includes("/profile/")) {
            imageFileName = seller.car_image_url.split("/profile/")[1];
        }

        const carImageCid = "car-image";
        if (imageFileName) {
            const imagePath = path.join(
                process.cwd(),
                "public",
                "profile",
                imageFileName
            );
            try {
                await fs.access(imagePath);
                attachments.push({
                    filename: path.basename(imagePath),
                    content: await fs.readFile(imagePath),
                    cid: carImageCid,
                    contentType: "image/jpeg",
                    contentDisposition: "inline"
                });
            } catch {
                // file does not exist, ignore attachment
            }
        }

        const html = template({
            seller_name: seller.seller_name || "there",
            logo_url: logoUrl,
            car_name: carName,
            car_price: seller.car_price || "N/A",
            car_image_url: seller.car_image_url || `cid:${carImageCid}`,
            buyer_name: full_name,
            buyer_email: email,
            buyer_phone: phone_number,
            inquiry_type: inquiry_type_text,
            buyer_message: message || "N/A",
            year: new Date().getFullYear()
        });

        try {
            await sendInqueryEmail({
                from: email,
                to: seller.seller_email,
                subject,
                html,
                replyTo: email,
                attachments
            });
        } catch (mailErr) {
            console.error("sendInqueryEmail warning:", mailErr.message);
        }

        // =====================================================
        // SEND NOTIFICATION TO SELLER
        // =====================================================

        try {
            await sendNotificationToUser(seller_id, {
                titleKey: "NEW_CAR_INQUIRY",
                bodyKey: "NEW_CAR_INQUIRY_BODY",
                category: "vehicle_inquiries",

                params: {
                    name: full_name,
                    car: carName
                },

                data: {
                    type: "car_inquiry",
                    notification_type: "car_inquiry",
                    id: String(car_id),
                    action: "new_inquiry",

                    car_id: String(car_id),
                    buyer_id: buyer_user_id ? String(buyer_user_id) : "",

                    // Buyer is the sender
                    sendFrom: buyer_user_id,
                    sendTo: seller_id
                }
            });

        } catch (notificationError) {
            console.error(
                "Car inquiry notification error:",
                notificationError
            );
        }

         return handleSuccess(res, 200, getMessage(language, variableTypes.Inquiry_sent_successfully));
    } catch (error) {
        console.error("sendCarInquiry error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

//--------------------------------- new listing phase ------------------------
