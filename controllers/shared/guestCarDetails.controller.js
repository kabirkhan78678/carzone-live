import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { viewCarDetailByCarIdModel, getCarImagesByCarIdModel, getSellerOpeningTimesModel, suggestedCarOfCarId, fetchCarImagesByCarId, getFeaturesListModel, getExtrasListModel } from '../../models/user.model.js';
import { buildVehicleDetailPayload } from './guestCarsList.controller.js';
import { variableTypes } from '../../utils/constant.js';
import { calculateMfk, buildMfkMessage } from '../../utils/mfkHelper.js';
import { parseArrayField, getMessage, normalizeOpeningTimes } from '../../utils/user_helper.js';

export const asGuestUserGetCar = async (req, res) => {
    try {
        const carId = Number(req.params.id);

        // Guest user
        const language = "en";

        const carData = await viewCarDetailByCarIdModel(carId, language);

        if (!carData || carData.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        const car = carData[0];

        const images = await getCarImagesByCarIdModel(carId);

        const openingTimes = normalizeOpeningTimes(
            await getSellerOpeningTimesModel(car.user_id)
        );

        const suggestedCars = await suggestedCarOfCarId(carId, car.user_id);

        await Promise.all(
            suggestedCars.map(async (item) => {
                const imgs = await fetchCarImagesByCarId(item.id);
                item.car_images = imgs.map(i => i.images);
                return item;
            })
        );

        //     first_registration_date:
        //         car.first_registration_date,

        //     last_mfk_date:
        //         car.last_mfk_date,

        //     override_status:
        //         car.mfk_status_override,

        //     from_mfk:
        //         car.from_mfk
        // });

        //     buildMfkMessage({

        //         status:
        //             mfkInfo.status,

        //         last_mfk_date:
        //             mfkInfo.last_mfk_date,

        //         next_mfk_due:
        //             mfkInfo.next_mfk_due,

        //         language
        //     });

        let mfkInfo = {
            status: "NO_DATA",
            indicator: null,
            text: "",
            last_mfk_date: null,
            next_mfk_due: null,
            days_since_last_mfk: null,
            days_until_next_mfk: null,
            mfk_cycle: null,
            mfk_source: null
        };

        let text = "";

        try {
            // mfkInfo = calculateMfk({
            //     first_registration_date: car.first_registration_date,
            //     last_mfk_date: car.last_mfk_date,
            //     override_status: car.mfk_status_override,
            //     from_mfk: car.from_mfk
            // });

            mfkInfo = calculateMfk({
                mfk_status_code: car.mfk_status_code,
                first_registration_date: car.first_registration_date,
                last_mfk_date: car.last_mfk_date,
                from_mfk: car.from_mfk
            });

            text = buildMfkMessage({
                status: mfkInfo.status,
                last_mfk_date: mfkInfo.last_mfk_date,
                next_mfk_due: mfkInfo.next_mfk_due,
                language
            });

        } catch (mfkError) {
            console.error(
                `MFK calculation skipped for car ${carId}:`,
                mfkError.message
            );

            // Invalid MFK data should not break car detail API
            mfkInfo = {
                status: "NO_DATA",
                indicator: null,
                last_mfk_date: car.last_mfk_date || null,
                next_mfk_due: null,
                days_since_last_mfk: null,
                days_until_next_mfk: null,
                mfk_cycle: null,
                mfk_source: null
            };

            text = "";
        }

        const warrantyParts = [
            car.warranty_value,
            car.warranty_number_of_months,
            car.warranty_kilometer
        ].filter(value => value !== null && value !== undefined && value !== "");

        const textData =
            warrantyParts.length <= 1
                ? warrantyParts.join("")
                : warrantyParts.length === 2
                    ? warrantyParts.join(" or ")
                    : `${warrantyParts[0]}, ${warrantyParts.slice(1).join(" or ")}`;

        const warantyDeatils = {
            warrantyId: car.mfk_warrenty_id,
            warrantyIncluded:
                car.warranty_value?.trim().toLowerCase() === "no warranty"
                    ? false
                    : !!car.mfk_warrenty_id,

            numberOfMonths: car.warranty_number_of_months ?? null,

            kilometer: car.warranty_kilometer ?? null,

            description: car.warranty_description ?? null,

            warrantyValue: car.warranty_value ?? null,

            warrantyFrom: car.warranty_from ?? null,

            warrantyDescription: textData
        };

        const powerParts = [];

        if (car.power_ps != null) {
            powerParts.push(`${car.power_ps} PS`);
        }

        if (car.power_kw != null) {
            powerParts.push(`${car.power_kw} KW`);
        }

        const power = powerParts.length ? powerParts.join(" / ") : null;

        // Features & Extras list (features-data)
        const [featureRows, extraRows] = await Promise.all([
            getFeaturesListModel(language),
            getExtrasListModel(language, {})
        ]);

        const featuresData = {
            features: (featureRows || [])
                .filter((row) => Number(row.id) !== 6)
                .map((row) => ({
                    id: row.id,
                    feature_key: row.feature_key,
                    display_key: row.display_key,
                    sort_order: row.sort_order,
                    name: row.name
                })),
            extras: (extraRows || [])
                .filter((row) => row.extra_key === "eight_tyres")
                .map((row) => ({
                    id: row.id,
                    extra_key: row.extra_key,
                    display_key: row.display_key,
                    sort_order: row.sort_order,
                    icon: row.icon,
                    name: row.name,
                    count: Number(row.count || 0)
                }))
        };

        const rawActive = Number(car.is_active ?? 0);
        const isDraft = rawActive === 2 || String(car.listing_status || "").toLowerCase() === "draft";
        const isActive = rawActive === 1;
        const carActiveStatus = isActive ? 1 : (isDraft ? 2 : 0);
        const isPlanExpired = !isActive && !isDraft;
        const carStatus = isActive ? "active" : (isDraft ? "draft" : "expired");
        const statusMessage = isActive 
            ? "Active" 
            : (isDraft 
                ? "Draft (Complete payment to publish)" 
                : "Expired / Inactive (Renew subscription to activate)");

        const formatDateReadable = (value) => {
        if (!value) return null;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        const iso = d.toISOString().slice(0, 10);
        const [y, m, day] = iso.split('-');
        return `${day}-${m}-${y}`;
    };

    const toValidTillText = (value) => {
        const formatted = formatDateReadable(value);
        return formatted ? `Valid till ${formatted}` : null;
    };

        const isUntilSold = car.duration_option === 'until_sold';
        const fallbackExpiresAt = (car.duration_option === '1_month' && car.createdAt)
            ? new Date(new Date(car.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000)
            : null;
        const effectiveStartDate = car.plan_start_date || car.createdAt;
        const effectiveEndDate = isUntilSold ? null : (car.listing_expires_at || car.plan_end_date || fallbackExpiresAt || null);

        const planStartDate = formatDateReadable(effectiveStartDate) || formatDateReadable(new Date());
        let planEndDate = null;
        let validTillText = null;
        let daysRemaining = null;

        if (isDraft) {
            planEndDate = "Payment Pending";
            validTillText = "Draft (Payment Pending)";
            daysRemaining = null;
        } else if (isUntilSold) {
            planEndDate = "Until Sold";
            validTillText = "Valid Until Sold";
            daysRemaining = null;
        } else if (effectiveEndDate && formatDateReadable(effectiveEndDate)) {
            planEndDate = formatDateReadable(effectiveEndDate);
            validTillText = toValidTillText(effectiveEndDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(effectiveEndDate);
            end.setHours(0, 0, 0, 0);
            const diffTime = end.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysRemaining = diffDays >= 0 ? diffDays : 0;
        } else if (isActive) {
            planEndDate = "Until Sold";
            validTillText = "Valid Until Sold";
            daysRemaining = null;
        } else {
            planEndDate = "Expired";
            validTillText = "Expired";
            daysRemaining = 0;
        }

        return res.status(200).json({
            is_active: carActiveStatus,
            is_plan_expired: isPlanExpired,
            status: carStatus,
            status_message: statusMessage,
            listing_status: car.listing_status || (carActiveStatus === 1 ? "published" : carActiveStatus === 2 ? "draft" : "inactive"),
            payment_status: car.payment_status || (carActiveStatus === 1 ? "paid" : carActiveStatus === 2 ? "unpaid" : "unpaid"),
            listing_type: car.listing_type || null,
            duration_option: car.duration_option || null,
            requires_payment: carActiveStatus === 2 || car.payment_status === "unpaid",
            plan_start_date: planStartDate,
            plan_end_date: planEndDate,
            valid_until: planEndDate,
            valid_till: validTillText,
            valid_until_formatted: validTillText,
            days_remaining: daysRemaining,
            quality_seal_id: car.quality_seal_id ?? car.quality_seal_id_resolved ?? null,
            quality_seal_name: car.quality_seal_name ?? null,
            quality_seal_image: car.quality_seal_image ?? null,
            quality_seal_description: car.quality_seal_description ?? null,
            quality_seal: car.quality_seal_id_resolved ? {
                id: car.quality_seal_id_resolved,
                name: car.quality_seal_name,
                image: car.quality_seal_image,
                description: car.quality_seal_description
            } : null,
            vehicle: buildVehicleDetailPayload(car, openingTimes, mfkInfo),

            images: images.map(i => i.images),
            images_object: (images || []).map(i => ({ id: i.id, url: i.images })),

            carReel: car.carReel || null,

            reelThumbnails: car.reelThumbnails || null,

            document: car.document || null,

            equipment: parseArrayField(car.carFeatures, []),

            extras: parseArrayField(car.extras, []),

            featuresData,
            features_data: featuresData,

            description: car.description || "",

            warrantyAndReturn: {
                warrantyIncluded: !!car.mfk_warrenty_id,
                text: "From take-over, 12 months or 20,000 km"
            },

            seller: {
                id: car.user_id,
                name: car.fullName,
                accountType: car.account_type,
                company: car.companyName,
                companyAddress: car.companyAddress,
                phone: car.phoneNumber,
                whatsapp: car.whatsappNumber,
                email: car.email,
                profileImage: car.profileImage,
                coverImage: car.coverImage,
                address: car.fullAddress,
                city: car.city,
                pincode: car.pincode,
                tagline: car.tagline,
                description: car.sellerDescription,

                businessPhone: car.business_phone,
                commercialRegisterNumber: car.commercial_register_number,
                businessCountryCode: car.businessCountryCode,

                openingTimes,
                open_timmings: openingTimes
            },

            location: {
                latitude: car.latitude,
                longitude: car.longitude
            },

            open_timmings: openingTimes,

            suggestedCars,

            // Guest values
            is_in_wishlist: false,
            isSavedReel: 0,

            carDetails: {
                ...car,
                powerOutput: power
            },

            // mfkDetails: {
            //     title: getMessage(
            //         language,
            //         variableTypes.MFK_TITLE
            //     ),

            //     status:
            //         mfkInfo.status,

            //     indicator:
            //         mfkInfo.indicator,

            //     text,

            //     last_mfk_date:
            //         mfkInfo.last_mfk_date,

            //     next_mfk_due:
            //         mfkInfo.next_mfk_due,

            //     days_since_last_mfk:
            //         mfkInfo.days_since_last_mfk,

            //     days_until_next_mfk:
            //         mfkInfo.days_until_next_mfk,

            //     mfk_cycle:
            //         mfkInfo.mfk_cycle,

            //     mfk_source:
            //         mfkInfo.mfk_source
            // },

            mfkDetails: {
                title: getMessage(
                    language,
                    variableTypes.MFK_TITLE
                ),

                status_id: car.mfk_status_id || null,

                status: car.mfk_status_code || null,

                status_name: car.mfk_status_value || null,

                indicator: mfkInfo.indicator,

                text,

                last_mfk_date:
                    mfkInfo.last_mfk_date,

                next_mfk_due:
                    mfkInfo.next_mfk_due,

                days_since_last_mfk:
                    mfkInfo.days_since_last_mfk,

                days_until_next_mfk:
                    mfkInfo.days_until_next_mfk,

                mfk_cycle:
                    mfkInfo.mfk_cycle,

                mfk_source:
                    mfkInfo.mfk_source
            },

            warantyDetails: warantyDeatils,

            // qualitySeals: qualitySeals.map(seal => ({
            //     id: seal.id,
            //     code: seal.code,
            //     name: seal.name
            // })),
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
