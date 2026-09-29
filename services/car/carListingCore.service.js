import path from 'path';
import fs from 'fs/promises';
import { baseurl } from '../../config/path.js';
import { detectText } from '../rekognitionService.js';
import { sendCarListedNotification } from '../notification.service.js';
import { notifyListingEvent, notifyMatchingSearchUsers } from '../notificationDispatchers.js';
import { fetchUsersById, getUserActivePlans, getUserTotalSlots, countUserCars, insertSellerCars, updateSellerCars, replaceCarLeasingByCarId, clearCarLeasingByCarId, replaceCarContactByCarId, addCarImagesByCarId, replaceCarFeatures } from '../../models/user.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage, hasExplicitContent } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { buildCarPayload } from './carPayloadBuilder.js';

export const handleListingCar = async (req, res, platform = 'web') => {
    try {
        const user_id = req.user.id;
        const lang = 'en';

        const user = await fetchUsersById(user_id);
        const plans = await getUserActivePlans(user_id);

        if (!plans || plans.length === 0) {
            return handleError(res, 400, getMessage(lang, 'no active plan'));
        }
        const slotLimit = await getUserTotalSlots(user_id);
        const listedCarCount = await countUserCars(user_id);

        if (listedCarCount >= slotLimit) {
            return handleError(res, 400, getMessage(lang, variableTypes.SLOT_LIMIT_EXCEEDED));
        }

        let carReel = null, carImages = [], document = null, reelThumbnails = null;
        let explicitContent = false;

        if (req.files) {
            if (req.files.carImages?.length) {
                for (const image of req.files.carImages) {
                    const imageBuffer = await fs.readFile(image.path);
                    explicitContent = await hasExplicitContent(imageBuffer);
                    if (explicitContent) {
                        return handleError(res, 400, getMessage(lang, "Image contains explicit content that violates our policy"));
                    }
                }
            }

            if (req.files.reelThumbnails?.length) {
                const thumbnail = req.files.reelThumbnails[0];
                const thumbnailBuffer = await fs.readFile(thumbnail.path);
                explicitContent = await hasExplicitContent(thumbnailBuffer);
                if (explicitContent) {
                    return handleError(res, 400, getMessage(lang, "Video thumbnail contains explicit content that violates our policy"));
                }
            }

            if (req.body.description) {
                const textDetection = await detectText(req.body.description);
                if (textDetection.inappropriate) {
                    return handleError(res, 400, getMessage(lang, "Description contains inappropriate content that violates our policy"));
                }
            }

            if (req.files.carReel?.length) {
                carReel = `${baseurl}/profile/${req.files.carReel[0].filename}`;
                reelThumbnails = req.files.reelThumbnails ? `${baseurl}/profile/${req.files.reelThumbnails[0].filename}` : null;
            }

            if (req.files.carImages?.length) {
                carImages = req.files.carImages.map(file => `${baseurl}/profile/${file.filename}`);
            }

            if (req.files.document?.length) {
                document = `${baseurl}/profile/${req.files.document[0].filename}`;
            }
        }

        const payload = buildCarPayload(req.body, { carReel, reelThumbnails, document }, user_id);
        const { car_id, is_draft, page } = payload;

        let resultCarId = car_id;

        if (car_id) {
            // Update existing car
            const updateData = { ...payload };
            delete updateData.car_id;
            delete updateData.user_id;

            await updateSellerCars(car_id, user_id, updateData);

            if (carImages.length > 0) {
                await addCarImagesByCarId(car_id, carImages);
            }
        } else {
            // Insert new car
            const insertResult = await insertSellerCars(payload);
            resultCarId = insertResult.insertId;

            if (carImages.length > 0) {
                await addCarImagesByCarId(resultCarId, carImages);
            }
        }

        if (req.body.carFeatures !== undefined) {
            await replaceCarFeatures(resultCarId, req.body.carFeatures);
        } else if (req.body.features !== undefined) {
            await replaceCarFeatures(resultCarId, req.body.features);
        }

        // Handle Leasing
        if (req.body.is_leasing_available !== undefined || req.body.leasing_data) {
            if (payload.is_leasing_available || req.body.leasing_data) {
                await replaceCarLeasingByCarId(resultCarId, req.body.leasing_data || req.body);
            } else {
                await clearCarLeasingByCarId(resultCarId);
            }
        }

        // Handle Contact
        if (req.body.contact_name || req.body.contact_phone || req.body.contact_email) {
            await replaceCarContactByCarId(resultCarId, req.body);
        }

        // Notification if published
        if (!is_draft) {
            try {
                await sendCarListedNotification({ carId: resultCarId, senderId: user_id });
                const carName = [payload.carYear, payload.brandName, payload.carModel].filter(Boolean).join(' ') || 'Vehicle';
                await notifyListingEvent({
                    sellerId: user_id,
                    carId: resultCarId,
                    event: 'published',
                    carName
                });
                await notifyMatchingSearchUsers({ id: resultCarId, ...payload });
            } catch (err) {
                console.error("Notification Error:", err.message);
            }
        }

        return handleSuccess(
            res,
            car_id ? 200 : 201,
            car_id ? "Car updated successfully" : (is_draft ? "Car draft saved successfully" : "Car created successfully"),
            { car_id: resultCarId, is_draft }
        );

    } catch (error) {
        console.error("List Car Error:", error);
        return handleError(res, 500, error.message || "Internal server error");
    }
};
