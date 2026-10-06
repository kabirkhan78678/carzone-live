import { fetchUserByIdCount, fetchUserById, fetchAllreadyCarWishlist, fetchCarsById, fetchCarImagesByCarId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getChfFormattedPrice, getMessage } from '../../utils/user_helper.js';

export const fetchOtherSellerCarsList = async (req, res) => {
    try {
        const {
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            page = 1,
            limit = 10
        } = req.query;

        const { id, language } = req.user;

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;
        const offset = (pageNumber - 1) * limitNumber;

        // ✅ get total count
        const totalResult = await fetchUserByIdCount(
            id,
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            language
        );

        const total = totalResult[0]?.total || 0;

        let data = await fetchUserById(
            id,
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            limitNumber,
            offset,
            language
        );

        if (data.length) {
            data = await Promise.all(
                data.map(async (item) => {
                    const carImages = await fetchCarImagesByCarId(item.id);
                    const wishlist = await fetchAllreadyCarWishlist(id, item.id);
                    const sellerName = item.companyName || item.fullName || null;

                       const powerParts = [];

if (item.power_ps != null) {
    powerParts.push(`${item.power_ps} PS`);
}

if (item.power_kw != null) {
    powerParts.push(`${item.power_kw} KW`);
}

const power = powerParts.length ? powerParts.join(" / ") : null;

                    return {
                        ...item,
                         powerOutput:power,
                        sellerName,
                        warranty_type_id: item.warranty_type_id_resolved ?? item.warranty_type_text ?? null,
                        warranty_type_value: item.warranty_type_value ?? null,
                        warranty_value: item.warranty_value ?? null,
                        quality_seal_id: item.quality_seal_id ?? item.quality_seal_id_resolved ?? null,
                        quality_seal_name: item.quality_seal_name ?? null,
                        quality_seal_image: item.quality_seal_image ?? null,
                        quality_seal_description: item.quality_seal_description ?? null,
                        quality_seal: (item.quality_seal_id || item.quality_seal_id_resolved) ? {
                            id: item.quality_seal_id_resolved || item.quality_seal_id,
                            name: item.quality_seal_name ?? null,
                            image: item.quality_seal_image ?? null,
                            description: item.quality_seal_description ?? null
                        } : null,
                        leasing_value: item.leasing_value ?? item.leasingPrice ?? null,
                        annual_interest_rate: item.annual_interest_rate ?? null,
                        residual_value: item.residual_value ?? null,
                        isWishlist: wishlist.length > 0,
                        carImages: carImages.map(img => img.images),
                        sellerDetails: {
                            sellerId: item.seller_id,
                            role: item.role,
                            sellerType: item.seller_type,
                            isBlocked: item.isBlocked,
                            isActive: item.is_active,
                            sellerName,
                            fullName: item.fullName,
                            email: item.email,
                            phoneNumber: item.phoneNumber,
                            whatsappNumber: item.whatsappNumber,
                            profileImage: item.profileImage,
                            city: item.city,
                            pincode: item.pincode,
                            fullAddress: item.fullAddress,
                            companyName: item.companyName,
                            companyAddress: item.companyAddress,
                            vat: item.vat,
                            countryCode: item.countryCode
                        }
                    };
                })
            );
        }

        if (data.length) {
            data.forEach((item) => {
                delete item.warranty_type_id_resolved;
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            language,
            message: getMessage(language, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY),
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            data: data || []
        });

    } catch (error) {
        console.error(error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const fetchOtherCarListByOtherSellerId = async (req, res) => {
    try {
        let lang = req.user?.language || 'en';
        let id = req.query.id;
        let data = await fetchCarsById(id, lang);
        if (data.length > 0) {
            data = await Promise.all(data.map(async (item) => {
                let carImgObjects = await fetchCarImagesByCarId(item.id);
                item.carImages = carImgObjects.map(img => img.images);
                item.warranty_type_id = item.warranty_type_id_resolved ?? item.warranty_type_text ?? null;
                item.warranty_type_value = item.warranty_type_value ?? null;
                item.warranty_value = item.warranty_value ?? null;
                item.leasing_value = item.leasing_value ?? item.leasingPrice ?? null;
                item.annual_interest_rate = item.annual_interest_rate ?? null;
                item.residual_value = item.residual_value ?? null;
                item.quality_seal_id = item.quality_seal_id ?? item.quality_seal_id_resolved ?? null;
                item.quality_seal_name = item.quality_seal_name ?? null;
                item.quality_seal_image = item.quality_seal_image ?? null;
                item.quality_seal_description = item.quality_seal_description ?? null;
                item.quality_seal = (item.quality_seal_id || item.quality_seal_id_resolved) ? {
                    id: item.quality_seal_id_resolved || item.quality_seal_id,
                    name: item.quality_seal_name ?? null,
                    image: item.quality_seal_image ?? null,
                    description: item.quality_seal_description ?? null
                } : null;
                delete item.warranty_type_id_resolved;
                return item;
            }));
        }
        data = data.length > 0 ? data : []
        return handleSuccess(res, 200, getMessage(lang, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY), data);

    } catch (error) {
        return handleError(res, 500, getMessage(variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const formatScheduleRequestItem = (visit) => {
    const preferredDate = visit.rescheduled_date || visit.visit_date || null;
    const preferredTime = visit.rescheduled_time || visit.visit_time || null;
    const rawPrice = Number(visit.selling_price || visit.new_price || 0);
    const safeMileage = visit.carMileage ? `${Number(visit.carMileage).toLocaleString("en-US")} km` : null;

    return {
        id: visit.id,
        status: visit.status || "pending",
        requested_on: visit.created_at || null,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        message: visit.message || null,
        requester: {
            user_id: visit.user_id || null,
            full_name: visit.requester_name || visit.full_name || null,
            email: visit.requester_email || visit.email || null,
            phone_number: visit.requester_phone || visit.phone_number || null,
            profile_photo: visit.profile_photo || visit.profileImage || null
        },
        vehicle: {
            id: visit.car_id,
            title: visit.car_title || [visit.brandName, visit.carModel].filter(Boolean).join(" ") || null,
            brandName: visit.brandName || null,
            carModel: visit.carModel || null,
            registration_year: visit.first_registration_date
                ? new Date(visit.first_registration_date).getFullYear()
                : null,
            mileage: safeMileage,
            price: rawPrice > 0 ? (typeof getChfFormattedPrice === 'function' ? getChfFormattedPrice(rawPrice) : `CHF ${rawPrice}`) : null,
            image: visit.car_image || null
        }
    };
};

export const formatScheduleRequestDetail = (visit) => {
    const base = formatScheduleRequestItem(visit);
    return {
        ...base,
        listing_owner: {
            user_id: visit.listing_owner_id || visit.seller_id || null,
            account_type: visit.listing_owner_account_type || null
        },
        audit: {
            created_at: visit.created_at || null,
            updated_at: visit.updated_at || null,
            original_visit_date: visit.visit_date || null,
            original_visit_time: visit.visit_time || null,
            rescheduled_date: visit.rescheduled_date || null,
            rescheduled_time: visit.rescheduled_time || null
        }
    };
};
