import {
    getCubicCapacityFacetModel,
    getCylindersFacetModel,
    getBatteryCapacityFacetModel,
    getTotalWeightFacetModel,
    getEmptyWeightFacetModel,
    getTowingCapacityFacetModel,
    getWltpRangeFacetModel,
    getConsumptionFacetModel,
    getCo2EmissionFacetModel,
    getFacetedTotalCarsModel
} from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';

const runGenericRangeFacetAnalytics = async (req, res, config) => {
    try {
        const {
            facetKey,
            getFacetModel,
            successMessage,
            selectedLabel,
            lowerLabel,
            higherLabel,
            unit = ""
        } = config;

        const lang = req.query.lang || "en";
        const selectedRange = parseSelectedRange(req.query.selected_ids, req.query.min, req.query.max);

        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const facetFilters = { ...normalizedFilters };

        const activeFacetRange = normalizedFilters?.[facetKey] || {};
        const hasActiveFacetSelection =
            activeFacetRange.min !== null && activeFacetRange.min !== undefined ||
            activeFacetRange.max !== null && activeFacetRange.max !== undefined;

        const hasExplicitRangeSelection = selectedRange.hasSelection || hasActiveFacetSelection;

        if (selectedRange.hasSelection) {
            facetFilters[facetKey] = { min: selectedRange.min, max: selectedRange.max };
        } else if (hasActiveFacetSelection) {
            facetFilters[facetKey] = {
                min: activeFacetRange.min ?? null,
                max: activeFacetRange.max ?? null
            };
        } else {
            delete facetFilters[facetKey]; // IMPORTANT: no default range apply
        }

        const facet = await getFacetModel(facetFilters);
        const totalCars = await getFacetedTotalCarsModel(facetFilters);

        const resolvedMin = hasExplicitRangeSelection
            ? (facetFilters[facetKey]?.min ?? facet?.min_value ?? null)
            : null;

        const resolvedMax = hasExplicitRangeSelection
            ? (facetFilters[facetKey]?.max ?? facet?.max_value ?? null)
            : null;

        const label = hasExplicitRangeSelection
            ? (unit ? `${resolvedMin} - ${resolvedMax} ${unit}` : `${resolvedMin} - ${resolvedMax}`)
            : null;

        const breakdown = hasExplicitRangeSelection
            ? {
                within_range: {
                    label: selectedLabel,
                    count: facet?.breakdown?.selected_count || 0
                },
                lower_range: {
                    label: lowerLabel,
                    count: facet?.breakdown?.lower_count || 0
                },
                higher_range: {
                    label: higherLabel,
                    count: facet?.breakdown?.higher_count || 0
                }
            }
            : {
                within_range: {
                    label: selectedLabel,
                    count: totalCars
                },
                lower_range: {
                    label: lowerLabel,
                    count: 0
                },
                higher_range: {
                    label: higherLabel,
                    count: 0
                }
            };

        return handleSuccess(
            res,
            200,
            successMessage,
            {
                selected_range: hasExplicitRangeSelection
                    ? {
                        min: resolvedMin,
                        max: resolvedMax,
                        total_cars: totalCars,
                        label
                    }
                    : null,
                breakdown,
                total_cars: totalCars
            },
            lang
        );
    } catch (error) {
        console.error("Range facet analytics error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

const runSimpleRangeFacetAnalytics = async (req, res, config) => {
    try {
        const {
            facetKey,
            getFacetModel,
            successMessage,
            unit = ""
        } = config;

        const lang = req.query.lang || "en";
        const selectedRange = parseSelectedRange(req.query.selected_ids, req.query.min, req.query.max);

        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const facetFilters = { ...normalizedFilters };
        const activeFacetRange = normalizedFilters?.[facetKey] || {};
        const hasActiveFacetSelection =
            activeFacetRange.min !== null && activeFacetRange.min !== undefined ||
            activeFacetRange.max !== null && activeFacetRange.max !== undefined;

        const hasExplicitRangeSelection = selectedRange.hasSelection || hasActiveFacetSelection;

        if (selectedRange.hasSelection) {
            facetFilters[facetKey] = { min: selectedRange.min, max: selectedRange.max };
        } else if (hasActiveFacetSelection) {
            facetFilters[facetKey] = {
                min: activeFacetRange.min ?? null,
                max: activeFacetRange.max ?? null
            };
        } else {
            delete facetFilters[facetKey];
        }

        const facet = await getFacetModel(facetFilters);
        const totalCars = await getFacetedTotalCarsModel(facetFilters);

        const resolvedMin = hasExplicitRangeSelection
            ? (facetFilters[facetKey]?.min ?? facet?.min_value ?? null)
            : null;
        const resolvedMax = hasExplicitRangeSelection
            ? (facetFilters[facetKey]?.max ?? facet?.max_value ?? null)
            : null;

        const label = hasExplicitRangeSelection
            ? (unit ? `${resolvedMin} - ${resolvedMax} ${unit}` : `${resolvedMin} - ${resolvedMax}`)
            : null;

        const withinCount = hasExplicitRangeSelection
            ? (facet?.breakdown?.selected_count || 0)
            : totalCars;

        return handleSuccess(
            res,
            200,
            successMessage,
            {
                selected_range: hasExplicitRangeSelection
                    ? {
                        min: resolvedMin,
                        max: resolvedMax,
                        total_cars: withinCount,
                        label
                    }
                    : null,
                total_cars: withinCount
            },
            lang
        );
    } catch (error) {
        console.error("Range facet analytics error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getCubicCapacityAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "cubic_capacity",
        getFacetModel: getCubicCapacityFacetModel,
        successMessage: "Cubic capacity analytics fetched successfully",
        selectedLabel: "Selected cubic capacity",
        lowerLabel: "Lower cubic capacity",
        higherLabel: "Higher cubic capacity",
        unit: "cm3"
    });

export const getCylindersAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "cylinders",
        getFacetModel: getCylindersFacetModel,
        successMessage: "Cylinders analytics fetched successfully",
        selectedLabel: "Selected cylinders",
        lowerLabel: "Lower cylinders",
        higherLabel: "Higher cylinders"
    });

export const getBatteryCapacityAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "battery_capacity",
        getFacetModel: getBatteryCapacityFacetModel,
        successMessage: "Battery capacity analytics fetched successfully",
        selectedLabel: "Selected battery capacity",
        lowerLabel: "Lower battery capacity",
        higherLabel: "Higher battery capacity",
        unit: "kWh"
    });

export const getTotalWeightAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "total_weight",
        getFacetModel: getTotalWeightFacetModel,
        successMessage: "Total weight analytics fetched successfully",
        selectedLabel: "Selected total weight",
        lowerLabel: "Lower total weight",
        higherLabel: "Higher total weight",
        unit: "kg"
    });

export const getEmptyWeightAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "empty_weight",
        getFacetModel: getEmptyWeightFacetModel,
        successMessage: "Empty weight analytics fetched successfully",
        selectedLabel: "Selected empty weight",
        lowerLabel: "Lower empty weight",
        higherLabel: "Higher empty weight",
        unit: "kg"
    });

export const getTowingCapacityAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "towing_capacity",
        getFacetModel: getTowingCapacityFacetModel,
        successMessage: "Towing capacity analytics fetched successfully",
        selectedLabel: "Selected towing capacity",
        lowerLabel: "Lower towing capacity",
        higherLabel: "Higher towing capacity",
        unit: "kg"
    });

export const getWltpRangeAnalytics = async (req, res) =>
    runGenericRangeFacetAnalytics(req, res, {
        facetKey: "wltp_range",
        getFacetModel: getWltpRangeFacetModel,
        successMessage: "WLTP range analytics fetched successfully",
        selectedLabel: "Selected WLTP range",
        lowerLabel: "Lower WLTP range",
        higherLabel: "Higher WLTP range",
        unit: "km"
    });

export const getConsumptionAnalytics = async (req, res) =>
    runSimpleRangeFacetAnalytics(req, res, {
        facetKey: "consumption",
        getFacetModel: getConsumptionFacetModel,
        successMessage: "Consumption analytics fetched successfully",
        unit: "l/km"
    });

export const getCo2EmissionAnalytics = async (req, res) =>
    runSimpleRangeFacetAnalytics(req, res, {
        facetKey: "co2_emission",
        getFacetModel: getCo2EmissionFacetModel,
        successMessage: "CO2 emission analytics fetched successfully",
        unit: "g/km"
    });
