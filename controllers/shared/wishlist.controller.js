import { fetchAllreadyCarWishlist, addToWishlistModel, modelFetchAllWishlist, removeCarFromWishlistModel, fetchCarImagesByCarId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const addToWishlist = async (req, res) => {
    try {
        let user_id = req.user.id;
        let lang = req.user.language;
        let carId = req.body.carId || req.body.car_id;
        if (!carId) {
            return handleError(res, 400, "carId is required");
        }
        let isExists = await fetchAllreadyCarWishlist(user_id, carId);
        if (isExists && isExists.length > 0) {
            return handleError(res, 400, getMessage(lang, variableTypes.CAR_ALLREDY_IN_YOUR_WISHLIST));
        }
        const result = await addToWishlistModel({ user_id, carId });
        if (result && result.insertId) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.CAR_ADDED_TO_WISHLIST));
        } else {
            return handleError(res, 400, getMessage(lang, variableTypes.FAILED_TO_CAR_LIST));
        }
    } catch (error) {
        console.error("addToWishlist error:", error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const fetchUserWishlist = async (req, res) => {
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

        let data = await modelFetchAllWishlist(
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
            offset
        );

        if (data.length) {
            data = await Promise.all(
                data.map(async (item) => {
                    const carImages = await fetchCarImagesByCarId(item.id);
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
                         power,
                        sellerName,
                        quality_seal_id: item.quality_seal_id_resolved ?? item.quality_seal_id ?? null,
                        quality_seal_name: item.quality_seal_name ?? null,
                        quality_seal_image: item.quality_seal_image ?? null,
                        quality_seal_description: item.quality_seal_description ?? null,
                        isWishlist: true, // obvious
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

        return handleSuccess(
            res,
            200,
            getMessage(language, variableTypes.WISH_LIST_FOUND),
            data || []
        );

    } catch (error) {
        console.error(error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const removeCarFromWishlist = async (req, res) => {
    try {
        let { language, id } = req.user;
        let carId = req.body?.carId || req.body?.car_id;
        await removeCarFromWishlistModel(id, carId);
        return handleSuccess(res, 200, getMessage(language, variableTypes.REMOVE_CAR_FROM_WISHLIST));
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
