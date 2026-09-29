import fs from 'fs/promises';
import { baseurl } from '../../config/path.js';
import { detectText } from '../../services/rekognitionService.js';
import {
    findCarByIdAndUser,
    getUserActivePlans,
    getUserTotalSlots,
    countUserCars,
    insertSellerCars,
    updateSellerCars,
    replaceCarLeasingByCarId,
    clearCarLeasingByCarId,
    replaceCarContactByCarId,
    clearCarContactByCarId,
    addCarImagesByCarId,
    replaceCarFeatures,
    normalizeFeatureIds
} from '../../models/user.model.js';
import { sendCarListedNotification } from '../../services/notification.service.js';
import { notifyListingEvent, notifyMatchingSearchUsers, notifyFavoritedCarUsers } from '../../services/notificationDispatchers.js';
import { handleError, handleSuccess, getRequestLanguage } from '../../utils/responseHandler.js';
import { getMessage, hasExplicitContent, buildFirstRegistrationDateFromMonthYear } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const listCar = async (req, res) => {
    const LISTING_STEP = {
        MAKE_MODEL: 1,
        VEHICLE: 2,
        LEASING: 3,
        CONTACT: 4,
        MEDIA: 5,
        PREVIEW: 6
    };

    try {
        const user_id = req.user.id;
        const lang = getRequestLanguage(req);

        const toNumber = (val) => {
            if (val === undefined || val === null || val === '') return null;
            const num = Number(val);
            return Number.isNaN(num) ? null : num;
        };

        const normalizePowerOutput = (val) => {
            if (val === undefined || val === null) return null;
            const str = String(val).trim();
            return str === "" ? null : str;
        };

        const composePowerOutput = (kwValue, psValue, rawValue = null) => {
            const normalizedRaw = normalizePowerOutput(rawValue);
            if (normalizedRaw) return normalizedRaw;
            const kw = toNumber(kwValue);
            const ps = toNumber(psValue);
            if (kw !== null && ps !== null) return `${kw}(${ps})`;
            if (kw !== null) return String(kw);
            if (ps !== null) return String(ps);
            return null;
        };

        // Safe boolean parser
        const toBool = (val) => {
            const str = String(val ?? "").trim().toLowerCase();
            return Number(val) === true || val === 1 || str === "true" || str === "1" ? 1 : 0;
        };

        const plans = await getUserActivePlans(user_id);
        console.log(plans, user_id);

        if (!plans || plans.length == 0) {
            return handleError(res, 400, getMessage(lang, 'no active plan'));
        }
        const slotLimit = await getUserTotalSlots(user_id);

        const listedCarCount = await countUserCars(user_id);
        if (listedCarCount >= slotLimit) {
            return handleError(res, 400, getMessage(lang, variableTypes.SLOT_LIMIT_EXCEEDED));
        }

        let carReel = null, carImages = [], document = null, reelThumbnails = null;
        let explicitContent;
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
                const description = req.body.description;
                const textDetection = await detectText(description);
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

        const {
            car_id,
            listing_step,
            is_final_submit,
            page,
            fuel_type_id,
            transmission_id,
            drive_type_id,
            body_type_id,
            brandName,
            carModel,
            version,
            registration_month,
            registration_year,
            first_registration_date: firstRegistrationDateInput,

            // phase 2 fields
            carCondition,
            carMileage,
            state_id,
            doors,
            powerOutput,
            power_kw,
            power_ps,
            mfk_warrenty_id,
            warranty_id,
            warranty_type_id,
            warranty_from,
            warranty_to,
            last_mfk_date,
            exterior_color_id,
            interior_color_id,
            is_metallic,
            is_swiss_vehicle,
            is_accident_vehicle,

            // phase 3 
            height_mm,
            width_mm,
            length_mm,
            braked_towing_capacity_kg,
            energy_efficiency,
            type_approval,
            vin_number,
            registration_master_number,

            carFeatures,
            extras,
            additional_title_999,
            description,
            carImages: _carImagesFromBody,
            carReel: _carReelFromBody,
            reelThumbnails: _reelThumbnailsFromBody,
            document: _documentFromBody,

            selling_price,
            new_price,
            isLeasing,
            banking_partner,
            annual_interest_rate,
            residual_value,
            leasing_value,

            first_name,
            last_name,
            street,
            house_number,
            postal_code,
            city,
            po_box,
            country,
            country_code,
            phone_number,
            ...otherData
        } = req.body;

        const rawStep = page ?? listing_step;
        const parsedStep = Number(rawStep);
        const currentStep = Number.isInteger(parsedStep) && parsedStep > 0 ? parsedStep : null;
        const mergedFirstRegistrationDate = buildFirstRegistrationDateFromMonthYear({
            registration_month,
            registration_year,
            first_registration_date: firstRegistrationDateInput
        });

        if (mergedFirstRegistrationDate === null) {
            return handleError(res, 400, "Invalid registration month/year");
        }

        // fixing page 6 issue 
        const resolveOptionalField = (uploadedValue, bodyValue) => {
            if (uploadedValue !== null && uploadedValue !== undefined && uploadedValue !== '') return uploadedValue;
            if (bodyValue !== undefined) return bodyValue; // allows explicit null clear if FE sends null
            return undefined; // skip update => preserve old DB value
        };

        const finalCarReel = resolveOptionalField(carReel, _carReelFromBody);
        const finalDocument = resolveOptionalField(document, _documentFromBody);
        const finalReelThumbnails = resolveOptionalField(reelThumbnails, _reelThumbnailsFromBody);

        const hasWarrantyPayload =
            Object.prototype.hasOwnProperty.call(req.body, "warranty_id") ||
            Object.prototype.hasOwnProperty.call(req.body, "mfk_warrenty_id") ||
            Object.prototype.hasOwnProperty.call(req.body, "mfk_warranty_id");

        const resolvedWarrantyId = toNumber(
            req.body.warranty_id ?? req.body.mfk_warrenty_id ?? req.body.mfk_warranty_id
        );

        const data = {
            // phase 1 fields
            ...otherData,
            ...(currentStep ? { listing_step: currentStep } : {}),
            user_id,
            ...(finalCarReel !== undefined ? { carReel: finalCarReel } : {}),
            ...(finalDocument !== undefined ? { document: finalDocument } : {}),
            ...(finalReelThumbnails !== undefined ? { reelThumbnails: finalReelThumbnails } : {}),
            brandName,
            carModel,
            version,
            ...(mergedFirstRegistrationDate ? { first_registration_date: mergedFirstRegistrationDate } : {}),

            fuel_type_id: fuel_type_id ? Number(fuel_type_id) : null,
            transmission_id: transmission_id ? Number(transmission_id) : null,
            drive_type_id: drive_type_id ? Number(drive_type_id) : null,
            body_type_id: body_type_id ? Number(body_type_id) : null,

            // Phase-2 fields
            carCondition: toNumber(carCondition),
            carMileage,
            state_id: state_id ? Number(state_id) : null,
            doors: toNumber(doors),
            power_kw: toNumber(power_kw),
            power_ps: toNumber(power_ps),
            powerOutput: composePowerOutput(power_kw, power_ps, powerOutput),

            ...(hasWarrantyPayload ? {
                mfk_warrenty_id: resolvedWarrantyId
            } : {}),

            warranty_type_text: warranty_type_id ? Number(warranty_type_id) : null,
            warranty_from,
            warranty_to,
            last_mfk_date,
            exterior_color_id: exterior_color_id === "other" ? null : toNumber(exterior_color_id),
            interior_color_id: interior_color_id === "other" ? null : toNumber(interior_color_id),
            is_metallic: toBool(is_metallic),
            is_swiss_vehicle: toBool(is_swiss_vehicle),
            is_accident_vehicle: toBool(is_accident_vehicle),
            height_mm: toNumber(height_mm),
            width_mm: toNumber(width_mm),
            length_mm: toNumber(length_mm),
            braked_towing_capacity_kg: toNumber(braked_towing_capacity_kg),
            energy_efficiency,
            type_approval,
            vin_number,
            registration_master_number,
            // details view
            carFeatures: req.body.carFeatures !== undefined
                ? JSON.stringify(normalizeFeatureIds(req.body.carFeatures))
                : (Array.isArray(carFeatures) ? JSON.stringify(normalizeFeatureIds(carFeatures)) : carFeatures),
            extras: Array.isArray(extras) ? JSON.stringify(extras) : extras,
            additional_title_999,
            description,

            selling_price: toNumber(selling_price),
            new_price: toNumber(new_price),

            isLeasing: toBool(isLeasing),
        };

        if (currentStep === LISTING_STEP.PREVIEW && !car_id) {
            return handleError(res, 400, "car_id is required for preview submit");
        }
        const shouldPublish =
            currentStep === LISTING_STEP.PREVIEW &&
            toBool(is_final_submit) === 1;

        if (shouldPublish) {
            data.listing_status = "published";
        }

        console.log(data);

        let car_id_final;

        if (!car_id) {
            const result = await insertSellerCars({ ...data, listing_step: currentStep || 1 });
            car_id_final = result.insertId;
        } else {
            const [existingCar] = await findCarByIdAndUser(car_id, user_id);
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            await updateSellerCars(cleanData, car_id);
            car_id_final = car_id;

            if (existingCar) {
                const oldPrice = Number(existingCar.selling_price ?? existingCar.totalPrice ?? 0);
                const newPrice = data.selling_price !== undefined ? Number(data.selling_price) : undefined;
                const carName = [existingCar.selectYear, existingCar.brandName, existingCar.carModel].filter(Boolean).join(' ') || 'Vehicle';
                if (newPrice !== undefined && oldPrice > 0 && newPrice < oldPrice) {
                    notifyFavoritedCarUsers({ carId: car_id, event: 'price_reduced', oldPrice, newPrice, carName, excludeUserId: user_id }).catch(e => console.error('Notify price reduced error in listCar:', e));
                }
            }
        }

        const final_car_id = car_id_final;

        if (req.body.carFeatures !== undefined) {
            await replaceCarFeatures(final_car_id, req.body.carFeatures);
        } else if (req.body.features !== undefined) {
            await replaceCarFeatures(final_car_id, req.body.features);
        }

        // leasing page 3
        if (currentStep === LISTING_STEP.LEASING) {
            if (toBool(isLeasing) === 1) {
                await replaceCarLeasingByCarId(final_car_id, {
                    banking_partner: banking_partner ?? null,
                    interest_rate: annual_interest_rate ?? null,
                    residual_percentage: residual_value ?? null,
                    monthly_price: leasing_value ?? null
                });
            } else {
                await clearCarLeasingByCarId(final_car_id);
            }
        }

        // contact page 4
        if (currentStep === LISTING_STEP.CONTACT) {
            const contactPayload = {
                first_name: first_name ?? null,
                last_name: last_name ?? null,
                street: street ?? null,
                house_number: house_number ?? null,
                postal_code: postal_code ?? null,
                city: city ?? null,
                po_box: po_box ?? null,
                country: country ?? null,
                country_code: country_code ?? null,
                phone_number: phone_number ?? null
            };

            const hasContactData = Object.values(contactPayload).some(
                (v) => v !== null && String(v).trim() !== ""
            );

            if (hasContactData) {
                await replaceCarContactByCarId(final_car_id, contactPayload);
            } else {
                await clearCarContactByCarId(final_car_id);
            }
        }

        // media page 5
        if (currentStep === LISTING_STEP.MEDIA && carImages.length > 0) {
            await Promise.all(carImages.map((img) => addCarImagesByCarId(img, final_car_id)));
        }

        if (shouldPublish) {
            try {
                await sendCarListedNotification({
                    carId: final_car_id,
                    senderId: user_id,
                });
                const [fullCar] = await findCarByIdAndUser(final_car_id, user_id);
                const carRecord = fullCar || { id: final_car_id, ...data };
                const carName = [carRecord.carYear, carRecord.brandName, carRecord.modelName].filter(Boolean).join(' ') || 'Vehicle';
                await notifyListingEvent({
                    sellerId: user_id,
                    carId: final_car_id,
                    event: 'published',
                    carName
                });
                await notifyMatchingSearchUsers(carRecord);
            } catch (notifErr) {
                console.error("Listing publish notification error in listCar:", notifErr);
            }
        }

        return handleSuccess(res, 200, "Car created successfully", {
            car_id: final_car_id,
            page: currentStep || 1,
        });

    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Internal Server Error");
    }
};
