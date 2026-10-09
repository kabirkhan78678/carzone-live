import { parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { getColorsModel } from '../../models/user.model.js';
import { getExteriorColorFacetModel, getFacetedTotalCarsModel, getInteriorColorFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const getExteriorColors = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const exteriorColorFacet = await getExteriorColorFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);
        return handleSuccess(
            res,
            200,
            "Exterior colors fetched successfully",
            {
                types: exteriorColorFacet.options,
                metallic_count: exteriorColorFacet.metallic_count ?? 0,
                total_cars: totalCars
            }
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getInteriorColors = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const interiorColorFacet = await getInteriorColorFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);
        return handleSuccess(
            res,
            200,
            "Interior colors fetched successfully",
            {
                types: interiorColorFacet.options,
                total_cars: totalCars
            }
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const colorsDropdown = async (req, res) => {

    try {

        const lang = req.query.lang || "en";

        let rows = await getColorsModel(lang);

        // Add "Other" option at the end
        rows.push({
            id: "other",
            name: "Other",
            hex_code: null
        });

        return handleSuccess(res, 200, "Colors fetched successfully", rows);

    } catch (err) {

        console.error(err);
        return handleError(res, 500, "Internal Server Error");

    }

};

//Latest- Draft- Car for car listing flow
