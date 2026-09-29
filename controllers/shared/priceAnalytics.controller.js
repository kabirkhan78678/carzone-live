import { getMessage, parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getPriceRangeAnalyticsModel } from '../../models/user.model.js';
import { getPriceFacetModel, getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';

export const getPriceRangeAnalytics = async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const car_price_from = parseFloat(req.query.car_price_from);
        const car_price_to = parseFloat(req.query.car_price_to);
        const priceType = String(req.query.price_type || "purchase").toLowerCase() === "leasing"
            ? "leasing"
            : "purchase";
        const selectedRange = parseSelectedRange(req.query.selected_ids, car_price_from, car_price_to);
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const hasLegacyRangeParams =
            req.query.car_price_from !== undefined || req.query.car_price_to !== undefined;
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
                    type: priceType
                };
            } else if (hasActivePriceSelection) {
                facetFilters.price = {
                    min: activePrice.min ?? null,
                    max: activePrice.max ?? null,
                    type: priceType
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

            const response = {
                price_range: hasExplicitRangeSelection
                    ? {
                        from: resolvedFromPrice,
                        to: resolvedToPrice,
                        type: priceType,
                        label: `CHF ${resolvedFromPrice} - CHF ${resolvedToPrice}`
                    }
                    : null,
                matching_vehicles: totalCars
            };

            return res.status(200).json({
                success: true,
                message: "Price range analytics fetched successfully",
                data: response
            });
        }

        // Validation - both are required
        if (!car_price_from || !car_price_to) {
            return res.status(400).json({
                success: false,
                message: "Both car_price_from and car_price_to are required"
            });
        }

        if (car_price_from < 0 || car_price_to < 0) {
            return res.status(400).json({
                success: false,
                message: "Prices must be greater than 0"
            });
        }

        if (car_price_from > car_price_to) {
            return res.status(400).json({
                success: false,
                message: "car_price_from cannot be greater than car_price_to"
            });
        }

        // Get matching vehicles count from database
        const analytics = await getPriceRangeAnalyticsModel(car_price_from, car_price_to);

        const response = {
            price_range: {
                from: car_price_from,
                to: car_price_to,
                label: `CHF ${car_price_from} - CHF ${car_price_to}`
            },
            matching_vehicles: analytics.matching_vehicles_count
        };

        return res.status(200).json({
            success: true,
            message: "Price range analytics fetched successfully",
            data: response
        });

    } catch (error) {
        console.error("❌ Get Price Range Analytics Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// code by raj for faceted filters
