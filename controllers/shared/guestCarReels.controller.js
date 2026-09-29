import { fetchActiveCarReels, fetchSavedReelsByCurrentUserLoggendIn } from '../../models/user.model.js';
import moment from 'moment';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getChfFormattedPrice, getMessage } from '../../utils/user_helper.js';

export const fetchAllCarReel = async (req, res) => {
    try {
        let { id, language } = req.user;

        let allData = await fetchActiveCarReels(id);

        allData = allData.filter(item => item.carReel !== null);

        const formattedData = await Promise.all(
            allData.map(async (item) => {
                const fetchReelsSaved = await fetchSavedReelsByCurrentUserLoggendIn(id, item.id);
                const isSavedReel = fetchReelsSaved.length > 0;

                const formattedPrice = getChfFormattedPrice(item.totalPrice);
                const formattedMileage = item.carMileage
                    ? item.carMileage.toLocaleString("en-US") + " km"
                    : "";
                const carReelInfo = `${formattedPrice} | ${item.selectYear} | ${item.fuel_type_value} | ${formattedMileage}`;
                const fullModel = `${item.brandName} ${item.carModel}`;

                return {
                    id: item.id,
                    fullModel,
                    carReel: item.carReel,
                    reelThumbnails: item.reelThumbnails,
                    isSavedReel,
                    carReelInfo,
                };
            })
        );

        return handleSuccess(
            res,
            200,
            getMessage(language, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY),
            { totalItems: formattedData.length, data: formattedData }
        );
    } catch (error) {
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

const parseArrayFilter = (value) => {
    if (!value) return [];
    let items = [];

    if (Array.isArray(value)) {
        items = value;
    } else if (typeof value === "string") {
        try {
            let decoded = value;
            try {
                decoded = decodeURIComponent(value);
            } catch {}
            const parsed = JSON.parse(decoded);
            items = Array.isArray(parsed) ? parsed : [parsed];
        } catch (err) {
            if (value.includes(",")) {
                items = value.split(",").map(v => v.trim()).filter(Boolean);
            } else {
                items = [value];
            }
        }
    }

    return items.map(item => {
        if (typeof item === "string") {
            return item.replace(/\+/g, " ").trim();
        }
        return item;
    }).filter(Boolean);
};

export const asGuestUsersfetchAllCarReels = async (req, res) => {
    try {
        let id = 0
        let language = 'en'
        let page = parseInt(req.query.page) || 1;
        let limit = 5;
        let offset = (page - 1) * limit;
        const requestedCarId = Number(req.query.car_id) || null;

        const price_from = req.query.price_from ?? req.query.priceFrom ?? req.query.from_price ?? req.query.min_price ?? req.query.minPrice ?? null;
        const price_to = req.query.price_to ?? req.query.priceTo ?? req.query.to_price ?? req.query.max_price ?? req.query.maxPrice ?? null;
        const filters = {
            make: parseArrayFilter(req.query.make ?? req.query.brandName ?? req.query.brand_name),
            body_type_id: parseArrayFilter(req.query.body_type_id ?? req.query.bodyTypeId ?? req.query.body_type),
            price_from,
            price_to
        };

        let allData = await fetchActiveCarReels(id, language, filters);

        allData = allData.filter(item => item.carReel !== null);

        let totalItems = allData.length;
        let totalPages = Math.ceil(totalItems / limit);

        let paginatedData = [];

        if (requestedCarId) {
            const selectedIndex = allData.findIndex(
                (item) => Number(item.id) == requestedCarId
            );

            if (selectedIndex === -1) {
                return handleError(
                    res,
                    404,
                    getMessage(language, variableTypes.CAR_NOT_FOUND)
                );
            }

            const startIndex = Math.max(0, selectedIndex - limit + 1);
            paginatedData = allData
                .slice(startIndex, selectedIndex + 1)
                .reverse();
        } else {
            paginatedData = allData.slice(offset, offset + limit);
        }

        if (paginatedData.length > 0) {
            paginatedData = await Promise.all(
                paginatedData.map(async (item) => {
                    const fetchReelsSaved = await fetchSavedReelsByCurrentUserLoggendIn(id, item.id);
                    const isSavedReel = fetchReelsSaved.length > 0;

                    const formattedPrice = getChfFormattedPrice(item.selling_price);
                    const formattedMileage = item.carMileage
                        ? `${Number(item.carMileage).toLocaleString("en-US")} km`
                        : null;

                    const fullModel = `${item.brandName} ${item.carModel}`.trim();

                    const carReelInfo = `${formattedPrice} | ${item.fuel_type_value} | ${formattedMileage}`;
                    const firstRegistration = item.first_registration_date
                        ? moment(item.first_registration_date).format("YYYY-MM-DD") : null;

                    const consumptionValue = item.consumption
                        ? (String(item.consumption).toLowerCase().includes("l") ? item.consumption : `${item.consumption} L / 100 Km`)
                        : null;

                    const accountType = item.account_type || null;
                    const sellerAddress = [item.fullAddress, [item.pincode, item.city].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", ");

                    const powerParts = [];
                    if (item.power_ps != null) {
                        powerParts.push(`${item.power_ps} PS`);
                    }
                    if (item.power_kw != null) {
                        powerParts.push(`${item.power_kw} KW`);
                    }
                    const power = powerParts.length ? powerParts.join(" / ") : (item.powerOutput ? `${item.powerOutput} PS` : null);

                    return {
                        id: item.id,
                        fullModel,
                        carReel: item.carReel,
                        reelThumbnails: item.reelThumbnails,
                        isSavedReel,
                        carReelInfo,

                        // new fields
                        price: formattedPrice,
                        year: item.selectYear || null,
                        mileage: formattedMileage,
                        firstRegistration,
                        fuelType: item.fuel_type_value || null,
                       power,
                        transmission: item.transmission_value || null,
                        consumption: consumptionValue,
                        accountType,
                        sellerAddress: sellerAddress || null,
                        sellerRating: item.seller_rating ?? null,
                        sellerLogo: item.seller_profile_image || null
                    };
                })
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(language, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY),
            {
                selectedCarId: requestedCarId,
                currentPage: requestedCarId ? 1 : page,
                totalPages,
                totalItems,
                data: paginatedData,
            }
        );
    } catch (error) {
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
