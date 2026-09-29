import { parseFacetedInput, normalizeFacetedFilters, parseSelectedRange, hasActiveFiltersInQuery } from '../../utils/user_helper.js';
import { getSeatRangeCountModel, getDoorRangeCountModel } from '../../models/user.model.js';
import { getSeatFacetModel, getFacetedTotalCarsModel, getDoorFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const getSeatRangeCount = async (req, res) => {
    try {
        const selectedRange = parseSelectedRange(req.query.selected_ids, req.query.min, req.query.max);
        const min = selectedRange.min;
        const max = selectedRange.max;
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const hasLegacyRangeParams = req.query.min !== undefined || req.query.max !== undefined;
        // commented by raj for faceted filters:
        const shouldUseFacetedMode =
            hasActiveFiltersInQuery(req) || selectedRange.hasSelection || !hasLegacyRangeParams;

        if (shouldUseFacetedMode) {
            const facetFilters = { ...normalizedFilters };
            if (selectedRange.hasSelection) {
                facetFilters.seat = { min, max };
            }
            const seatFacet = await getSeatFacetModel(facetFilters);
            const totalCars = await getFacetedTotalCarsModel(facetFilters);

            return handleSuccess(res, 200, "Seat range count fetched", {
                min,
                max,
                total_cars: totalCars,
                breakdown: seatFacet?.breakdown || {
                    selected_count: 0,
                    lower_count: 0,
                    higher_count: 0
                }
            });
        }

        const totalCars = await getSeatRangeCountModel(min, max);

        return handleSuccess(res, 200, "Seat range count fetched", {
            min,
            max,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const RangeCountgetDoor = async (req, res) => {
    try {
        const selectedRange = parseSelectedRange(req.query.selected_ids, req.query.min, req.query.max);
        const min = selectedRange.min;
        const max = selectedRange.max;
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const activeDoorMin = normalizedFilters?.door?.min ?? null;
        const activeDoorMax = normalizedFilters?.door?.max ?? null;
        const responseMin = selectedRange.hasSelection ? min : activeDoorMin;
        const responseMax = selectedRange.hasSelection ? max : activeDoorMax;
        const hasLegacyRangeParams = req.query.min !== undefined || req.query.max !== undefined;
        // commented by raj for faceted filters:
        const shouldUseFacetedMode =
            hasActiveFiltersInQuery(req) || selectedRange.hasSelection || !hasLegacyRangeParams;

        if (shouldUseFacetedMode) {
            const facetFilters = { ...normalizedFilters };
            if (selectedRange.hasSelection) {
                facetFilters.door = { min, max };
            }
            const doorFacet = await getDoorFacetModel(facetFilters);
            const totalCars = await getFacetedTotalCarsModel(facetFilters);

            return handleSuccess(res, 200, "Door range count fetched", {
                min: responseMin,
                max: responseMax,
                total_cars: totalCars,
                breakdown: doorFacet?.breakdown || {
                    selected_count: 0,
                    lower_count: 0,
                    higher_count: 0
                }
            });
        }

        const totalCars = await getDoorRangeCountModel(min, max);

        return handleSuccess(res, 200, "Door range count fetched", {
            min,
            max,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};
