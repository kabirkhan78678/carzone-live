import { getYearRangeAnalyticsModel } from '../../models/user.model.js';
import { getYearFacetModel, getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage, parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';

export const getYearRangeAnalytics = async (req, res) => {
    try {
        const lang = req.query.lang || 'en';
        const selectedRange = parseSelectedRange(
            req.query.selected_ids,
            req.query.from_year,
            req.query.to_year
        );
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const hasLegacyRangeParams =
            req.query.from_year !== undefined || req.query.to_year !== undefined;
        // commented by raj for faceted filters:
        const shouldUseFacetedMode =
            hasActiveFiltersInQuery(req) || selectedRange.hasSelection || !hasLegacyRangeParams;

        if (shouldUseFacetedMode) {
            const facetFilters = { ...normalizedFilters };
            const activeYearRange = normalizedFilters?.year || {};
            const hasActiveYearSelection =
                activeYearRange.min !== null && activeYearRange.min !== undefined ||
                activeYearRange.max !== null && activeYearRange.max !== undefined;
            const hasExplicitRangeSelection = selectedRange.hasSelection || hasActiveYearSelection;

            if (selectedRange.hasSelection) {
                facetFilters.year = { min: selectedRange.min, max: selectedRange.max };
            } else if (hasActiveYearSelection) {
                facetFilters.year = {
                    min: activeYearRange.min ?? null,
                    max: activeYearRange.max ?? null
                };
            } else {
                delete facetFilters.year; // no default year range apply
            }

            const yearFacet = await getYearFacetModel(facetFilters);
            const totalCars = await getFacetedTotalCarsModel(facetFilters);

            const resolvedFromYear = hasExplicitRangeSelection
                ? (facetFilters.year?.min ?? yearFacet?.min_value ?? null)
                : null;
            const resolvedToYear = hasExplicitRangeSelection
                ? (facetFilters.year?.max ?? yearFacet?.max_value ?? null)
                : null;

            const breakdown = hasExplicitRangeSelection
                ? {
                    within_range: {
                        label: `${resolvedFromYear} - ${resolvedToYear}`,
                        count: yearFacet?.breakdown?.selected_count || 0
                    },
                    older_models: {
                        label: `Before ${resolvedFromYear}`,
                        count: yearFacet?.breakdown?.lower_count || 0
                    },
                    newer_models: {
                        label: `After ${resolvedToYear}`,
                        count: yearFacet?.breakdown?.higher_count || 0
                    }
                }
                : {
                    within_range: {
                        label: "Selected year",
                        count: totalCars
                    },
                    older_models: {
                        label: "Older models",
                        count: 0
                    },
                    newer_models: {
                        label: "Newer models",
                        count: 0
                    }
                };

            const response = {
                selected_range: hasExplicitRangeSelection
                    ? {
                        from_year: resolvedFromYear,
                        to_year: resolvedToYear,
                        total_cars: totalCars
                    }
                    : null,
                breakdown,
                total_cars_all_years: hasExplicitRangeSelection
                    ? (yearFacet?.total_cars || totalCars)
                    : totalCars
            };

            return handleSuccess(
                res,
                200,
                getMessage(lang, variableTypes.DATA_FETCHED_SUCCESSFULLY),
                response
            );
        }

        const from_year = parseInt(req.query.from_year);
        const to_year = parseInt(req.query.to_year);

        // validation not null
        if (!from_year || !to_year) {
            return handleError(res, 400, "Both from_year and to_year are required");
        }
        if (from_year > to_year) {
            return handleError(res, 400, "from_year cannot be greater than to_years");
        }

        // Gert year range analytics from database 
        const analytics = await getYearRangeAnalyticsModel(from_year, to_year);
        const response = {
            selected_range: {
                from_year,
                to_year,
                total_cars: analytics.selected_range_count
            },
            breakdown: {
                within_range: {
                    label: `${from_year} - ${to_year}`,
                    count: analytics.selected_range_count
                },
                older_models: {
                    label: `Before ${from_year}`,
                    count: analytics.older_count
                },
                newer_models: {
                    label: `After ${to_year}`,
                    count: analytics.newer_count
                }
            },
            total_cars_all_years: analytics.total_cars
        };
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FETCHED_SUCCESSFULLY)
            , response
        );
    } catch (error) {
        console.error("Get Year Range Analytics Error:", error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

// code by raj kilometeres range filter
