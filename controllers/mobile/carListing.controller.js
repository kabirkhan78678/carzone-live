import fs from 'fs/promises';
import { baseurl } from '../../config/path.js';
import { detectText } from '../../services/rekognitionService.js';
import { sendCarListedNotification } from '../../services/notification.service.js';
import { notifyListingEvent, notifyMatchingSearchUsers, notifyFavoritedCarUsers } from '../../services/notificationDispatchers.js';
import {
    findCarByIdAndUser,
    fetchUsersById,
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
    deleteCarImagesByCarId,
    replaceCarFeatures,
    normalizeFeatureIds
} from '../../models/user.model.js';
import { handleError, handleSuccess, getRequestLanguage } from '../../utils/responseHandler.js';
import { getMessage, hasExplicitContent, buildFirstRegistrationDateFromMonthYear } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const listCarmobile = async (req, res) => {
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
            return str === '' ? null : str;
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

        const toBool = (val) => {
            const str = String(val ?? "").trim().toLowerCase();
            return Number(val) === true || val === 1 || str === "true" || str === "1" ? 1 : 0;
        };

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
            carCondition,
            carMileage,
            doors,
            seats,
            cylinders,
            consumption,
            emptyWeight,
            totalWeight,
            gears,
            powerOutput,
            power_kw,
            power_ps,
            state_id,
            mfk_status_id,
            mfk_warrenty_id,
            warranty_id,
            warranty_type_id,
            warranty_from,
            warranty_to,
            warranty_number_of_months,
            warranty_kilometer,
            warranty_description,
            last_mfk_date,
            exterior_color_id,
            interior_color_id,
            is_metallic,
            is_swiss_vehicle,
            is_accident_vehicle,
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
            company_name,
            company_address,
            ...otherData
        } = req.body;

        const rawStep = page ?? listing_step;
        const parsedStep = Number(rawStep);
        const currentStep = Number.isInteger(parsedStep) && parsedStep > 0 ? parsedStep : null;

        const resolveOptionalField = (uploadedValue, bodyValue) => {
            if (uploadedValue !== null && uploadedValue !== undefined && uploadedValue !== '') return uploadedValue;
            if (bodyValue !== undefined) return bodyValue;
            return undefined;
        };

        const finalCarReel = resolveOptionalField(carReel, _carReelFromBody);
        const finalDocument = resolveOptionalField(document, _documentFromBody);
        const finalReelThumbnails = resolveOptionalField(reelThumbnails, _reelThumbnailsFromBody);

        const hasKey = (key) => Object.prototype.hasOwnProperty.call(req.body, key);
        const isBlankString = (value) => typeof value === "string" && value.trim() === "";
        const isNullLike = (value) =>
            value === null || (typeof value === "string" && value.trim().toLowerCase() === "null");

        const setIfPresent = (target, key, transform = (v) => v, sourceKey = key) => {
            if (!hasKey(sourceKey)) return;
            const rawValue = req.body[sourceKey];

            if (isNullLike(rawValue)) {
                target[key] = null;
                return;
            }

            if (isBlankString(rawValue)) return;

            target[key] = transform(rawValue);
        };

        const data = {
            ...otherData,
            ...(currentStep ? { listing_step: currentStep } : {}),
            user_id
        };

        if (finalCarReel !== undefined) data.carReel = finalCarReel;
        if (finalDocument !== undefined) data.document = finalDocument;
        if (finalReelThumbnails !== undefined) data.reelThumbnails = finalReelThumbnails;

        const touchedRegistration =
            hasKey("registration_month") ||
            hasKey("registration_year") ||
            hasKey("first_registration_date");

        if (touchedRegistration) {
            const mergedFirstRegistrationDate = buildFirstRegistrationDateFromMonthYear({
                registration_month: req.body.registration_month,
                registration_year: req.body.registration_year,
                first_registration_date: req.body.first_registration_date
            });

            if (mergedFirstRegistrationDate === null) {
                return handleError(res, 400, "Invalid registration month/year");
            }

            if (mergedFirstRegistrationDate !== undefined) {
                data.first_registration_date = mergedFirstRegistrationDate;
            }
        }

        // page 1 / common
        setIfPresent(data, "brandName");
        setIfPresent(data, "carModel");
        setIfPresent(data, "version");
        setIfPresent(data, "fuel_type_id", (v) => (v ? Number(v) : null));
        setIfPresent(data, "transmission_id", (v) => (v ? Number(v) : null));
        setIfPresent(data, "drive_type_id", (v) => (v ? Number(v) : null));
        setIfPresent(data, "body_type_id", (v) => (v ? Number(v) : null));

        // page 2
        setIfPresent(data, "carCondition", (v) => toNumber(v));
        setIfPresent(data, "carMileage", (v) => v);
        setIfPresent(data, "doors", (v) => toNumber(v));
        setIfPresent(data, "power_kw", (v) => toNumber(v));
        setIfPresent(data, "power_ps", (v) => toNumber(v));
        setIfPresent(data, "powerOutput", (v) => normalizePowerOutput(v));
        setIfPresent(data, "state_id", (v) => (v ? Number(v) : null));
        setIfPresent(data, "mfk_status_id", (v) => toNumber(v));
        setIfPresent(data, "sittingCapacity", (v) => toNumber(v), "seats");
        setIfPresent(data, "cylinders", (v) => toNumber(v));
        setIfPresent(data, "consumption", (v) => toNumber(v));
        setIfPresent(data, "empty_weight", (v) => toNumber(v), "emptyWeight");
        setIfPresent(data, "total_weight", (v) => toNumber(v), "totalWeight");
        setIfPresent(data, "gears", (v) => toNumber(v));

        if (data.powerOutput === undefined && (data.power_kw !== undefined || data.power_ps !== undefined)) {
            data.powerOutput = composePowerOutput(data.power_kw, data.power_ps);
        }

        const hasWarrantyPayload =
            hasKey("warranty_id") ||
            hasKey("mfk_warrenty_id") ||
            hasKey("mfk_warranty_id");

        if (hasWarrantyPayload) {
            const rawWarranty = req.body.warranty_id ?? req.body.mfk_warrenty_id ?? req.body.mfk_warranty_id;
            if (isNullLike(rawWarranty)) {
                data.mfk_warrenty_id = null;
            } else if (!isBlankString(rawWarranty)) {
                data.mfk_warrenty_id = toNumber(rawWarranty);
            }
        }

        const convertDate = (date) => {
            if (!date) return null;
            const [day, month, year] = date.split("-");
            if (!day || !month || !year) return date;
            return `${year}-${month}-${day}`;
        };

        setIfPresent(data, "warranty_type_text", (v) => (v ? Number(v) : null), "warranty_type_id");
        setIfPresent(data, "warranty_from", convertDate);
        setIfPresent(data, "warranty_to", convertDate);
        setIfPresent(data, "warranty_number_of_months", (v) => toNumber(v));
        setIfPresent(data, "warranty_kilometer", (v) => String(v).trim());
        setIfPresent(data, "warranty_description", (v) => String(v).trim());
        setIfPresent(data, "last_mfk_date", convertDate);
        setIfPresent(data, "exterior_color_id", (v) => (v === "other" ? null : toNumber(v)));
        setIfPresent(data, "interior_color_id", (v) => (v === "other" ? null : toNumber(v)));

        const normalizeColorText = (v) => String(v).trim();
        setIfPresent(data, "exterior_color_custom", normalizeColorText);
        setIfPresent(data, "interior_color_custom", normalizeColorText);

        const applyColorPreference = (idKey, customKey) => {
            const idTouched = hasKey(idKey);
            const customTouched = hasKey(customKey);
            if (!idTouched && !customTouched) return;

            const rawId = idTouched ? req.body[idKey] : undefined;
            const rawCustom = customTouched ? req.body[customKey] : undefined;

            const customHasText =
                customTouched && !isNullLike(rawCustom) && !isBlankString(rawCustom);

            if (customHasText) {
                data[customKey] = normalizeColorText(rawCustom);
                data[idKey] = null;
                return;
            }

            if (idTouched && !isNullLike(rawId) && !isBlankString(rawId)) {
                const parsedId = rawId === "other" ? null : toNumber(rawId);
                if (parsedId !== null) {
                    data[customKey] = null;
                } else if (rawId === "other" && customTouched && (isNullLike(rawCustom) || isBlankString(rawCustom))) {
                    data[customKey] = null;
                }
            }
        };

        applyColorPreference("exterior_color_id", "exterior_color_custom");
        applyColorPreference("interior_color_id", "interior_color_custom");

        setIfPresent(data, "is_metallic", (v) => toBool(v));
        setIfPresent(data, "is_swiss_vehicle", (v) => toBool(v));
        setIfPresent(data, "is_accident_vehicle", (v) => toBool(v));
        setIfPresent(data, "height_mm", (v) => toNumber(v));
        setIfPresent(data, "width_mm", (v) => toNumber(v));
        setIfPresent(data, "length_mm", (v) => toNumber(v));
        setIfPresent(data, "braked_towing_capacity_kg", (v) => toNumber(v));
        setIfPresent(data, "energy_efficiency");
        setIfPresent(data, "type_approval");
        setIfPresent(data, "vin_number");
        setIfPresent(data, "registration_master_number");
        setIfPresent(data, "carFeatures", (v) => JSON.stringify(normalizeFeatureIds(v)));
        setIfPresent(data, "extras", (v) => (Array.isArray(v) ? JSON.stringify(v) : v));
        setIfPresent(data, "additional_title_999");
        setIfPresent(data, "description");

        // page 3
        setIfPresent(data, "selling_price", (v) => toNumber(v));
        setIfPresent(data, "new_price", (v) => toNumber(v));
        setIfPresent(data, "isLeasing", (v) => toBool(v));

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
                const newPrice = (data.selling_price !== undefined && data.selling_price !== null && data.selling_price !== '')
                    ? Number(data.selling_price)
                    : ((data.totalPrice !== undefined && data.totalPrice !== null && data.totalPrice !== '')
                        ? Number(data.totalPrice)
                        : ((req.body.price !== undefined && req.body.price !== null && req.body.price !== '') ? Number(req.body.price) : undefined));
                const carName = [existingCar.selectYear, existingCar.brandName, existingCar.carModel].filter(Boolean).join(' ') || 'Vehicle';
                if (newPrice !== undefined && oldPrice > 0 && newPrice < oldPrice) {
                    notifyFavoritedCarUsers({ carId: car_id, event: 'price_reduced', oldPrice, newPrice, carName, excludeUserId: user_id }).catch(e => console.error('Notify price reduced error in mobile:', e));
                } else {
                    const specFields = ['brandName', 'carModel', 'selectYear', 'carMileage', 'fuel_type_id', 'transmission_id', 'drive_type_id', 'body_type_id', 'exterior_color_id', 'interior_color_id', 'doors', 'sittingCapacity', 'performance_hp', 'power_kw', 'power_ps', 'cubic_capacity', 'description'];
                    const hasSpecChanges = specFields.some(f => data[f] !== undefined && data[f] !== null && String(data[f]).trim() !== '' && String(data[f]) !== String(existingCar[f]));
                    if (hasSpecChanges) {
                        notifyFavoritedCarUsers({ carId: car_id, event: 'updated', carName, excludeUserId: user_id }).catch(e => console.error('Notify updated error in mobile:', e));
                    }
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
        const leasingTouched = [
            "isLeasing",
            "banking_partner",
            "annual_interest_rate",
            "residual_value",
            "leasing_value"
        ].some((k) => hasKey(k));

        if (currentStep === LISTING_STEP.LEASING && leasingTouched) {
            if (toBool(req.body.isLeasing) === 1) {
                await replaceCarLeasingByCarId(final_car_id, {
                    banking_partner: req.body.banking_partner ?? null,
                    interest_rate: req.body.annual_interest_rate ?? null,
                    residual_percentage: req.body.residual_value ?? null,
                    monthly_price: req.body.leasing_value ?? null
                });
            } else {
                await clearCarLeasingByCarId(final_car_id);
            }
        }

        const contactKeys = [
            "first_name",
            "last_name",
            "street",
            "house_number",
            "postal_code",
            "city",
            "po_box",
            "country",
            "country_code",
            "phone_number"
        ];
        const contactTouched = contactKeys.some((k) => hasKey(k));

        if (currentStep === LISTING_STEP.CONTACT && contactTouched) {
            const contactPayload = {
                first_name: req.body.first_name ?? null,
                last_name: req.body.last_name ?? null,
                street: req.body.street ?? null,
                house_number: req.body.house_number ?? null,
                postal_code: req.body.postal_code ?? null,
                city: req.body.city ?? null,
                po_box: req.body.po_box ?? null,
                country: req.body.country ?? null,
                country_code: req.body.country_code ?? null,
                phone_number: req.body.phone_number ?? null,
                company_name: req.body.company_name ?? null,
                company_address: req.body.company_address ?? null
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

        if (currentStep === LISTING_STEP.MEDIA && req.files?.carImages?.length) {
            await deleteCarImagesByCarId(final_car_id);
            await Promise.all(
                carImages.map((img) => addCarImagesByCarId(img, final_car_id))
            );
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
                console.error("Listing publish notification error in listCarmobile:", notifErr);
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
