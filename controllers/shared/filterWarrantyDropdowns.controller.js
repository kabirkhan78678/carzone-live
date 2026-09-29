import { parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { getWarrantyTypesModel, getWarrantyQualityModel } from '../../models/user.model.js';
import { getAccidentStatusFacetModel, getFacetedTotalCarsModel, getMfkWarrantyFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const getAccidentVehicle = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const accidentFacet = await getAccidentStatusFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(
            res,
            200,
            "Accident vehicle status fetched successfully",
            {
                types: accidentFacet.options,
                total_cars: totalCars
            }
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getMfkWarranty = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const mfkFacet = await getMfkWarrantyFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(
            res,
            200,
            "MFK warranty fetched successfully",
            {
                types: mfkFacet.options,
                total_cars: totalCars
            }
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const warrantyTypesDropdown = async (req, res) => {

    try {

        const lang = req.query.lang || "en";

        const rows = await getWarrantyTypesModel(lang);

        return handleSuccess(res, 200, "Warranty types fetched successfully", rows);

    } catch (err) {

        console.error(err);
        return handleError(res, 500, "Internal Server Error");

    }
};
// for colors + others

export const warrantyQualityDropdown = async (req, res) => {
    try {
        const lang = req.query.lang || "en";

        const rows = await getWarrantyQualityModel(lang);

        return handleSuccess(
            res,
            200,
            "Warranty qualities fetched successfully",
            rows
        );
    } catch (err) {
        console.error(err);
        return handleError(res, 500, "Internal Server Error");
    }
};

// energy efficiency
