import { fetchActiveCarReels, fetchAllProfileReels, fetchSavedReelsByCurrentUserLoggendIn } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getChfFormattedPrice, getMessage } from '../../utils/user_helper.js';

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

export const fetchAllCarReels = async (req, res) => {
    try {
        let { id, language } = req.user;
        let page = parseInt(req.query.page) || 1;
        let limit = 5;
        let offset = (page - 1) * limit;

        const requestedCarId = Number(req.query.car_id) || null;
        const filters = {
            car_id: requestedCarId,
            make: parseArrayFilter(req.query.make),
            body_type_id: parseArrayFilter(req.query.body_type_id),
            price_from: req.query.price_from || null,
            price_to: req.query.price_to || null
        };

        // ----------------------new logic to interleave profile reels with car reels----------------------

        const hasFilters = (Array.isArray(filters.make) && filters.make.length > 0) || (Array.isArray(filters.body_type_id) && filters.body_type_id.length > 0) ||
            filters.price_from || filters.price_to;

        // ----------------------end of new logic to interleave profile reels with car reels----------------------

        let allData = await fetchActiveCarReels(
            id,
            language,
            filters,
        );

        // let allData = await fetchActiveCarReels(id, language);
        allData = allData.filter(item => item.carReel !== null);

        // Fetch profile reels separately to interleave them with car reels
        // const profileReels = await fetchAllProfileReels(id);

        // let mixedFeed = [];

        // let profileIndex = 0;

        // for (let i = 0; i < allData.length; i++) {

        //     mixedFeed.push({
        //         reelType: "car",
        //         ...allData[i]
        //     });

        //     if ((i + 1) % 5 === 0 && profileIndex < profileReels.length) {

        //         mixedFeed.push({
        //             reelType: "profile",
        //             ...profileReels[profileIndex]
        //         });

        //         profileIndex++;
        //     }
        // }

        // allData = mixedFeed;

        // Profile reels only when no filters are applied
        if (!hasFilters) {
            // const profileReels = await fetchAllProfileReels(id);
            // let mixedFeed = [];
            // let profileIndex = 0;

            // for (let i = 0; i < allData.length; i++) {
            //     mixedFeed.push({ reelType: "car", ...allData[i] });
            //     if ((i + 1) % 5 === 0 && profileIndex < profileReels.length) {
            //         mixedFeed.push({ reelType: "profile", ...profileReels[profileIndex] });
            //         profileIndex++;
            //     }
            // }
            // allData = mixedFeed;

            const profileReels = await fetchAllProfileReels(id);

            let mixedFeed = [];
            let profileIndex = 0;

            for (let i = 0; i < allData.length; i += 5) {

                // next 5 cars
                const carChunk = allData.slice(i, i + 5);

                mixedFeed.push(
                    ...carChunk.map(item => ({
                        reelType: "car",
                        ...item
                    }))
                );

                // then 1 profile reel
                if (profileIndex < profileReels.length) {

                    mixedFeed.push({
                        reelType: "profile",
                        ...profileReels[profileIndex]
                    });

                    profileIndex++;
                }
            }

            allData = mixedFeed;

        } else {
            // Filters applied -> return only car reels
            allData = allData.map(item => ({ reelType: "car", ...item }));
        }

        // pagination logic with requestedCarId handling

        let totalItems = allData.length;
        let totalPages = Math.ceil(totalItems / limit);
        let paginatedData = [];

        if (requestedCarId) {
            const selectedIndex = allData.findIndex(
                (item) => Number(item.id) === requestedCarId
            );

            if (selectedIndex === -1) {
                return handleError(
                    res,
                    404,
                    getMessage(language, variableTypes.CAR_NOT_FOUND)
                );
            }

            paginatedData = [allData[selectedIndex]];

            const afterCars = allData.slice(
                selectedIndex + 1,
                selectedIndex + limit
            );

            const beforeCars = allData.slice(
                Math.max(0, selectedIndex - (limit - 1)),
                selectedIndex
            ).reverse();

            if (afterCars.length >= (limit - 1)) {
                paginatedData.push(...afterCars);
            } else {
                paginatedData.push(...afterCars);

                const remaining = (limit - 1) - afterCars.length;

                paginatedData.push(...beforeCars.slice(0, remaining));
            }
        }
        else {
            paginatedData = allData.slice(offset, offset + limit);
        }

        if (paginatedData.length > 0) {
            paginatedData = await Promise.all(
                // paginatedData.map(async (item) => {
                //     const fetchReelsSaved = await fetchSavedReelsByCurrentUserLoggendIn(id, item.id);
                //     const isSavedReel = fetchReelsSaved.length > 0;

                //     const formattedPrice = getChfFormattedPrice(item.selling_price);
                //     const formattedMileage = item.carMileage
                //         ? `${Number(item.carMileage).toLocaleString("en-US")} km`
                //         : null;

                //     const fullModel = `${item.brandName} ${item.carModel}`.trim();
                //     const carReelInfo = `${formattedPrice} | ${item.fuel_type_value} | ${formattedMileage}`;

                //     const firstRegistration = item.first_registration_date
                //         ? moment(item.first_registration_date).format("YYYY-MM-DD")
                //         : null;

                //     const consumptionValue = item.consumption
                //         ? (String(item.consumption).toLowerCase().includes("l") ? item.consumption : `${item.consumption} L / 100 Km`)
                //         : null;

                //     const accountType = item.account_type || null;
                //     const sellerAddress = [item.fullAddress, [item.pincode, item.city].filter(Boolean).join(" ")]
                //         .filter(Boolean)
                //         .join(", ");

                //     return {
                //         id: item.id,
                //         fullModel,
                //         carReel: item.carReel,
                //         reelThumbnails: item.reelThumbnails,
                //         isSavedReel,
                //         carReelInfo,

                //         // new fields
                //         price: formattedPrice,
                //          
                //         mileage: formattedMileage,
                //         firstRegistration,
                //         fuelType: item.fuel_type_value || null,
                //         power: item.powerOutput || (item.power_ps ? `${item.power_ps} ps` : (item.power_kw ? `${item.power_kw} kw` : null)),
                //         transmission: item.transmission_value || null,
                //         consumption: consumptionValue,
                //         accountType,
                //         sellerAddress: sellerAddress || null,
                //         sellerRating: item.seller_rating ?? null,
                //         sellerLogo: item.seller_profile_image || null
                //     };

                // })

                paginatedData.map(async (item) => {

                    if (item.reelType === "profile") {

                        return {
                            reelType: "profile",

                            id: item.id,

                            fullModel: null,

                            carReel: item.reel_url,
                            reelThumbnails: item.thumbnail,

                            isSavedReel: false,
                            carReelInfo: null,

                            price: null,
                            year: null,
                            mileage: null,
                            firstRegistration: null,

                            fuelType: null,
                            power: null,
                            transmission: null,
                            consumption: null,

                            accountType: null,
                            sellerAddress: null,
                            sellerRating: null,
                            sellerLogo: null,

                            captions: item.captions || null,

                            user_id: item.user_id,
                            createdAt: item.createdAt
                        };
                    }

                    const fetchReelsSaved = await fetchSavedReelsByCurrentUserLoggendIn(
                        id,
                        item.id
                    );

                    const isSavedReel = fetchReelsSaved.length > 0;

                    const formattedPrice = getChfFormattedPrice(item.selling_price);

                    const formattedMileage = item.carMileage
                        ? `${Number(item.carMileage).toLocaleString("en-US")} km`
                        : null;

                    const fullModel =
                        `${item.brandName} ${item.carModel}`.trim();
                    const accountType = item.account_type || null;

                    const carReelInfo =
                        `${formattedPrice} | ${item.fuel_type_value} | ${formattedMileage}`;

                    const consumptionValue = item.consumption ? (String(item.consumption).toLowerCase().includes("l") ? item.consumption : `${item.consumption} L / 100 Km`) : null;

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
                        reelType: "car",

                        id: item.id,
                        fullModel,
                        carReel: item.carReel,
                        reelThumbnails: item.reelThumbnails,
                        isSavedReel,
                        carReelInfo,
                        power: power,
                        price: formattedPrice,
                        year: item.selectYear || null,
                        mileage: formattedMileage,
                        fuelType: item.fuel_type_value || null,
                        transmission: item.transmission_value || null,
                        consumption: consumptionValue,
                        sellerLogo: item.seller_profile_image || null,
                        sellerRating: item.seller_rating ?? null,
                        accountType: item.account_type || null,
                        sellerAddress: sellerAddress || null,
                        sellerName: item.fullName || null
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
