import { parseFacetedInput, normalizeFacetedFilters, parseSelectedIds } from '../../utils/user_helper.js';
import { getFuelFacetModel, getFacetedTotalCarsModel, getTransmissionFacetModel, getDriveFacetModel, getBodyTypeFacetModel, getStateFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const getFuelTypes = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids || req.query.fuel_type_ids);
        if (selectedIds.length > 0) {
            normalizedFilters.fuel_type_ids = selectedIds;
        }

        const fuelFacet = await getFuelFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        const categories = {};
        for (const [cat, items] of Object.entries(fuelFacet.categories || {})) {
            categories[cat] = (items || []).map(item => ({
                id: item.id,
                code: item.code,
                label: item.label ?? item.name,
                count: item.count ?? 0
            }));
        }

        return handleSuccess(res, 200, "Fuel types fetched successfully", {
            ...categories,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getTransmissionTypes = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids || req.query.transmission_ids);
        if (selectedIds.length > 0) {
            normalizedFilters.transmission_ids = selectedIds;
        }

        const transmissionFacet = await getTransmissionFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        const data = (transmissionFacet.options || []).map(row => ({
            id: row.id,
            code: row.code ?? row.name_key,
            label: row.label ?? row.name,
            count: row.count ?? 0
        }));

        return handleSuccess(res, 200, "Transmission types fetched successfully", {
            types: data,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

/* -------- DRIVE -------- */

export const getDriveTypes = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids || req.query.drive_ids || req.query.drive_type);
        if (selectedIds.length > 0) {
            normalizedFilters.drive_ids = selectedIds;
        }

        const driveFacet = await getDriveFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        const data = (driveFacet.options || []).map(row => ({
            id: row.id,
            code: row.code ?? row.name_key,
            label: row.label ?? row.name,
            count: row.count ?? 0
        }));

        return handleSuccess(res, 200, "Drive types fetched successfully", {
            types: data,
            total_cars: totalCars
        });

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getBodyTypes = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids || req.query.body_type_ids || req.query.bodytypeIds || req.query.body_type);
        if (selectedIds.length > 0) {
            normalizedFilters.body_type_ids = selectedIds;
        }

        const bodyTypeFacet = await getBodyTypeFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        const data = (bodyTypeFacet.options || []).map(row => ({
            id: row.id,
            code: row.code ?? row.name_key,
            image: row.image ?? null,
            label: row.label ?? row.name,
            count: row.count ?? 0
        }));

        return handleSuccess(res, 200, "Body types fetched successfully", {
            types: data,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getVehicleStates = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids || req.query.state_ids || req.query.state_id);
        if (selectedIds.length > 0) {
            normalizedFilters.state_ids = selectedIds;
        }

        const stateFacet = await getStateFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Vehicle states fetched successfully", {
            types: stateFacet.options,
            total_cars: totalCars
        });

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};
