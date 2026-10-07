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

const parseRange = (source, minKeys, maxKeys, rangeObjKey) => {
    let min = null;
    let max = null;

    for (const k of minKeys) {
        if (source[k] !== undefined && source[k] !== null && source[k] !== '') {
            const val = Number(source[k]);
            if (Number.isFinite(val)) {
                min = val;
                break;
            }
        }
    }

    for (const k of maxKeys) {
        if (source[k] !== undefined && source[k] !== null && source[k] !== '') {
            const val = Number(source[k]);
            if (Number.isFinite(val)) {
                max = val;
                break;
            }
        }
    }

    if (rangeObjKey && source[rangeObjKey]) {
        let r = source[rangeObjKey];
        if (typeof r === 'string') {
            try {
                r = JSON.parse(decodeURIComponent(r));
            } catch {
                if (r.includes('-')) {
                    const parts = r.split('-');
                    if (min === null && parts[0]) min = Number(parts[0]);
                    if (max === null && parts[1]) max = Number(parts[1]);
                } else if (r.includes(',')) {
                    const parts = r.split(',');
                    if (min === null && parts[0]) min = Number(parts[0]);
                    if (max === null && parts[1]) max = Number(parts[1]);
                }
            }
        }
        if (typeof r === 'object' && r !== null) {
            if (Array.isArray(r)) {
                if (min === null && r[0] !== undefined) min = Number(r[0]);
                if (max === null && r[1] !== undefined) max = Number(r[1]);
            } else {
                for (const k of minKeys) {
                    if (min === null && r[k] !== undefined && r[k] !== null && r[k] !== '') {
                        const val = Number(r[k]);
                        if (Number.isFinite(val)) min = val;
                    }
                }
                for (const k of maxKeys) {
                    if (max === null && r[k] !== undefined && r[k] !== null && r[k] !== '') {
                        const val = Number(r[k]);
                        if (Number.isFinite(val)) max = val;
                    }
                }
            }
        }
    }

    return {
        from: Number.isFinite(min) ? min : null,
        to: Number.isFinite(max) ? max : null
    };
};

export const asGuestUsersfetchAllCarReels = async (req, res) => {
    try {
        let id = 0;
        let language = 'en';
        const source = { ...(req.query || {}), ...(req.body || {}) };

        let page = parseInt(source.page) || 1;
        let limit = 5;
        let offset = (page - 1) * limit;
        const requestedCarId = Number(source.car_id || source.carId) || null;

        const priceRange = parseRange(source, ['price_from', 'priceFrom', 'min_price', 'minPrice', 'from_price', 'fromPrice'], ['price_to', 'priceTo', 'max_price', 'maxPrice', 'to_price', 'toPrice'], 'price_range');
        const yearRange = parseRange(source, ['year_from', 'yearFrom', 'min_year', 'minYear', 'from_year', 'fromYear'], ['year_to', 'yearTo', 'max_year', 'maxYear', 'to_year', 'toYear'], 'year_range');
        const mileageRange = parseRange(source, ['mileage_from', 'mileageFrom', 'min_km', 'minKm', 'min_mileage', 'minMileage', 'from_km', 'fromKm'], ['mileage_to', 'mileageTo', 'max_km', 'maxKm', 'max_mileage', 'maxMileage', 'to_km', 'toKm'], 'kilometers_range');

        const filters = {
            car_id: requestedCarId,
            make: parseArrayFilter(source.make ?? source['make[]'] ?? source.brandName ?? source['brandName[]'] ?? source.brand_name ?? source['brand_name[]'] ?? source.brand ?? source['brand[]']),
            model: parseArrayFilter(source.carModel ?? source['carModel[]'] ?? source.model ?? source['model[]'] ?? source.modelName ?? source['modelName[]'] ?? source.car_model ?? source['car_model[]']),
            body_type_id: parseArrayFilter(source.body_type_id ?? source['body_type_id[]'] ?? source.bodyTypeId ?? source['bodyTypeId[]'] ?? source.body_type ?? source['body_type[]']),
            fuel_type_id: parseArrayFilter(source.fuel_type_id ?? source['fuel_type_id[]'] ?? source.fuelTypeId ?? source['fuelTypeId[]'] ?? source.fuel_type ?? source['fuel_type[]'] ?? source.fuelType ?? source['fuelType[]']),
            transmission_id: parseArrayFilter(source.transmission_id ?? source['transmission_id[]'] ?? source.transmissionId ?? source['transmissionId[]'] ?? source.transmission ?? source['transmission[]']),
            drive_type_id: parseArrayFilter(source.drive_type_id ?? source['drive_type_id[]'] ?? source.driveTypeId ?? source['driveTypeId[]'] ?? source.drive_type ?? source['drive_type[]']),
            seller_type: parseArrayFilter(source.seller_type ?? source['seller_type[]'] ?? source.sellerType ?? source['sellerType[]'] ?? source.account_type ?? source['account_type[]'] ?? source.accountType ?? source['accountType[]']),
            state_id: parseArrayFilter(source.state_id ?? source['state_id[]'] ?? source.stateId ?? source['stateId[]'] ?? source.state ?? source['state[]'] ?? source.canton ?? source['canton[]']),
            price_from: priceRange.from,
            price_to: priceRange.to,
            year_from: yearRange.from,
            year_to: yearRange.to,
            mileage_from: mileageRange.from,
            mileage_to: mileageRange.to
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
