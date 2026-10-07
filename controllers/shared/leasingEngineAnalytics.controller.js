import { getMessage, parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { getEnginePowerFacetModel, getFacetedTotalCarsModel, getPriceFacetModel } from '../../models/facetedFilter.model.js';
import { updateCarCoordinates, getLeasingRangeAnalyticsModel } from '../../models/user.model.js';
import db from '../../config/db.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';

export const calculateLeasing = async (req, res) => {
    try {
        const { car_id, price, duration, lease_duration_months, km_per_year = 10000, down_payment = 0 } = req.body;
        let basePrice = Number(price);

        if ((!basePrice || isNaN(basePrice)) && car_id) {
            const rows = await db.query(
                `SELECT selling_price, new_price FROM tbl_cars WHERE id = ? LIMIT 1`,
                [car_id]
            );
            if (rows.length > 0) {
                const car = rows[0];
                basePrice = (Number(car.new_price) > 0) ? Number(car.new_price) : Number(car.selling_price);
            }
        }

        if (!basePrice || isNaN(basePrice)) basePrice = 25000;

        const interestRate = 10.0;
        const residualPercent = 60.0;
        const months = Number(lease_duration_months || duration || 36);
        const down = Number(down_payment);

        let kmMultiplier = 1.0;
        if (km_per_year >= 15000) kmMultiplier = 0.95;
        if (km_per_year >= 20000) kmMultiplier = 0.90;

        const residualValue = (basePrice * (residualPercent / 100)) * kmMultiplier;
        const capCost = basePrice - down;

        const monthlyDepreciation = (capCost - residualValue) / (months || 1);
        const monthlyInterest = (capCost + residualValue) * (interestRate / 2400);
        const totalMonthly = monthlyDepreciation + monthlyInterest;

        if (car_id) {
            await db.query(
                `
          INSERT INTO tbl_car_leasing 
          (car_id, lease_duration_months, km_per_year, down_payment, monthly_price, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE 
          lease_duration_months = VALUES(lease_duration_months),
          km_per_year = VALUES(km_per_year),
          down_payment = VALUES(down_payment),
          monthly_price = VALUES(monthly_price)
          `,
                [car_id, months, km_per_year, down, totalMonthly.toFixed(2)]
            );
        }

        return res.json({
            success: true,
            status: 200,
            monthly_price: totalMonthly.toFixed(2),
            details: {
                basePrice,
                residualValue: residualValue.toFixed(2),
                interestRate: interestRate + "%"
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const addLatLong = async (req, res) => {
    try {
        const { carId, location, latitude, longitude } = req.body;
        let lat = latitude;
        let lon = longitude;

        if ((lat === undefined || lon === undefined || lat === null || lon === null) && location) {
            try {
                if (typeof geocoder !== 'undefined') {
                    const geoRes = await geocoder.geocode(location);
                    if (geoRes && geoRes.length > 0) {
                        lat = geoRes[0].latitude;
                        lon = geoRes[0].longitude;
                    }
                }
            } catch (geoErr) {
                console.warn("Geocoding failed:", geoErr.message);
            }
        }

        if (lat === undefined || lon === undefined || lat === null || lon === null) {
            return handleError(res, 400, "Location or latitude/longitude is required");
        }

        if (carId) {
            await updateCarCoordinates(carId, lat, lon);
        }

        return res.json({
            success: true,
            status: 200,
            coordinates: { lat, lon }
        });

    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getEnginePowerAnalytics = async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const selectedRange = parseSelectedRange(
            req.query.selected_ids,
            req.query.min_power,
            req.query.max_power
        );
        const inputUnit = String(req.query.unit || req.query.power_unit || "PS").toUpperCase() === "KW"
            ? "KW"
            : "PS";

        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const activePower = normalizedFilters?.engine_power || {};
        const hasActivePowerSelection =
            activePower.min !== null && activePower.min !== undefined ||
            activePower.max !== null && activePower.max !== undefined;
        const hasExplicitRangeSelection = selectedRange.hasSelection || hasActivePowerSelection;

        const facetFilters = { ...normalizedFilters };
        if (selectedRange.hasSelection) {
            facetFilters.engine_power = { min: selectedRange.min, max: selectedRange.max, unit: inputUnit };
        } else if (hasActivePowerSelection) {
            facetFilters.engine_power = { min: activePower.min ?? null, max: activePower.max ?? null, unit: inputUnit };
        } else {
            delete facetFilters.engine_power;
        }

        const enginePowerFacet = await getEnginePowerFacetModel(facetFilters);
        const totalCars = await getFacetedTotalCarsModel(facetFilters);
        const totalCarsAllPower = await getFacetedTotalCarsModel(normalizedFilters, "engine_power");
        const resolvedMin = hasExplicitRangeSelection
            ? (facetFilters.engine_power?.min ?? enginePowerFacet?.min_value ?? null)
            : null;
        const resolvedMax = hasExplicitRangeSelection
            ? (facetFilters.engine_power?.max ?? enginePowerFacet?.max_value ?? null)
            : null;

        const response = {
            selected_range: hasExplicitRangeSelection
                ? {
                    from: resolvedMin,
                    to: resolvedMax,
                    unit: inputUnit,
                    total_cars: totalCars,
                    label: `${resolvedMin} - ${resolvedMax} ${inputUnit}`
                }
                : null,
            breakdown: hasExplicitRangeSelection
                ? {
                    selected_power: {
                        label: "Selected power",
                        count: enginePowerFacet?.breakdown?.selected_count || 0
                    },
                    higher_power: {
                        label: "Higher power",
                        count: enginePowerFacet?.breakdown?.higher_count || 0
                    },
                    lower_power: {
                        label: "Lower power",
                        count: enginePowerFacet?.breakdown?.lower_count || 0
                    }
                }
                : {
                    selected_power: {
                        label: "Selected power",
                        count: totalCarsAllPower
                    },
                    higher_power: {
                        label: "Higher power",
                        count: 0
                    },
                    lower_power: {
                        label: "Lower power",
                        count: 0
                    }
                },
            total_cars_all_power: totalCarsAllPower
        };

        return handleSuccess(
            res,
            200,
            "Engine power analytics fetched successfully",
            response,
            lang
        );
    } catch (error) {
        console.error("Engine power analytics error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getLeasingAnalytics = async (req, res) => {
    try {
        const { leasing_price_from, leasing_price_to, min, max, lang = 'en' } = req.query;

        const minInput = min ?? leasing_price_from;
        const maxInput = max ?? leasing_price_to;
        const fromPrice = minInput !== undefined && minInput !== null ? parseFloat(minInput) : null;
        const toPrice = maxInput !== undefined && maxInput !== null ? parseFloat(maxInput) : null;
        const selectedRange = parseSelectedRange(req.query.selected_ids, fromPrice, toPrice);
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const hasLegacyRangeParams =
            req.query.leasing_price_from !== undefined || req.query.leasing_price_to !== undefined;
        // commented by raj for faceted filters:
        const shouldUseFacetedMode =
            hasActiveFiltersInQuery(req) || selectedRange.hasSelection || !hasLegacyRangeParams;

        if (shouldUseFacetedMode) {
            const facetFilters = { ...normalizedFilters };
            const activePrice = normalizedFilters?.price || {};
            const hasActivePriceSelection =
                activePrice.min !== null && activePrice.min !== undefined ||
                activePrice.max !== null && activePrice.max !== undefined;
            const hasExplicitRangeSelection = selectedRange.hasSelection || hasActivePriceSelection;

            if (selectedRange.hasSelection) {
                facetFilters.price = {
                    min: selectedRange.min,
                    max: selectedRange.max,
                    type: "leasing"
                };
            } else if (hasActivePriceSelection) {
                facetFilters.price = {
                    min: activePrice.min ?? null,
                    max: activePrice.max ?? null,
                    type: "leasing"
                };
            } else {
                delete facetFilters.price;
            }

            const priceFacet = hasExplicitRangeSelection
                ? await getPriceFacetModel(facetFilters)
                : null;
            const totalCars = await getFacetedTotalCarsModel(facetFilters);
            const resolvedFromPrice = hasExplicitRangeSelection
                ? (facetFilters.price?.min ?? priceFacet?.min_value ?? null)
                : null;
            const resolvedToPrice = hasExplicitRangeSelection
                ? (facetFilters.price?.max ?? priceFacet?.max_value ?? null)
                : null;

            return handleSuccess(
                res,
                200,
                "Leasing range count fetched successfully",
                {
                    min: resolvedFromPrice,
                    max: resolvedToPrice,
                    matching_vehicles: totalCars
                },
                lang
            );
        }

        const totalCars = await getLeasingRangeAnalyticsModel(fromPrice, toPrice);

        return handleSuccess(
            res,
            200,
            "Leasing range count fetched successfully",
            {
                min: fromPrice,
                max: toPrice,
                matching_vehicles: totalCars
            },
            lang
        );
    } catch (error) {
        console.error("Leasing range analytics error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

//code by raj for listing drop down
