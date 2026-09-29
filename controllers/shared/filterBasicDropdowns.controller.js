import { parseFacetedInput, normalizeFacetedFilters, parseSelectedIds, hasActiveFiltersInQuery } from '../../utils/user_helper.js';
import { getFuelTypesModel, getTransmissionTypesModel, getDriveTypesModel, getBodyTypesModel } from '../../models/user.model.js';
import { getFuelFacetModel, getFacetedTotalCarsModel, getTransmissionFacetModel, getDriveFacetModel, getBodyTypeFacetModel, getStateFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const getFuelTypes = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const selectedIds = parseSelectedIds(req.query.selected_ids);
        const shouldUseFacetedMode = hasActiveFiltersInQuery(req) || selectedIds.length > 0;

        if (shouldUseFacetedMode) {
            const fuelFacet = await getFuelFacetModel(lang, normalizedFilters);
            const totalFilters = { ...normalizedFilters };
            if (selectedIds.length > 0) {
                totalFilters.fuel_type_ids = selectedIds;
            }
            const totalCars = await getFacetedTotalCarsModel(totalFilters);

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
        }

        const selectedIdsLegacy = req.query.selected_ids
            ? req.query.selected_ids.split(",").map(Number)
            : [];

        const { rows, totalCars } = await getFuelTypesModel(lang, selectedIdsLegacy);

        const data = {};

        rows.forEach(row => {
            if (!data[row.category]) {
                data[row.category] = [];
            }

            data[row.category].push({
                id: row.id,
                code: row.code,
                label: row.label,
                count: row.car_count
            });
        });

        data.total_cars = totalCars;

        return handleSuccess(
            res,
            200,
            "Fuel types fetched successfully",
            data
        );

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
        const selectedIds = parseSelectedIds(req.query.selected_ids);
        const shouldUseFacetedMode = hasActiveFiltersInQuery(req) || selectedIds.length > 0;

        if (shouldUseFacetedMode) {
            const transmissionFacet = await getTransmissionFacetModel(lang, normalizedFilters);
            const totalFilters = { ...normalizedFilters };
            if (selectedIds.length > 0) {
                totalFilters.transmission_ids = selectedIds;
            }
            const totalCars = await getFacetedTotalCarsModel(totalFilters);

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
        }

        const transmissionIds = req.query.transmission_ids
            ? req.query.transmission_ids.split(",")
            : [];

        const { rows, totalCars } = await getTransmissionTypesModel(
            lang,
            transmissionIds
        );

        const data = rows.map(row => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: row.car_count
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
        const selectedIds = parseSelectedIds(req.query.selected_ids);
        const shouldUseFacetedMode = hasActiveFiltersInQuery(req) || selectedIds.length > 0;

        if (shouldUseFacetedMode) {
            const driveFacet = await getDriveFacetModel(lang, normalizedFilters);
            const totalFilters = { ...normalizedFilters };
            if (selectedIds.length > 0) {
                totalFilters.drive_ids = selectedIds;
            }
            const totalCars = await getFacetedTotalCarsModel(totalFilters);

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
        }

        const driveIds = req.query.drive_ids
            ? req.query.drive_ids.split(",")
            : [];

        const { rows, totalCars } = await getDriveTypesModel(lang, driveIds);

        const data = rows.map(row => ({
            id: row.id,
            code: row.code,
            label: row.label,
            count: row.car_count
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
        const selectedIds = parseSelectedIds(req.query.selected_ids);
        const shouldUseFacetedMode = hasActiveFiltersInQuery(req) || selectedIds.length > 0;

        if (shouldUseFacetedMode) {
            const bodyTypeFacet = await getBodyTypeFacetModel(lang, normalizedFilters);
            const totalFilters = { ...normalizedFilters };
            if (selectedIds.length > 0) {
                totalFilters.body_type_ids = selectedIds;
            }
            const totalCars = await getFacetedTotalCarsModel(totalFilters);

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
        }

        const rawBodyTypeIds = req.query.body_type_ids || req.query.bodytypeIds;
        const bodyTypeIds = rawBodyTypeIds
            ? rawBodyTypeIds.split(",").map(id => id.trim()).filter(Boolean)
            : [];

        const { rows, totalCars } = await getBodyTypesModel(lang, bodyTypeIds);

        const data = rows.map(row => ({
            id: row.id,
            code: row.code,
            image: row.image,
            label: row.label,
            count: row.car_count
        }));

        return handleSuccess(res, 200, "Body types fetched successfully",
            {
                types: data,
                total_cars: totalCars
            }
        );
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
