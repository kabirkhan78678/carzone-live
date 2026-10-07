import { fetchCarsByIdsWithSellerDetails, fetchCarImagesByCarId, fetchWishlistCarIdsByUserId } from '../../models/user.model.js';
import { getFilteredCarsByAllFilters } from '../../models/facetedFilter.model.js';
import jwt from 'jsonwebtoken';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { createSavedSearch } from '../../models/user/savedSearch.model.js';

export const getFacetedFilters = async (req, res) => {

    try {
        const lang = req.body?.lang || req.query?.lang || "en";
        let viewerUserIdFromToken = null;
        if (!req.user?.id) {
            const authHeader = req.headers?.authorization || req.headers?.Authorization;
            if (authHeader && String(authHeader).startsWith("Bearer ")) {
                const token = String(authHeader).split(" ")[1];

                try {
                    const secret = process.env.AUTH_SECRETKEY || process.env.JWT_SECRET || "default_jwt_secret_key";
                    let decoded;
                    try {
                        decoded = jwt.verify(token, secret);
                    } catch (e) {
                        if (process.env.JWT_SECRET) {
                            decoded = jwt.verify(token, process.env.JWT_SECRET);
                        }
                    }
                    const tokenUserId = Number(decoded?.data?.id || decoded?.id || decoded?.userId);
                    if (Number.isFinite(tokenUserId) && tokenUserId > 0) {
                        viewerUserIdFromToken = tokenUserId;
                    }
                }
                catch (error) {
                    viewerUserIdFromToken = null;
                }
            }
        }
        const viewerUserIdRaw =
            req.user?.id ??
            viewerUserIdFromToken ??
            req.body?.user_id ??
            req.body?.userId ??
            req.body?.buyer_user_id ??
            req.query?.user_id ??
            req.query?.userId;
        const viewerUserId = Number(viewerUserIdRaw);
        const normalizedViewerUserId =
            Number.isFinite(viewerUserId) && viewerUserId > 0 ? viewerUserId : null;

        console.log("[facetedFilters] normalizedViewerUserId:", normalizedViewerUserId, "save_search:", req.body?.save_search || req.body?.saveSearch);

        const {
            brandName,
            carModel,
            fuel_type_id,
            price_range,
            kilometers_range,
            year_range,
            leasing_rate,
            state_id,
            accident_vehicle,
            body_type_id,
            transmission,
            drive_type,
            powerOutput,
            cubicCapacity,
            cylinders,
            wltp_range,
            battery_capacity,
            tower_capacity,
            total_weight,
            empty_weight,
            exterior_color,
            interior_color,
            seats,
            doors,
            consumption,
            co2_Emission,
            energy_efficiency,
            age_listing,
            seller_type,
            mfk,
            warranty,
            // EXTRAS
            extras,
            extra_filters,
            extraFilters,
            extras_filters,

            // CAR TYPE / SWISS VEHICLE
            car_type,
            carType,
            is_swiss_vehicle,
            isSwissVehicle,

            // QUALITY SEAL
            quality_seals,
            quality_seal_ids,
            quality_seal,
            quality_seal_id,

            // SORT
            sort_key
        } = req.body;

        //     fuel_type : "",
        //     is_fuel_type : false 
        // }

        const hasSelection = (v) =>
            Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== "";

        const toNullableNumber = (value) => {
            if (value === null || value === undefined || value === "") return null;
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        };

        const normalizeRange = (rangeObj, minKey, maxKey) => {
            const min = toNullableNumber(rangeObj?.[minKey]);
            const max = toNullableNumber(rangeObj?.[maxKey]);
            return {
                min,
                max,
                // Keep legacy BETWEEN behavior: apply only when both bounds are present.
                hasSelection: min !== null && max !== null
            };
        };
        const normalizePowerUnit = (value) =>
            String(value || "PS").trim().toUpperCase() === "KW" ? "KW" : "PS";

        const kmRange = normalizeRange(kilometers_range, "min_km", "max_km");
        const yearRange = normalizeRange(year_range, "min_year", "max_year");
        const leasingRange = normalizeRange(leasing_rate, "min_price", "max_price");
        const priceRange = normalizeRange(price_range, "min_price", "max_price");
        const powerRange = normalizeRange(powerOutput, "min_po", "max_po");
        const cubicRange = normalizeRange(cubicCapacity, "min_cc", "max_cc");
        const cylindersRange = normalizeRange(cylinders, "min_cy", "max_cy");
        const wltpRange = normalizeRange(wltp_range, "min_wltp", "max_wltp");
        const batteryRange = normalizeRange(battery_capacity, "min_battery", "max_battery");
        const towingRange = normalizeRange(tower_capacity, "min_tc", "max_tc");
        const totalWeightRange = normalizeRange(total_weight, "min_tw", "max_tw");
        const emptyWeightRange = normalizeRange(empty_weight, "min_ew", "max_ew");
        const seatsRange = normalizeRange(seats, "min_seats", "max_seats");
        const doorsRange = normalizeRange(doors, "min_doors", "max_doors");
        const consumptionRange = normalizeRange(consumption, "min_cons", "max_cons");
        const co2Range = normalizeRange(co2_Emission, "min_co2", "max_co2");
        const sortKey = (
            Array.isArray(sort_key)
                ? sort_key
                : sort_key
                    ? String(sort_key).split(",")
                    : []
        )
            .map((key) => String(key).trim().toLowerCase())
            .filter(Boolean);

        if (!sortKey.length) {
            sortKey.push("published_most_recent");
        }

        var fuelFilter = {
            fuel_type: fuel_type_id,
            is_fuel_type: hasSelection(fuel_type_id)
        };

        var brandNameFilter = {
            brandName: brandName,
            is_brand_name: brandName ? true : false
        };

        var carModelFilter = {
            carModel: carModel,
            is_car_model: carModel ? true : false
        };

        var kilometerFilter = {
            min_km: kmRange.min,
            max_km: kmRange.max,
            is_km_type: kmRange.hasSelection
        }

        var yearFilter = {
            min_year: yearRange.min,
            max_year: yearRange.max,
            is_year_type: yearRange.hasSelection
        }

        var leasingFilter = {
            min_price: leasingRange.min,
            max_price: leasingRange.max,
            is_leasing_type: leasingRange.hasSelection
        };

        var priceFilter = {
            min_price: priceRange.min,
            max_price: priceRange.max,
            is_price_type: priceRange.hasSelection
        };

        var driveFilter = {
            drive_type: drive_type,
            is_drive_type: drive_type ? true : false
        };

        var stateFilter = {
            state_id: state_id,
            is_state_type: state_id ? true : false
        };

        var accidentFilter = {
            accident_vehicle: accident_vehicle,
            is_accident_type: accident_vehicle !== undefined && accident_vehicle !== null
        };

        var bodyTypeFilter = {
            body_type_id: body_type_id,
            is_body_type: body_type_id ? true : false
        };

        var transmissionFilter = {
            transmission_id: transmission,
            is_transmission: transmission ? true : false
        };

        var powerFilter = {
            min_po: powerRange.min,
            max_po: powerRange.max,
            unit: normalizePowerUnit(powerOutput?.unit ?? req.body?.power_unit),
            is_power_type: powerRange.hasSelection
        };

        var cubicFilter = {
            min_cc: cubicRange.min,
            max_cc: cubicRange.max,
            is_cubic_type: cubicRange.hasSelection
        };

        var cylindersFilter = {
            min_cy: cylindersRange.min,
            max_cy: cylindersRange.max,
            is_cylinders_type: cylindersRange.hasSelection
        };

        var wltpFilter = {
            min_wltp: wltpRange.min,
            max_wltp: wltpRange.max,
            is_wltp_type: wltpRange.hasSelection
        };

        var batteryFilter = {
            min_battery: batteryRange.min,
            max_battery: batteryRange.max,
            is_battery_type: batteryRange.hasSelection
        };

        var towingFilter = {
            min_tc: towingRange.min,
            max_tc: towingRange.max,
            is_towing_type: towingRange.hasSelection
        };

        var totalWeightFilter = {
            min_tw: totalWeightRange.min,
            max_tw: totalWeightRange.max,
            is_total_weight_type: totalWeightRange.hasSelection
        };

        var emptyWeightFilter = {
            min_ew: emptyWeightRange.min,
            max_ew: emptyWeightRange.max,
            is_empty_weight_type: emptyWeightRange.hasSelection
        };

        var seatsFilter = {
            min_seats: seatsRange.min,
            max_seats: seatsRange.max,
            is_seat_type: seatsRange.hasSelection
        };

        var doorsFilter = {
            min_doors: doorsRange.min,
            max_doors: doorsRange.max,
            is_door_type: doorsRange.hasSelection
        };

        var co2Filter = {
            min_co2: co2Range.min,
            max_co2: co2Range.max,
            is_co2_type: co2Range.hasSelection
        };

        var energyFilter = {
            energy_efficiency: energy_efficiency,
            is_energy_type: energy_efficiency ? true : false
        };

        var exteriorColorFilter = {
            exterior_color: exterior_color,
            is_exterior_color: exterior_color ? true : false
        };

        var interiorColorFilter = {
            interior_color: interior_color,
            is_interior_color: interior_color ? true : false
        };

        var consumptionFilter = {
            min_cons: consumptionRange.min,
            max_cons: consumptionRange.max,
            is_consumption_type: consumptionRange.hasSelection
        };

        var ageFilter = {
            age_listing: age_listing,
            is_age_type: age_listing !== undefined && age_listing !== null
        };

        const normalizeSellerTypeInput = (v) => {
            if (v === undefined || v === null) return [];
            if (Array.isArray(v))
                return v
                    .map((x) => String(x).trim().toLowerCase())
                    .filter((s) => s && s !== "all");
            const s = String(v).trim().toLowerCase();
            return s && s !== "all" ? [s] : [];
        };

        const normalizedSellerType = normalizeSellerTypeInput(seller_type);

        var sellerTypeFilter = {
            seller_type: normalizedSellerType,
            is_seller_type: normalizedSellerType.length > 0
        };

        const mfkFilter = {
            mfk: mfk,
            is_mfk: mfk === true || mfk === 1 || mfk === "1" || mfk === "true"
        };

        const warrantyFilter = {
            warranty: warranty,
            is_warranty:
                warranty === true ||
                warranty === 1 ||
                warranty === "1" ||
                warranty === "true"
        };

        const normalizeExtraFiltersInput = (value) => {
            if (value === undefined || value === null || value === "") return [];
            const values = Array.isArray(value) ? value : String(value).split(",");
            return values
                .map((item) => Number(String(item).trim()))
                .filter((item) => Number.isFinite(item) && item > 0);
        };

        const normalizedExtraFilters = normalizeExtraFiltersInput(extra_filters ?? extraFilters ?? extras_filters ?? extras);

        const extraFiltersFilter = {
            extra_filters: normalizedExtraFilters,
            is_extra_filters: normalizedExtraFilters.length > 0
        };

        const normalizeExtrasInput = (value) => {
            if (value === undefined || value === null || value === "") return [];
            const rawList = Array.isArray(value) ? value : String(value).split(",");
            return rawList
                .map((v) => String(v).trim())
                .filter((v) => v.length > 0 && !/^\d+$/.test(v));
        };

        const normalizedExtras = normalizeExtrasInput(extras);

        const extrasFilter = {
            extras: normalizedExtras,
            is_extras: normalizedExtras.length > 0
        };

        const isOnlyCh =
            car_type === "only_ch_cars" ||
            car_type === "ch" ||
            carType === "only_ch_cars" ||
            carType === "ch" ||
            is_swiss_vehicle === true ||
            is_swiss_vehicle === 1 ||
            is_swiss_vehicle === "1" ||
            is_swiss_vehicle === "true" ||
            isSwissVehicle === true ||
            isSwissVehicle === 1 ||
            isSwissVehicle === "1" ||
            isSwissVehicle === "true";

        const carTypeFilter = {
            car_type: isOnlyCh ? "only_ch_cars" : (car_type || carType || "all_standard"),
            is_only_ch: isOnlyCh
        };

        const normalizedQualitySealIds = normalizeExtraFiltersInput(quality_seal_ids ?? quality_seals ?? quality_seal ?? quality_seal_id);

        const qualitySealFilter = {
            quality_seal_ids: normalizedQualitySealIds,
            is_quality_seal: normalizedQualitySealIds.length > 0
        };

        const filterResult = await getFilteredCarsByAllFilters(
            brandNameFilter,
            carModelFilter,
            fuelFilter,
            yearFilter,
            kilometerFilter,
            priceFilter,
            leasingFilter,
            driveFilter,
            stateFilter,
            accidentFilter,
            bodyTypeFilter,
            transmissionFilter,
            powerFilter,
            cubicFilter,
            cylindersFilter,
            wltpFilter,
            batteryFilter,
            towingFilter,
            totalWeightFilter,
            emptyWeightFilter,
            seatsFilter,
            doorsFilter,
            co2Filter,
            energyFilter,
            exteriorColorFilter,
            interiorColorFilter,
            consumptionFilter,
            ageFilter,
            sellerTypeFilter,
            mfkFilter,
            warrantyFilter,
            extrasFilter,
            extraFiltersFilter,
            normalizedViewerUserId,
            !!normalizedViewerUserId, // excludeCurrentUser (exclude logged in user's own cars)
            // SORT KEY
            sortKey,
            carTypeFilter,
            qualitySealFilter
        )

        if (filterResult.length > 0) {
            const carIds = [...new Set(filterResult.map((row) => row.id).filter(Boolean))];
            if (carIds.length === 0) {
                return handleSuccess(res, 200, "filtered data fetched successfully", []);
            }

            let data = await fetchCarsByIdsWithSellerDetails(carIds, lang);

            const carOrderMap = new Map(
                carIds.map((id, index) => [Number(id), index])
            );

            data.sort((a, b) => {
                return (
                    (carOrderMap.get(Number(a.id)) ?? Number.MAX_SAFE_INTEGER) -
                    (carOrderMap.get(Number(b.id)) ?? Number.MAX_SAFE_INTEGER)
                );
            });

            if (data.length) {
                let wishlistCarIds = new Set();
                if (normalizedViewerUserId) {
                    try {
                        const carIds = data.map(item => item.id).filter(Boolean);
                        const wishlisted = await fetchWishlistCarIdsByUserId(normalizedViewerUserId, carIds);
                        wishlistCarIds = new Set(wishlisted);
                    } catch (wishlistErr) {
                        console.error("[facetedFilters] Error fetching wishlist:", wishlistErr);
                    }
                }

                data = await Promise.all(
                    data.map(async (item) => {
                        const carImages = await fetchCarImagesByCarId(item.id);
                        const sellerName = item.companyName || item.fullName || null;
                        const normalizedSellerType =
                            item.seller_type === "personal"
                                ? "private"
                                : item.seller_type === "business"
                                    ? "company"
                                    : item.seller_type;

                        return {
                            ...item,
                            seller_type: normalizedSellerType,
                            sellerName,
                            warranty_type_id: item.warranty_type_id_resolved ?? item.warranty_type_text ?? null,
                            warranty_type_value: item.warranty_type_value ?? null,
                            warranty_value: item.warranty_value ?? null,
                            quality_seal_id: item.quality_seal_id_resolved ?? item.quality_seal_id ?? null,
                            quality_seal_name: item.quality_seal_name ?? null,
                            quality_seal_image: item.quality_seal_image ?? null,
                            quality_seal_description: item.quality_seal_description ?? null,
                            quality_seal: item.quality_seal_id_resolved ? {
                                id: item.quality_seal_id_resolved,
                                name: item.quality_seal_name,
                                image: item.quality_seal_image,
                                description: item.quality_seal_description
                            } : null,
                            leasing_value: item.leasing_value ?? item.leasingPrice ?? null,
                            annual_interest_rate: item.annual_interest_rate ?? null,
                            residual_value: item.residual_value ?? null,
                            isWishlist: wishlistCarIds.has(Number(item.id)),
                            carImages: carImages.map(img => img.images),
                            sellerDetails: {
                                sellerId: item.seller_id,
                                role: item.role,
                                sellerType: normalizedSellerType,
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
                    delete item.quality_seal_id_resolved;
                });
            }

            // Optional: Save search criteria for new matching car notifications if requested
            const shouldSaveSearch =
                req.body?.save_search === true ||
                req.body?.save_search === "true" ||
                req.body?.save_search === 1 ||
                req.body?.saveSearch === true ||
                req.body?.saveSearch === "true" ||
                req.body?.saveSearch === 1 ||
                req.body?.is_save_search === true ||
                req.body?.is_save_search === "true" ||
                req.body?.is_save_search === 1 ||
                Boolean(req.body?.search_name);

            console.log('[facetedFilters] Checking shouldSaveSearch:', shouldSaveSearch, 'normalizedViewerUserId:', normalizedViewerUserId);

            if (shouldSaveSearch && normalizedViewerUserId) {
                const searchTitle = req.body?.search_name || [brandName, carModel].filter(Boolean).join(' ') || 'Saved Filter Search';
                const filterCriteriaToSave = {
                    brandName: brandName || undefined,
                    carModel: carModel || undefined,
                    fuel_type_id: fuel_type_id || undefined,
                    price_range: price_range || undefined,
                    min_price: priceRange.min ?? undefined,
                    max_price: priceRange.max ?? undefined,
                    kilometers_range: kilometers_range || undefined,
                    min_km: kmRange.min ?? undefined,
                    max_km: kmRange.max ?? undefined,
                    year_range: year_range || undefined,
                    min_year: yearRange.min ?? undefined,
                    max_year: yearRange.max ?? undefined,
                    transmission_id: transmission || undefined,
                    body_type_id: body_type_id || undefined,
                    drive_type: drive_type || undefined,
                    state_id: state_id || undefined,
                    accident_vehicle: accident_vehicle ?? undefined,
                    exterior_color: exterior_color || undefined,
                    interior_color: interior_color || undefined,
                    car_type: isOnlyCh ? "only_ch_cars" : undefined
                };

                try {
                    const savedRes = await createSavedSearch(normalizedViewerUserId, searchTitle, filterCriteriaToSave);
                    console.log('[facetedFilters] ✅ Successfully saved search criteria:', savedRes);
                } catch (err) {
                    console.error('[facetedFilters] ❌ Error saving search criteria:', err);
                }
            }

            return handleSuccess(res, 200, "filtered data fetched successfully", data || []);
        }

        // Auto-save search in tbl_saved_searches when car is not available in database (0 results found)
        if (normalizedViewerUserId && (brandName || carModel || fuel_type_id || price_range || year_range)) {
            const searchTitle = req.body?.search_name || [
                Array.isArray(brandName) ? brandName.join(', ') : brandName,
                Array.isArray(carModel) ? carModel.join(', ') : carModel
            ].filter(Boolean).join(' ') || 'Auto-Saved Search Alert';

            const filterCriteriaToSave = {
                brandName: brandName || undefined,
                carModel: carModel || undefined,
                fuel_type_id: fuel_type_id || undefined,
                price_range: price_range || undefined,
                min_price: priceRange.min ?? undefined,
                max_price: priceRange.max ?? undefined,
                kilometers_range: kilometers_range || undefined,
                min_km: kmRange.min ?? undefined,
                max_km: kmRange.max ?? undefined,
                year_range: year_range || undefined,
                min_year: yearRange.min ?? undefined,
                max_year: yearRange.max ?? undefined,
                transmission_id: transmission || undefined,
                body_type_id: body_type_id || undefined,
                drive_type: drive_type || undefined,
                state_id: state_id || undefined,
                accident_vehicle: accident_vehicle ?? undefined,
                exterior_color: exterior_color || undefined,
                interior_color: interior_color || undefined,
                car_type: isOnlyCh ? "only_ch_cars" : undefined
            };

            try {
                const savedRes = await createSavedSearch(normalizedViewerUserId, searchTitle, filterCriteriaToSave);
                console.log('[facetedFilters] 🚗 Car not in DB -> Auto-saved search for user', normalizedViewerUserId, ':', savedRes);
            } catch (err) {
                console.error('[facetedFilters] ❌ Error auto-saving search:', err);
            }
        }

        return handleSuccess(res, 200, "filtered data fetched successfully", []);

    }
    catch (error) {
        console.error("Faceted filters error:", error);
        return handleError(res, 500, "Internal server error");
    }
};
