import {
    findCarByIdAndUser,
    updateSellerCars,
    replaceCarLeasingByCarId,
    clearCarLeasingByCarId,
    replaceCarContactByCarId,
    addCarImagesByCarId,
    replaceCarFeatures,
    normalizeFeatureIds,
    getUserActivePlans,
    getUserTotalSlots
} from '../../models/user.model.js';
import dayjs from 'dayjs';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { normalizeMySQLDate } from '../../utils/DateConvertor.js';
import { recalcMfk, getMessage, buildFirstRegistrationDateFromMonthYear } from '../../utils/user_helper.js';
import { baseurl } from '../../config/path.js';
import { notifyFavoritedCarUsers } from '../../services/notificationDispatchers.js';
import db from '../../config/db.js';

// Whitelist of valid columns in tbl_cars to prevent any SQL unknown column errors
const VALID_TBL_CARS_COLUMNS = new Set([
    'user_id',
    'carModel',
    'brandName',
    'sittingCapacity',
    'selectYear',
    'carMileage',
    'fuelType',
    'transmission',
    'carColor',
    'engineType',
    'co2Emission',
    'powerOutput',
    'carFeatures',
    'description',
    'totalPrice',
    'vrn',
    'carCondition',
    'location',
    'carReel',
    'document',
    'is_active',
    'reelThumbnails',
    'is_deleted',
    'slot_deleted_at',
    'mfk_status',
    'next_mfk_due',
    'mfk_status_override',
    'first_registration_date',
    'last_mfk_date',
    'body_type',
    'consumption',
    'isLeasing',
    'leasingPrice',
    'fuel_type_id',
    'transmission_id',
    'drive_type_id',
    'body_type_id',
    'exterior_color_id',
    'exterior_color_custom',
    'interior_color_id',
    'interior_color_custom',
    'power_unit_id',
    'vehicle_accident_status_id',
    'state_id',
    'cubic_capacity',
    'cylinders',
    'gears',
    'wltp_range',
    'battery_capacity',
    'total_weight',
    'empty_weight',
    'energy_efficiency',
    'euro_norm',
    'latitude',
    'longitude',
    'doors',
    'mfk_warrenty_id',
    'new_price',
    'selling_price',
    'vin_number',
    'height_mm',
    'width_mm',
    'length_mm',
    'braked_towing_capacity_kg',
    'is_swiss_vehicle',
    'is_accident_vehicle',
    'is_metallic',
    'registration_master_number',
    'additional_title_999',
    'warranty_from',
    'warranty_to',
    'warranty_type_text',
    'quality_seal_id',
    'color_id',
    'version',
    'listing_step',
    'listing_status',
    'extras',
    'feature_id',
    'type_approval',
    'is_fresh_from_service',
    'power_kw',
    'power_ps',
    'mfk_status_id',
    'mfk_date',
    'warranty_number_of_months',
    'warranty_kilometer',
    'warranty_description',
    'last_monthly_reminder_at',
    'draft_reminder_sent',
    'rejection_reason',
    'is_sold'
]);

export const updateCar = async (req, res) => {
    try {
        const user_id = req.user.id;
        let lang = req.user.language || 'en';
        const carId = Number(req.params.carId || req.params.id || req.body.car_id || req.body.carId);

        if (!carId) {
            return handleError(res, 400, "Valid carId is required", lang);
        }

        const [car] = await findCarByIdAndUser(carId, user_id);

        if (!car) {
            return handleError(
                res,
                404,
                getMessage(
                    lang,
                    variableTypes.CAR_NOT_FOUND_OR_UNAUTHORIZED
                )
            );
        }

        let uploadedCarReel = null;
        let uploadedCarImages = [];
        let uploadedDocument = null;
        let uploadedReelThumbnails = null;

        if (req.files) {
            if (req.files.carReel?.length > 0) {
                uploadedCarReel = `${baseurl}/profile/${req.files.carReel[0].filename}`;
            }
            if (req.files.reelThumbnails?.length > 0) {
                uploadedReelThumbnails = `${baseurl}/profile/${req.files.reelThumbnails[0].filename}`;
            }
            if (req.files.carImages?.length > 0) {
                uploadedCarImages = req.files.carImages.map(
                    file => `${baseurl}/profile/${file.filename}`
                );
            }
            if (req.files.document?.length > 0) {
                uploadedDocument = `${baseurl}/profile/${req.files.document[0].filename}`;
            }
        }

        const toNumber = (val) => {
            if (val === undefined || val === null || val === '') return null;
            const num = Number(val);
            return Number.isNaN(num) ? null : num;
        };

        const toBool = (val) => {
            const str = String(val ?? "").trim().toLowerCase();
            return (
                val === true ||
                val === 1 ||
                str === "true" ||
                str === "1"
            ) ? 1 : 0;
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

        const normalizeColorText = (v) => String(v ?? "").trim();
        const resolveColorFields = (colorId, colorCustom) => {
            const customText = normalizeColorText(colorCustom);
            if (customText) {
                return { color_id: null, color_custom: customText };
            }
            const parsedId = colorId === "other" ? null : toNumber(colorId);
            if (parsedId !== null) {
                return { color_id: parsedId, color_custom: null };
            }
            return { color_id: null, color_custom: null };
        };

        const parseQualitySealId = (val) => {
            if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") {
                return null;
            }
            if (typeof val === "number" && !isNaN(val)) {
                return val > 0 ? val : null;
            }
            if (typeof val === "string") {
                const trimmed = val.trim();
                if (/^\d+$/.test(trimmed)) {
                    const num = Number(trimmed);
                    return num > 0 ? num : null;
                }
                try {
                    const parsed = JSON.parse(trimmed);
                    return parseQualitySealId(parsed);
                } catch (_) {
                    return null;
                }
            }
            if (Array.isArray(val)) {
                if (val.length === 0) return null;
                return parseQualitySealId(val[0]);
            }
            if (typeof val === "object") {
                return parseQualitySealId(val.id ?? val.quality_seal_id ?? val.value ?? val.qualitySealId);
            }
            return null;
        };

        // Separate out non-tbl_cars fields
        const {
            // Media fields from body
            carImages: _carImagesFromBody,
            images: _imagesFromBody,
            images_object: _imagesObjectFromBody,
            carReel: _carReelFromBody,
            reelThumbnails: _reelThumbnailsFromBody,
            document: _documentFromBody,

            // Leasing fields (stored in tbl_car_leasing)
            isLeasing,
            banking_partner,
            annual_interest_rate,
            interest_rate,
            residual_value,
            residual_percentage,
            leasing_value,
            monthly_price,
            lease_duration_months,
            km_per_year,
            down_payment,

            // Contact fields (stored in tbl_car_contacts)
            first_name,
            last_name,
            company_name,
            company_address,
            street,
            house_number,
            postal_code,
            city,
            po_box,
            country,
            country_code,
            phone_number,
            contact_latitude,
            contact_longitude,

            // Registration date components
            registration_month,
            registration_year,
            first_registration_date: firstRegistrationDateInput,

            // Features
            carFeatures,
            features,

            // Status / Sold / Step / Action
            is_sold,
            isSold,
            status,
            action,
            listing_status,
            is_final_submit,
            page,
            listing_step,

            // Warranty aliases
            warranty_id,
            mfk_warrenty_id,
            mfk_warranty_id,
            warranty_type_id,
            warranty_type_text,

            // Helper / ignored parameters
            car_id: _bodyCarId,
            carId: _bodyCarId2,
            user_id: _bodyUserId,
            token,
            language: _bodyLanguage,

            // Everything else
            ...rawCarData
        } = req.body;

        // Build first registration date if month/year or input provided
        let mergedFirstRegistrationDate = undefined;
        if (registration_month !== undefined || registration_year !== undefined || firstRegistrationDateInput !== undefined) {
            mergedFirstRegistrationDate = buildFirstRegistrationDateFromMonthYear({
                registration_month,
                registration_year,
                first_registration_date: firstRegistrationDateInput
            });

            if (mergedFirstRegistrationDate === null) {
                return handleError(res, 400, "Invalid registration month/year");
            }
        }

        // Build data object for tbl_cars
        const data = {};

        // Aliases mapping & assignments
        if (rawCarData.brandName !== undefined || rawCarData.brand_name !== undefined) {
            data.brandName = rawCarData.brandName ?? rawCarData.brand_name;
        }
        if (rawCarData.carModel !== undefined || rawCarData.model_id !== undefined) {
            data.carModel = rawCarData.carModel ?? rawCarData.model_id;
        }
        if (rawCarData.version !== undefined) {
            data.version = rawCarData.version;
        }
        if (mergedFirstRegistrationDate !== undefined) {
            data.first_registration_date = mergedFirstRegistrationDate;
        } else if (rawCarData.first_registration_date !== undefined) {
            data.first_registration_date = normalizeMySQLDate(rawCarData.first_registration_date);
        }

        if (rawCarData.fuel_type_id !== undefined || rawCarData.fuel_type !== undefined || rawCarData.fuelType !== undefined) {
            data.fuel_type_id = toNumber(rawCarData.fuel_type_id ?? rawCarData.fuel_type ?? rawCarData.fuelType);
        }
        if (rawCarData.transmission_id !== undefined || rawCarData.transmission !== undefined) {
            data.transmission_id = toNumber(rawCarData.transmission_id ?? rawCarData.transmission);
        }
        if (rawCarData.drive_type_id !== undefined || rawCarData.drive_type !== undefined) {
            data.drive_type_id = toNumber(rawCarData.drive_type_id ?? rawCarData.drive_type);
        }
        if (
            rawCarData.body_type_id !== undefined ||
            rawCarData.body_type !== undefined ||
            rawCarData.bodyType !== undefined ||
            rawCarData.bodyTypeId !== undefined
        ) {
            const rawBodyType = rawCarData.body_type_id ?? rawCarData.bodyTypeId ?? rawCarData.body_type ?? rawCarData.bodyType;
            if (rawBodyType === null || rawBodyType === '') {
                data.body_type_id = null;
                data.body_type = null;
            } else {
                const num = Number(rawBodyType);
                if (!isNaN(num) && String(rawBodyType).trim() !== '') {
                    data.body_type_id = num;
                    const textCandidate = typeof rawCarData.body_type === 'string' && isNaN(Number(rawCarData.body_type))
                        ? rawCarData.body_type.trim()
                        : (typeof rawCarData.bodyType === 'string' && isNaN(Number(rawCarData.bodyType)) ? rawCarData.bodyType.trim() : null);
                    if (textCandidate) {
                        data.body_type = textCandidate;
                    } else {
                        try {
                            const [btTrans] = await db.query(
                                `SELECT label FROM tbl_body_type_translations WHERE body_type_id = ? AND language_code = ? LIMIT 1`,
                                [num, lang || 'en']
                            );
                            if (btTrans?.label) {
                                data.body_type = btTrans.label;
                            } else {
                                const [btCode] = await db.query(`SELECT code FROM tbl_body_types WHERE id = ? LIMIT 1`, [num]);
                                if (btCode?.code && btCode.code !== 'undefined') {
                                    data.body_type = btCode.code;
                                }
                            }
                        } catch (e) {
                            console.error("Error fetching body_type label:", e);
                        }
                    }
                } else if (typeof rawBodyType === 'string') {
                    const strVal = rawBodyType.trim();
                    data.body_type = strVal;
                    try {
                        const [btRow] = await db.query(
                            `SELECT body_type_id FROM tbl_body_type_translations WHERE LOWER(label) = LOWER(?) LIMIT 1`,
                            [strVal]
                        );
                        if (btRow?.body_type_id) {
                            data.body_type_id = Number(btRow.body_type_id);
                        } else {
                            const [btCodeRow] = await db.query(
                                `SELECT id FROM tbl_body_types WHERE LOWER(code) = LOWER(?) LIMIT 1`,
                                [strVal]
                            );
                            if (btCodeRow?.id) {
                                data.body_type_id = Number(btCodeRow.id);
                            }
                        }
                    } catch (e) {
                        console.error("Error looking up body_type_id:", e);
                    }
                }
            }
        }

        if (rawCarData.carCondition !== undefined || rawCarData.condition !== undefined) {
            data.carCondition = toNumber(rawCarData.carCondition ?? rawCarData.condition);
        }
        if (rawCarData.carMileage !== undefined || rawCarData.mileage !== undefined || rawCarData.km !== undefined) {
            const mileageVal = rawCarData.carMileage ?? rawCarData.mileage ?? rawCarData.km;
            data.carMileage = mileageVal !== null && mileageVal !== undefined ? String(mileageVal).trim() : null;
        }
        if (rawCarData.sittingCapacity !== undefined || rawCarData.seats !== undefined || rawCarData.seat !== undefined) {
            data.sittingCapacity = toNumber(rawCarData.sittingCapacity ?? rawCarData.seats ?? rawCarData.seat);
        }
        if (rawCarData.doors !== undefined) {
            data.doors = toNumber(rawCarData.doors);
        }
        if (rawCarData.cylinders !== undefined) {
            data.cylinders = toNumber(rawCarData.cylinders);
        }
        if (rawCarData.consumption !== undefined) {
            data.consumption = rawCarData.consumption !== null ? String(rawCarData.consumption).trim() : null;
        }
        if (rawCarData.empty_weight !== undefined || rawCarData.emptyWeight !== undefined) {
            data.empty_weight = toNumber(rawCarData.empty_weight ?? rawCarData.emptyWeight);
        }
        if (rawCarData.total_weight !== undefined || rawCarData.totalWeight !== undefined) {
            data.total_weight = toNumber(rawCarData.total_weight ?? rawCarData.totalWeight);
        }
        if (rawCarData.gears !== undefined) {
            data.gears = toNumber(rawCarData.gears);
        }

        if (rawCarData.power_kw !== undefined) {
            data.power_kw = toNumber(rawCarData.power_kw);
        }
        if (rawCarData.power_ps !== undefined) {
            data.power_ps = toNumber(rawCarData.power_ps);
        }
        if (rawCarData.powerOutput !== undefined || rawCarData.power_kw !== undefined || rawCarData.power_ps !== undefined) {
            data.powerOutput = composePowerOutput(
                rawCarData.power_kw ?? car.power_kw,
                rawCarData.power_ps ?? car.power_ps,
                rawCarData.powerOutput
            );
        }

        if (rawCarData.state_id !== undefined) {
            data.state_id = toNumber(rawCarData.state_id);
        }
        if (rawCarData.mfk_status_id !== undefined) {
            data.mfk_status_id = toNumber(rawCarData.mfk_status_id);
        }

        const resolvedMfkWarrantyId = mfk_warrenty_id ?? warranty_id ?? mfk_warranty_id;
        if (resolvedMfkWarrantyId !== undefined) {
            data.mfk_warrenty_id = toNumber(resolvedMfkWarrantyId);
        }

        const resolvedWarrantyTypeText = warranty_type_text ?? warranty_type_id;
        if (resolvedWarrantyTypeText !== undefined) {
            data.warranty_type_text = resolvedWarrantyTypeText !== null && String(resolvedWarrantyTypeText).trim() !== ""
                ? String(resolvedWarrantyTypeText).trim()
                : null;
        }

        const resolvedQualitySealCandidate = [
            rawCarData.quality_seal_id,
            rawCarData.quality_seal,
            rawCarData.qualitySealId,
            rawCarData.qualitySeal,
            rawCarData.quality_seals,
            rawCarData.qualitySeals,
            rawCarData.quality_seal_ids,
            rawCarData.quality_seal_id_resolved,
            req.body.quality_seal_id,
            req.body.quality_seal,
            req.body.qualitySealId,
            req.body.qualitySeal,
            req.body.quality_seals,
            req.body.qualitySeals,
            req.body.quality_seal_ids,
            req.body.quality_seal_id_resolved
        ].find(v => v !== undefined);

        if (resolvedQualitySealCandidate !== undefined) {
            data.quality_seal_id = parseQualitySealId(resolvedQualitySealCandidate);
        }

        if (rawCarData.warranty_from !== undefined) {
            data.warranty_from = normalizeMySQLDate(rawCarData.warranty_from);
        }
        if (rawCarData.warranty_to !== undefined) {
            data.warranty_to = normalizeMySQLDate(rawCarData.warranty_to);
        }
        if (rawCarData.warranty_number_of_months !== undefined) {
            data.warranty_number_of_months = toNumber(rawCarData.warranty_number_of_months);
        }
        if (rawCarData.warranty_kilometer !== undefined) {
            data.warranty_kilometer = rawCarData.warranty_kilometer !== null && String(rawCarData.warranty_kilometer).trim() !== ""
                ? String(rawCarData.warranty_kilometer).trim()
                : null;
        }
        if (rawCarData.warranty_description !== undefined) {
            data.warranty_description = rawCarData.warranty_description !== null && String(rawCarData.warranty_description).trim() !== ""
                ? String(rawCarData.warranty_description).trim()
                : null;
        }

        if (rawCarData.last_mfk_date !== undefined) {
            data.last_mfk_date = normalizeMySQLDate(rawCarData.last_mfk_date);
        }
        if (rawCarData.next_mfk_due !== undefined) {
            data.next_mfk_due = normalizeMySQLDate(rawCarData.next_mfk_due);
        }
        if (rawCarData.mfk_date !== undefined) {
            data.mfk_date = rawCarData.mfk_date !== null && String(rawCarData.mfk_date).trim() !== ""
                ? String(rawCarData.mfk_date).trim()
                : null;
        }

        // Color resolution
        if (rawCarData.exterior_color_id !== undefined || rawCarData.exterior_color_custom !== undefined) {
            const extColor = resolveColorFields(rawCarData.exterior_color_id, rawCarData.exterior_color_custom);
            data.exterior_color_id = extColor.color_id;
            data.exterior_color_custom = extColor.color_custom;
        }
        if (rawCarData.interior_color_id !== undefined || rawCarData.interior_color_custom !== undefined) {
            const intColor = resolveColorFields(rawCarData.interior_color_id, rawCarData.interior_color_custom);
            data.interior_color_id = intColor.color_id;
            data.interior_color_custom = intColor.color_custom;
        }

        // Booleans
        if (rawCarData.is_fresh_from_service !== undefined) {
            data.is_fresh_from_service = toBool(rawCarData.is_fresh_from_service);
        }
        if (rawCarData.is_metallic !== undefined) {
            data.is_metallic = toBool(rawCarData.is_metallic);
        }
        if (rawCarData.is_swiss_vehicle !== undefined) {
            data.is_swiss_vehicle = toBool(rawCarData.is_swiss_vehicle);
        }
        if (rawCarData.is_accident_vehicle !== undefined) {
            const isAccident = toBool(rawCarData.is_accident_vehicle);
            data.is_accident_vehicle = isAccident ? 1 : 0;
            data.vehicle_accident_status_id = isAccident ? 1 : 2;
        }
        if (rawCarData.vehicle_accident_status_id !== undefined) {
            data.vehicle_accident_status_id = toNumber(rawCarData.vehicle_accident_status_id);
            data.is_accident_vehicle = data.vehicle_accident_status_id === 1 ? 1 : 0;
        }
        if (isLeasing !== undefined) {
            data.isLeasing = toBool(isLeasing);
        }

        // Dimensions & Specifications
        if (rawCarData.height_mm !== undefined) {
            data.height_mm = toNumber(rawCarData.height_mm);
        }
        if (rawCarData.width_mm !== undefined) {
            data.width_mm = toNumber(rawCarData.width_mm);
        }
        if (rawCarData.length_mm !== undefined) {
            data.length_mm = toNumber(rawCarData.length_mm);
        }
        if (rawCarData.braked_towing_capacity_kg !== undefined) {
            data.braked_towing_capacity_kg = toNumber(rawCarData.braked_towing_capacity_kg);
        }
        if (rawCarData.energy_efficiency !== undefined) {
            data.energy_efficiency = rawCarData.energy_efficiency;
        }
        if (rawCarData.euro_norm !== undefined) {
            data.euro_norm = rawCarData.euro_norm;
        }
        if (rawCarData.type_approval !== undefined) {
            data.type_approval = rawCarData.type_approval;
        }
        if (rawCarData.vin_number !== undefined) {
            data.vin_number = rawCarData.vin_number;
        }
        if (rawCarData.registration_master_number !== undefined) {
            data.registration_master_number = rawCarData.registration_master_number;
        }
        if (rawCarData.cubic_capacity !== undefined || rawCarData.engine_capacity !== undefined) {
            data.cubic_capacity = toNumber(rawCarData.cubic_capacity ?? rawCarData.engine_capacity);
        }
        if (rawCarData.wltp_range !== undefined) {
            data.wltp_range = toNumber(rawCarData.wltp_range);
        }
        if (rawCarData.battery_capacity !== undefined) {
            data.battery_capacity = toNumber(rawCarData.battery_capacity);
        }
        if (rawCarData.latitude !== undefined) {
            data.latitude = rawCarData.latitude;
        }
        if (rawCarData.longitude !== undefined) {
            data.longitude = rawCarData.longitude;
        }
        if (rawCarData.location !== undefined) {
            data.location = rawCarData.location;
        }
        if (rawCarData.vrn !== undefined || rawCarData.licensePlate !== undefined) {
            data.vrn = rawCarData.vrn ?? rawCarData.licensePlate;
        }
        if (rawCarData.additional_title_999 !== undefined) {
            data.additional_title_999 = rawCarData.additional_title_999;
        }
        if (rawCarData.description !== undefined) {
            data.description = rawCarData.description;
        }
        if (rawCarData.extras !== undefined) {
            data.extras = Array.isArray(rawCarData.extras) ? JSON.stringify(rawCarData.extras) : rawCarData.extras;
        }
        if (carFeatures !== undefined || features !== undefined) {
            const rawFeatures = carFeatures ?? features;
            data.carFeatures = JSON.stringify(normalizeFeatureIds(rawFeatures));
        }

        // Pricing
        if (rawCarData.selling_price !== undefined || rawCarData.price !== undefined) {
            data.selling_price = toNumber(rawCarData.selling_price ?? rawCarData.price);
        }
        if (rawCarData.new_price !== undefined) {
            data.new_price = toNumber(rawCarData.new_price);
        }
        if (rawCarData.totalPrice !== undefined) {
            data.totalPrice = toNumber(rawCarData.totalPrice);
        } else if (data.selling_price !== undefined) {
            data.totalPrice = data.selling_price;
        }

        // Media
        if (uploadedCarReel) {
            data.carReel = uploadedCarReel;
        } else if (_carReelFromBody !== undefined) {
            data.carReel = _carReelFromBody;
        }
        if (uploadedReelThumbnails) {
            data.reelThumbnails = uploadedReelThumbnails;
        } else if (_reelThumbnailsFromBody !== undefined) {
            data.reelThumbnails = _reelThumbnailsFromBody;
        }
        if (uploadedDocument) {
            data.document = uploadedDocument;
        } else if (_documentFromBody !== undefined) {
            data.document = _documentFromBody;
        }

        // Listing step
        if (page !== undefined || listing_step !== undefined) {
            const rawStep = page ?? listing_step;
            const parsedStep = Number(rawStep);
            if (Number.isInteger(parsedStep) && parsedStep > 0) {
                data.listing_step = parsedStep;
            }
        }

        // Sold / Available / Status handling
        const isMarkedSold =
            toBool(is_sold) === 1 ||
            toBool(isSold) === 1 ||
            String(status || "").toLowerCase() === "sold" ||
            String(listing_status || "").toLowerCase() === "sold" ||
            String(action || "").toLowerCase() === "sold";

        const isMarkedAvailable =
            (is_sold !== undefined && toBool(is_sold) === 0) ||
            (isSold !== undefined && toBool(isSold) === 0) ||
            (String(status || "").toLowerCase() === "published" || String(status || "").toLowerCase() === "active") ||
            (String(listing_status || "").toLowerCase() === "published") ||
            String(action || "").toLowerCase() === "available";

        if (isMarkedSold) {
            data.is_sold = 1;
            data.is_active = 0;
        } else if (isMarkedAvailable || rawCarData.is_active !== undefined) {
            const willBeActive = isMarkedAvailable || toBool(rawCarData.is_active) === 1;
            if (willBeActive) {
                if (Number(car.is_active) !== 1) {
                    const activePlans = await getUserActivePlans(user_id);
                    if (!activePlans || activePlans.length === 0) {
                        return handleError(res, 400, "No active subscription plan found. Please purchase or renew a plan to activate this car.", lang);
                    }

                    const totalSlots = await getUserTotalSlots(user_id);
                    const [activeCountRow] = await db.query(
                        `SELECT COUNT(*) AS count FROM tbl_cars WHERE user_id = ? AND is_deleted = 0 AND is_active = 1 AND id != ?`,
                        [user_id, carId]
                    );
                    const currentActiveCount = activeCountRow?.count || 0;
                    if (currentActiveCount >= totalSlots) {
                        return handleError(
                            res,
                            400,
                            `Slot limit reached! You are already using ${currentActiveCount}/${totalSlots} slot(s). Please upgrade your plan or deactivate an active car first.`,
                            lang
                        );
                    }
                }
                data.is_sold = 0;
                data.is_active = 1;
                data.listing_status = "published";
                data.slot_deleted_at = null;
            } else {
                data.is_active = 0;
            }
        } else if (listing_status !== undefined) {
            data.listing_status = listing_status;
        }

        // Date validations
        if (data.last_mfk_date) {
            const firstReg = dayjs(
                data.first_registration_date || car.first_registration_date
            ).startOf("day");
            const lastMfk = dayjs(data.last_mfk_date).startOf("day");
            const today = dayjs().startOf("day");

            if (!lastMfk.isValid()) {
                return handleError(res, 400, getMessage(lang, variableTypes.INVALID_LAST_MFK_DATE));
            }
            if (lastMfk.isAfter(today)) {
                return handleError(res, 400, getMessage(lang, variableTypes.LAST_MFK_DATE_CANNOT_BE_IN_FUTURE));
            }
            if (firstReg.isValid() && lastMfk.isBefore(firstReg)) {
                return handleError(res, 400, getMessage(lang, variableTypes.LAST_MFK_DATE_CANNOT_BE_EARLIER_THAN_FIRST_REGISTRATION_DATE));
            }
        }

        if (data.first_registration_date) {
            const firstReg = dayjs(data.first_registration_date).startOf("day");
            const today = dayjs().startOf("day");

            if (firstReg.isAfter(today)) {
                return handleError(res, 400, getMessage(lang, variableTypes.FIRST_REGISTRATION_DATE_CANNOT_BE_IN_FUTURE));
            }
        }

        // Build clean data matching ONLY valid tbl_cars columns
        const cleanData = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && VALID_TBL_CARS_COLUMNS.has(key)) {
                cleanData[key] = value;
            }
        }

        // Execute update on tbl_cars
        if (Object.keys(cleanData).length > 0) {
            await updateSellerCars(cleanData, carId);
        }

        // Update tbl_car_feature if features provided
        if (carFeatures !== undefined) {
            await replaceCarFeatures(carId, carFeatures);
        } else if (features !== undefined) {
            await replaceCarFeatures(carId, features);
        }

        // Update tbl_car_leasing
        const hasLeasingPayload =
            isLeasing !== undefined ||
            banking_partner !== undefined ||
            annual_interest_rate !== undefined ||
            interest_rate !== undefined ||
            residual_value !== undefined ||
            residual_percentage !== undefined ||
            leasing_value !== undefined ||
            monthly_price !== undefined ||
            lease_duration_months !== undefined ||
            km_per_year !== undefined ||
            down_payment !== undefined;

        if (hasLeasingPayload) {
            const isLeasingEnabled = isLeasing !== undefined
                ? toBool(isLeasing) === 1
                : (Number(car.isLeasing) === 1);

            if (isLeasingEnabled) {
                const leasingData = {
                    banking_partner: banking_partner ?? null,
                    interest_rate: annual_interest_rate ?? interest_rate ?? null,
                    residual_percentage: residual_value ?? residual_percentage ?? null,
                    monthly_price: leasing_value ?? monthly_price ?? null
                };
                if (lease_duration_months !== undefined) leasingData.lease_duration_months = toNumber(lease_duration_months);
                if (km_per_year !== undefined) leasingData.km_per_year = toNumber(km_per_year);
                if (down_payment !== undefined) leasingData.down_payment = toNumber(down_payment);

                await replaceCarLeasingByCarId(carId, leasingData);
            } else if (isLeasing !== undefined && toBool(isLeasing) === 0) {
                await clearCarLeasingByCarId(carId);
            }
        }

        // Update tbl_car_contacts
        const contactPayload = {
            first_name: first_name !== undefined ? (first_name || null) : undefined,
            last_name: last_name !== undefined ? (last_name || null) : undefined,
            company_name: company_name !== undefined ? (company_name || null) : undefined,
            company_address: company_address !== undefined ? (company_address || null) : undefined,
            street: street !== undefined ? (street || null) : undefined,
            house_number: house_number !== undefined ? (house_number || null) : undefined,
            postal_code: postal_code !== undefined ? (postal_code || null) : undefined,
            city: city !== undefined ? (city || null) : undefined,
            po_box: po_box !== undefined ? (po_box || null) : undefined,
            country: country !== undefined ? (country || null) : undefined,
            country_code: country_code !== undefined ? (country_code || null) : undefined,
            phone_number: phone_number !== undefined ? (phone_number || null) : undefined,
            latitude: contact_latitude !== undefined ? contact_latitude : (rawCarData.latitude !== undefined ? rawCarData.latitude : undefined),
            longitude: contact_longitude !== undefined ? contact_longitude : (rawCarData.longitude !== undefined ? rawCarData.longitude : undefined)
        };

        const hasAnyContactFieldProvided = Object.values(contactPayload).some(v => v !== undefined);

        if (hasAnyContactFieldProvided) {
            const cleanedContact = Object.fromEntries(
                Object.entries(contactPayload).filter(([_, v]) => v !== undefined)
            );
            const hasNonEmptyContactData = Object.values(cleanedContact).some(
                (v) => v !== null && String(v).trim() !== ""
            );
            if (hasNonEmptyContactData) {
                await replaceCarContactByCarId(carId, cleanedContact);
            }
        }

        // Add newly uploaded car images without deleting existing ones
        if (uploadedCarImages.length > 0) {
            await Promise.all(
                uploadedCarImages.map(img =>
                    addCarImagesByCarId(img, carId)
                )
            );
        }

        // Recalculate MFK status
        await recalcMfk(carId);

        // Dispatch notifications for favorited car events
        try {
            const carName = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';
            const oldPrice = Number(car.selling_price ?? car.totalPrice ?? 0);
            const newPrice = (cleanData.selling_price !== undefined && cleanData.selling_price !== null && cleanData.selling_price !== '')
                ? Number(cleanData.selling_price)
                : ((cleanData.totalPrice !== undefined && cleanData.totalPrice !== null && cleanData.totalPrice !== '') ? Number(cleanData.totalPrice) : undefined);
            const wasSold = Number(car.is_sold) === 1 || car.listing_status === 'sold';
            const isNowSold = isMarkedSold || Number(cleanData.is_sold) === 1;
            const isNowAvailable = isMarkedAvailable || (wasSold && Number(cleanData.is_sold) === 0 && Number(cleanData.is_active) === 1);

            if (isNowSold && !wasSold) {
                notifyFavoritedCarUsers({ carId, event: 'sold', carName, excludeUserId: user_id }).catch(e => console.error('Notify sold error:', e));
            } else if (isNowAvailable && wasSold) {
                notifyFavoritedCarUsers({ carId, event: 'available_again', carName, excludeUserId: user_id }).catch(e => console.error('Notify available again error:', e));
            } else if (newPrice !== undefined && oldPrice > 0 && newPrice < oldPrice) {
                notifyFavoritedCarUsers({ carId, event: 'price_reduced', oldPrice, newPrice, carName, excludeUserId: user_id }).catch(e => console.error('Notify price reduced error:', e));
            } else {
                const specFields = [
                    'brandName',
                    'carModel',
                    'selectYear',
                    'carMileage',
                    'fuelType',
                    'transmission',
                    'engineType',
                    'fuel_type_id',
                    'transmission_id',
                    'drive_type_id',
                    'body_type_id',
                    'exterior_color_id',
                    'interior_color_id',
                    'doors',
                    'sittingCapacity',
                    'power_kw',
                    'power_ps',
                    'powerOutput',
                    'cubic_capacity',
                    'consumption',
                    'wltp_range',
                    'battery_capacity',
                    'mfk_date',
                    'last_mfk_date',
                    'first_registration_date',
                    'description'
                ];
                const hasSpecChanges = specFields.some(f => cleanData[f] !== undefined && cleanData[f] !== null && String(cleanData[f]).trim() !== '' && String(cleanData[f]) !== String(car[f]));
                if (hasSpecChanges) {
                    notifyFavoritedCarUsers({ carId, event: 'updated', carName, excludeUserId: user_id }).catch(e => console.error('Notify updated error:', e));
                }
            }
        } catch (notifErr) {
            console.error("Error dispatching car update notification:", notifErr);
        }

        return handleSuccess(
            res,
            200,
            getMessage(
                lang,
                variableTypes.CAR_UPDATED_SUCCESSFULLY
            ),
            {
                car_id: carId
            }
        );
    } catch (error) {
        console.error("Error updating car:", error);
        return handleError(
            res,
            500,
            getMessage(
                "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

/**
 * Dedicated endpoint to mark a vehicle as sold or available again
 */
export const markCarAsSoldController = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user.language || 'en';
        const carId = Number(req.params.carId || req.params.id || req.body.car_id || req.body.carId);
        const { is_sold = 1, status = 'sold' } = req.body;

        if (!carId) {
            return handleError(res, 400, "Valid carId is required", lang);
        }

        const [car] = await findCarByIdAndUser(carId, user_id);
        if (!car) {
            return handleError(res, 404, getMessage(lang, variableTypes.CAR_NOT_FOUND_OR_UNAUTHORIZED));
        }

        const shouldMarkSold =
            is_sold === 1 ||
            is_sold === true ||
            is_sold === '1' ||
            is_sold === 'true' ||
            String(status).toLowerCase() === 'sold';

        const carName = [car.selectYear, car.brandName, car.carModel].filter(Boolean).join(' ') || 'Vehicle';
        const wasSold = Number(car.is_sold) === 1;

        if (shouldMarkSold) {
            await updateSellerCars({ is_sold: 1, is_active: 0 }, carId);
            if (!wasSold) {
                notifyFavoritedCarUsers({ carId, event: 'sold', carName, excludeUserId: user_id }).catch(e => console.error('Notify sold error:', e));
            }
            return handleSuccess(res, 200, "Vehicle marked as sold successfully", { carId, is_sold: 1, is_active: 0 }, lang);
        } else {
            await updateSellerCars({ is_sold: 0, is_active: 1, listing_status: 'published' }, carId);
            if (wasSold) {
                notifyFavoritedCarUsers({ carId, event: 'available_again', carName, excludeUserId: user_id }).catch(e => console.error('Notify available again error:', e));
            }
            return handleSuccess(res, 200, "Vehicle marked as available successfully", { carId, is_sold: 0, is_active: 1 }, lang);
        }
    } catch (error) {
        console.error("markCarAsSoldController error:", error);
        return handleError(res, 500, "Internal server error", req.user?.language || 'en');
    }
};
