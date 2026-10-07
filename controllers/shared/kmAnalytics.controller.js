import { getMessage, parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getKilometersRangeAnalyticsModel } from '../../models/user.model.js';
import { getMileageFacetModel, getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';

export const getKilometersRangeAnalytics = async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const from_km = parseInt(req.query.from_km);
        const to_km = parseInt(req.query.to_km);
        const selectedRange = parseSelectedRange(req.query.selected_ids, from_km, to_km);
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const hasLegacyRangeParams =
            req.query.from_km !== undefined || req.query.to_km !== undefined;
        // commented by raj for faceted filters:
        const shouldUseFacetedMode =
            hasActiveFiltersInQuery(req) || selectedRange.hasSelection || !hasLegacyRangeParams;

        if (shouldUseFacetedMode) {
            const facetFilters = { ...normalizedFilters };
            const activeMileage = normalizedFilters?.mileage || {};
            const hasActiveMileageSelection =
                activeMileage.min !== null && activeMileage.min !== undefined ||
                activeMileage.max !== null && activeMileage.max !== undefined;
            const hasExplicitRangeSelection = selectedRange.hasSelection || hasActiveMileageSelection;

            if (selectedRange.hasSelection) {
                facetFilters.mileage = { min: selectedRange.min, max: selectedRange.max };
            } else if (hasActiveMileageSelection) {
                facetFilters.mileage = {
                    min: activeMileage.min ?? null,
                    max: activeMileage.max ?? null
                };
            } else {
                delete facetFilters.mileage;
            }

            const mileageFacet = await getMileageFacetModel(facetFilters);
            const totalCars = await getFacetedTotalCarsModel(facetFilters);
            const resolvedFromKm = hasExplicitRangeSelection
                ? (facetFilters.mileage?.min ?? mileageFacet?.min_value ?? null)
                : null;
            const resolvedToKm = hasExplicitRangeSelection
                ? (facetFilters.mileage?.max ?? mileageFacet?.max_value ?? null)
                : null;

            const response = {
                selected_range: hasExplicitRangeSelection
                    ? {
                        from_km: resolvedFromKm,
                        to_km: resolvedToKm,
                        total_cars: totalCars,
                        label: `${resolvedFromKm} - ${resolvedToKm} Km`
                    }
                    : null,
                breakdown: hasExplicitRangeSelection
                    ? {
                        selected_mileage: {
                            label: "Selected mileage",
                            count: mileageFacet?.breakdown?.selected_count || 0
                        },
                        higher_mileage: {
                            label: "Higher Mileage",
                            count: mileageFacet?.breakdown?.higher_count || 0
                        },
                        lower_mileage: {
                            label: "Lower Mileage",
                            count: mileageFacet?.breakdown?.lower_count || 0
                        }
                    }
                    : {
                        selected_mileage: {
                            label: "Selected mileage",
                            count: totalCars
                        },
                        higher_mileage: {
                            label: "Higher Mileage",
                            count: 0
                        },
                        lower_mileage: {
                            label: "Lower Mileage",
                            count: 0
                        }
                    },
                cars_found: totalCars,
                total_cars_all_mileage: totalCars
            };

            return res.status(200).json({
                success: true,
                message: "Kilometers range analytics fetched successfully",
                data: response
            });
        }

        console.log('🔍 Kilometers Range Request:', { from_km, to_km, lang });

        // Validation
        if (!from_km || !to_km) {
            return res.status(400).json({
                success: false,
                message: "Both from_km and to_km are required"
            });
        }

        if (from_km >= to_km) {
            return res.status(400).json({
                success: false,
                message: "from_km cannot be greater than to_km"
            });
        }

        // Get kilometers range analytics from database
        console.log('📊 Calling model with:', { from_km, to_km });
        const analytics = await getKilometersRangeAnalyticsModel(from_km, to_km);
        console.log('📈 Analytics result:', analytics);

        const response = {
            selected_range: {
                from_km,
                to_km,
                total_cars: analytics.selected_range_count,
                label: `${from_km} - ${to_km} Km`
            },
            breakdown: {
                selected_mileage: {
                    label: "Selected mileage",
                    count: analytics.selected_range_count
                },
                higher_mileage: {
                    label: "Higher Mileage",
                    count: analytics.higher_mileage_count
                },
                lower_mileage: {
                    label: "Lower Mileage",
                    count: analytics.lower_mileage_count
                }
            },
            cars_found: analytics.selected_range_count,
            total_cars_all_mileage: analytics.total_cars
        };

        return res.status(200).json({
            success: true,
            message: "Kilometers range analytics fetched successfully",
            data: response
        });

    } catch (error) {
        console.error("❌ Get Kilometers Range Analytics Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// code by raj
// Price range analytics
