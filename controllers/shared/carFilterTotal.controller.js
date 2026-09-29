import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { filterCarsModel } from '../../models/user.model.js';
import { getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';

export const filterCarsController = async (req, res) => {
    try {
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        if (Object.keys(activeFiltersInput).length) {
            const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
            const total = await getFacetedTotalCarsModel(normalizedFilters);

            return res.json({
                success: true,
                total
            });
        }

        const result = await filterCarsModel(req.query);

        res.json({
            success: true,
            total: result.total,
            // only count is required data is commented
            //data: result.data,
            //yearCounts: result.yearCounts,
            //priceCounts: result.priceCounts

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
