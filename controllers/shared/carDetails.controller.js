import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { viewCarDetailByCarIdModel, fetchAllreadyCarWishlist, isSavedCarReelModel, getCarImagesByCarIdModel, getSellerOpeningTimesModel, suggestedCarOfCarId, fetchCarImagesByCarId } from '../../models/user.model.js';
import { buildVehicleDetailPayload } from './guestCarsList.controller.js';
import NodeGeocoder from 'node-geocoder';
import { variableTypes } from '../../utils/constant.js';
import { calculateMfk, buildMfkMessage } from '../../utils/mfkHelper.js';
import { parseArrayField, getMessage, normalizeOpeningTimes } from '../../utils/user_helper.js';

export const viewCarDetailByCarId = async (req, res) => {
    try {
        const carId = Number(req.params.id);
        const language = req.user?.language || 'en';

        const carData = await viewCarDetailByCarIdModel(carId, language);
        if (!carData || carData.length === 0) {
            return handleError(res, 404, getMessage(language, variableTypes.CAR_NOT_FOUND));
        }

        const { id: userId } = req.user;
        const car = carData[0];
        const wishlist = await fetchAllreadyCarWishlist(userId, carId);
        const is_in_wishlist = Number(car?.user_id) !== Number(userId) && wishlist.length > 0;
        const isSavedCarReel = await isSavedCarReelModel(userId, carId);
        const isSavedReel = isSavedCarReel.length > 0 ? 1 : 0;
        console.log('car', car);

        const images = await getCarImagesByCarIdModel(carId);

        //     carId,
        //     language
        // );

        // console.log("qualitySeals =>", qualitySeals);
        // console.log("isArray =>", Array.isArray(qualitySeals));
        const openingTimes = normalizeOpeningTimes(await getSellerOpeningTimesModel(car.user_id));

        const suggestedCars = await suggestedCarOfCarId(carId, car.user_id);
        await Promise.all(
            suggestedCars.map(async (item) => {
                const imgs = await fetchCarImagesByCarId(item.id);
                item.car_images = imgs.map(i => i.images);
                return item;
            })
        );

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

            // IMPORTANT:
            // Error case should also be multilingual
            text = buildMfkMessage({
                status: mfkInfo.NO_DATA,
                last_mfk_date: null,
                next_mfk_due: null,
                language
            });
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

        const warrantyDetails = {

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

        const isActive = Number(car.is_active) === 1;
        const isPlanExpired = !isActive;
        const carStatus = isActive ? "active" : "expired";
        const statusMessage = isActive 
            ? "Active" 
            : "Expired / Inactive (Renew subscription to activate)";

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

        const planStartDate = formatDateReadable(car.plan_start_date);
        const planEndDate = formatDateReadable(car.plan_end_date);
        const validTillText = toValidTillText(car.plan_end_date);

        let daysRemaining = null;
        if (car.plan_end_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(car.plan_end_date);
            end.setHours(0, 0, 0, 0);
            const diffTime = end.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysRemaining = diffDays >= 0 ? diffDays : 0;
        }

        return res.json({
            is_active: isActive ? 1 : 0,
            is_plan_expired: isPlanExpired,
            status: carStatus,
            status_message: statusMessage,
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
            carDetails: {
                ...car,
                powerOutput: power
            },
            open_timmings: openingTimes,
            suggestedCars,
            is_in_wishlist,
            isSavedReel,

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

            warantyDetails: warrantyDetails,
            // qualitySeals: qualitySeals.map(seal => ({
            //     id: seal.id,
            //     code: seal.code,
            //     name: seal.name
            // })),

        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const options = {
    provider: 'openstreetmap'
};

const geocoder = NodeGeocoder(options);
