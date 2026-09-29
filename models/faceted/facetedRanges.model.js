import {
    convertPowerSelectionToPs,
    getDoorNumericExpression,
    getEnginePowerNumericExpression,
    getMileageNumericExpression,
    getPriceNumericExpression,
    getSeatNumericExpression,
    getYearNumericExpression,
    normalizeSelectedRange,
    getCubicCapacityNumericExpression,
    getCylindersNumericExpression,
    getBatteryCapacityNumericExpression,
    getTotalWeightNumericExpression,
    getEmptyWeightNumericExpression,
    getTowingCapacityNumericExpression,
    getWltpRangeNumericExpression,
    getCo2EmissionNumericExpression,
    getConsumptionNumericExpression
} from '../../services/facetedFilters/buildFacetWhereClause.js';
import { getRangeFacetSummary } from './facetedCommon.model.js';

export const getPriceFacetModel = async (filters = {}) => {
    const normalizedPriceRange = normalizeSelectedRange(filters.price || {});
    const priceExpression = getPriceNumericExpression("c", filters?.price?.type || "purchase");
    const summary = await getRangeFacetSummary({
        filters,
        excludeFacet: "price",
        expression: priceExpression,
        selectedMin: normalizedPriceRange.min,
        selectedMax: normalizedPriceRange.max
    });
    return {
        ...summary,
        price_type: String(filters?.price?.type || "purchase").toLowerCase()
    };
};

export const getYearFacetModel = async (filters = {}) => {
    const normalizedYearRange = normalizeSelectedRange(filters.year || {});
    const yearExpression = getYearNumericExpression("c");
    return getRangeFacetSummary({
        filters,
        excludeFacet: "year",
        expression: yearExpression,
        selectedMin: normalizedYearRange.min,
        selectedMax: normalizedYearRange.max
    });
};

export const getMileageFacetModel = async (filters = {}) => {
    const normalizedMileageRange = normalizeSelectedRange(filters.mileage || {});
    const mileageExpression = getMileageNumericExpression("c");
    return getRangeFacetSummary({
        filters,
        excludeFacet: "mileage",
        expression: mileageExpression,
        selectedMin: normalizedMileageRange.min,
        selectedMax: normalizedMileageRange.max
    });
};

export const getEnginePowerFacetModel = async (filters = {}) => {
    const unit = filters?.engine_power?.unit || "PS";
    const selectedMinPs = convertPowerSelectionToPs(filters?.engine_power?.min, unit);
    const selectedMaxPs = convertPowerSelectionToPs(filters?.engine_power?.max, unit);
    const enginePowerExpression = getEnginePowerNumericExpression("c");
    const summary = await getRangeFacetSummary({
        filters,
        excludeFacet: "engine_power",
        expression: enginePowerExpression,
        selectedMin: selectedMinPs,
        selectedMax: selectedMaxPs
    });
    return {
        ...summary,
        input_unit: String(unit).toUpperCase()
    };
};

export const getSeatFacetModel = async (filters = {}) => {
    const normalizedSeatRange = normalizeSelectedRange(filters.seat || {});
    const seatExpression = getSeatNumericExpression("c");
    return getRangeFacetSummary({
        filters,
        excludeFacet: "seat",
        expression: seatExpression,
        selectedMin: normalizedSeatRange.min,
        selectedMax: normalizedSeatRange.max
    });
};

export const getDoorFacetModel = async (filters = {}) => {
    const normalizedDoorRange = normalizeSelectedRange(filters.door || {});
    const doorExpression = getDoorNumericExpression("c");
    return getRangeFacetSummary({
        filters,
        excludeFacet: "door",
        expression: doorExpression,
        selectedMin: normalizedDoorRange.min,
        selectedMax: normalizedDoorRange.max
    });
};

export const getCubicCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.cubic_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "cubic_capacity",
        expression: getCubicCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getCylindersFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.cylinders || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "cylinders",
        expression: getCylindersNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getBatteryCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.battery_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "battery_capacity",
        expression: getBatteryCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getTotalWeightFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.total_weight || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "total_weight",
        expression: getTotalWeightNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getEmptyWeightFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.empty_weight || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "empty_weight",
        expression: getEmptyWeightNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getTowingCapacityFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.towing_capacity || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "towing_capacity",
        expression: getTowingCapacityNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getWltpRangeFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.wltp_range || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "wltp_range",
        expression: getWltpRangeNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getConsumptionFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.consumption || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "consumption",
        expression: getConsumptionNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};

export const getCo2EmissionFacetModel = async (filters = {}) => {
    const normalizedRange = normalizeSelectedRange(filters.co2_emission || {});
    return getRangeFacetSummary({
        filters,
        excludeFacet: "co2_emission",
        expression: getCo2EmissionNumericExpression("c"),
        selectedMin: normalizedRange.min,
        selectedMax: normalizedRange.max
    });
};
