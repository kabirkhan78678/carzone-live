import { getAccidentStatusFacetModel, getMfkWarrantyFacetModel, getVehicleConditionFacetModel, getEnergyEfficiencyFacetModel, getListingAgeFacetModel, getSeatFacetModel, getDoorFacetModel, getEnginePowerFacetModel, getCubicCapacityFacetModel, getCylindersFacetModel, getBatteryCapacityFacetModel, getTotalWeightFacetModel, getEmptyWeightFacetModel, getTowingCapacityFacetModel, getWltpRangeFacetModel, getConsumptionFacetModel, getCo2EmissionFacetModel, getCarTypeFacetModel, getQualitySealFacetModel, getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';
import { getAllFilters, getSortListModel, getExtrasListModel, getFeaturesListModel } from '../../models/user.model.js';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';

const extractViewerUserId = (req) => {
    if (req.user?.id) {
        const id = Number(req.user.id);
        return Number.isFinite(id) && id > 0 ? id : null;
    }
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && String(authHeader).startsWith("Bearer ")) {
        const token = String(authHeader).split(" ")[1];
        try {
            const secret = process.env.AUTH_SECRETKEY || process.env.JWT_SECRET;
            let decoded = null;
            if (secret) {
                try {
                    decoded = jwt.verify(token, secret);
                } catch (e) {
                    if (process.env.JWT_SECRET && process.env.JWT_SECRET !== secret) {
                        try {
                            decoded = jwt.verify(token, process.env.JWT_SECRET);
                        } catch (e2) { }
                    }
                }
            }
            if (!decoded) {
                decoded = jwt.decode(token);
            }
            const tokenUserId = Number(decoded?.data?.id || decoded?.id || decoded?.userId);
            if (Number.isFinite(tokenUserId) && tokenUserId > 0) {
                return tokenUserId;
            }
        } catch (e) {
            try {
                const decoded = jwt.decode(token);
                const tokenUserId = Number(decoded?.data?.id || decoded?.id || decoded?.userId);
                if (Number.isFinite(tokenUserId) && tokenUserId > 0) {
                    return tokenUserId;
                }
            } catch (e3) {
                return null;
            }
        }
    }
    return null;
};

export const getFilters = async (req, res) => {
    try {
        const viewerUserId = extractViewerUserId(req);
        const rawFilters = req.query || {};
        const filters = {
            ...rawFilters,
            // direct-web object compatibility aliases for legacy getAllFilters
            seller_type: rawFilters.seller_type ?? rawFilters.sellerType,
            fuel_type_id: rawFilters.fuel_type_id ?? rawFilters.fuelType,
            transmission_id: rawFilters.transmission_id ?? rawFilters.transmission,
            body_type_id: rawFilters.body_type_id ?? rawFilters.body_type,
            drive_type_id: rawFilters.drive_type_id ?? rawFilters.drive_type,
            state_id: rawFilters.state_id ?? rawFilters.state_ids,
            interior_color_id: rawFilters.interior_color_id ?? rawFilters.interior_color_ids ?? rawFilters.interior_color,
            exterior_color_id: rawFilters.exterior_color_id ?? rawFilters.exterior_color_ids ?? rawFilters.exterior_color,
            brand_name: rawFilters.brand_name ?? rawFilters.brandName,
            model_name: rawFilters.model_name ?? rawFilters.carModel ?? rawFilters.model,
            km_from: rawFilters.km_from ?? rawFilters.from_km,
            km_to: rawFilters.km_to ?? rawFilters.to_km,
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId
        };
        const lang = req.query.lang || "en";
        const data = await getAllFilters(filters);

        // Keep legacy web payload and append missing faceted blocks.
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );
        const normalizedFilters = normalizeFacetedFilters({
            ...filters,
            ...(activeFiltersInput || {}),
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId
        });

        const [
            accidentFacet,
            mfkFacet,
            vehicleConditionFacet,
            energyFacet,
            listingAgeFacet,
            seatFacet,
            doorFacet,
            enginePowerFacet,
            cubicCapacityFacet,
            cylindersFacet,
            batteryFacet,
            totalWeightFacet,
            emptyWeightFacet,
            towingFacet,
            wltpFacet,
            consumptionFacet,
            co2Facet,
            carTypeFacet,
            qualitySealFacet
        ] = await Promise.all([
            getAccidentStatusFacetModel(lang, normalizedFilters),
            getMfkWarrantyFacetModel(lang, normalizedFilters),
            getVehicleConditionFacetModel(lang, normalizedFilters),
            getEnergyEfficiencyFacetModel(normalizedFilters),
            getListingAgeFacetModel(normalizedFilters),
            getSeatFacetModel(normalizedFilters),
            getDoorFacetModel(normalizedFilters),
            getEnginePowerFacetModel(normalizedFilters),
            getCubicCapacityFacetModel(normalizedFilters),
            getCylindersFacetModel(normalizedFilters),
            getBatteryCapacityFacetModel(normalizedFilters),
            getTotalWeightFacetModel(normalizedFilters),
            getEmptyWeightFacetModel(normalizedFilters),
            getTowingCapacityFacetModel(normalizedFilters),
            getWltpRangeFacetModel(normalizedFilters),
            getConsumptionFacetModel(normalizedFilters),
            getCo2EmissionFacetModel(normalizedFilters),
            getCarTypeFacetModel(lang, normalizedFilters),
            getQualitySealFacetModel(lang, normalizedFilters)
        ]);

        const mapFacetOptions = (facet) =>
            (facet?.options || []).map((item) => ({
                id: item.id ?? null,
                code: item.code ?? null,
                name: item.label ?? item.name ?? null,
                image: item.image ?? null,
                description: item.description ?? null,
                total: Number(item.count) || 0
            }));

        const mapRangeFacet = (facet) => ({
            min_value: facet?.min_value ?? null,
            max_value: facet?.max_value ?? null,
            selected_range: facet?.selected_range || null,
            breakdown: facet?.breakdown || {
                selected_count: 0,
                lower_count: 0,
                higher_count: 0
            },
            total_cars_found: Number(facet?.total_cars) || 0
        });

        data.accident_vehicle = mapFacetOptions(accidentFacet);
        // data.mfk_warranty = mapFacetOptions(mfkFacet);
        data.vehicle_condition = mapFacetOptions(vehicleConditionFacet);
        data.energy_efficiency = mapFacetOptions(energyFacet);
        data.listing_age = mapFacetOptions(listingAgeFacet);
        data.car_type = mapFacetOptions(carTypeFacet);
        data.quality_seals = mapFacetOptions(qualitySealFacet);

        data.seat_range = mapRangeFacet(seatFacet);
        data.door_range = mapRangeFacet(doorFacet);
        data.engine_power = mapRangeFacet(enginePowerFacet);
        data.cubic_capacity = mapRangeFacet(cubicCapacityFacet);
        data.cylinders = mapRangeFacet(cylindersFacet);
        data.battery_capacity = mapRangeFacet(batteryFacet);
        data.total_weight = mapRangeFacet(totalWeightFacet);
        data.empty_weight = mapRangeFacet(emptyWeightFacet);
        data.towing_capacity = mapRangeFacet(towingFacet);
        data.wltp_range = mapRangeFacet(wltpFacet);
        data.consumption = mapRangeFacet(consumptionFacet);
        data.co2_emission = mapRangeFacet(co2Facet);

        return handleSuccess(res, 200, "Data found successfully", data);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

export const getSortList = async (req, res) => {
    try {
        const lang = req.query.lang || "en";

        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );

        const normalizedFilters = normalizeFacetedFilters(
            activeFiltersInput
        );

        const rows = await getSortListModel(lang);

        const data = rows.map((row) => ({
            id: row.id,
            sort_key: row.sort_key,
            sort_order: row.sort_order,
            icon: row.icon,
            name: row.name
        }));

        const totalCars = await getFacetedTotalCarsModel(
            normalizedFilters
        );

        return handleSuccess(
            res,
            200,
            getMessage(lang, "Sortlistfetchedsuccessfully"),
            {
                sorts: data,
                total_cars: totalCars
            },
            lang
        );
    } catch (error) {
        console.error("getSortList error:", error);

        return handleError(
            res,
            500,
            getMessage(
                req.query.lang || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

export const getExtrasList = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const viewerUserId = extractViewerUserId(req);

        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );

        const normalizedFilters = normalizeFacetedFilters({
            ...(activeFiltersInput || {}),
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId
        });

        const rows = await getExtrasListModel(
            lang,
            normalizedFilters
        );

        const data = rows
            .filter((row) => Number(row.id) !== 6)
            .map((row) => ({
                id: row.id,
                real_name_id: row.real_name_id,
                extra_key: row.extra_key,
                display_key: row.display_key,
                sort_order: row.sort_order,
                icon: row.icon,
                name: row.name,
                count: Number(row.count || 0)
            }));

        const totalCars = await getFacetedTotalCarsModel(
            normalizedFilters
        );

        return handleSuccess(
            res,
            200,
            getMessage(lang, "Extraslistfetchedsuccessfully"),
            {
                extras: data,
                total_cars: totalCars
            },
            lang
        );

    } catch (error) {
        console.error("getExtrasList error:", error);

        return handleError(
            res,
            500,
            getMessage(
                req.query.lang || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

export const getFeaturesList = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const viewerUserId = extractViewerUserId(req);

        // Active filters
        const activeFiltersInput = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );

        const normalizedFilters = normalizeFacetedFilters({
            ...(activeFiltersInput || {}),
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId
        });

        // =========================
        // FEATURES
        // =========================
        const featureRows = await getFeaturesListModel(lang);

        const features = featureRows
            .filter((row) => Number(row.id) !== 6)
            .map((row) => ({
                id: row.id,
                feature_key: row.feature_key,
                display_key: row.display_key,
                sort_order: row.sort_order,
                name: row.name
            }));

        // =========================
        // EXTRAS
        // Only 8 Tyres
        // =========================
        const extraRows = await getExtrasListModel(
            lang,
            normalizedFilters
        );

        console.log(extraRows, "qqqqqqqqqqqqq")
        const extras = extraRows
            .filter((row) => row.extra_key === "eight_tyres")
            .map((row) => ({
                id: row.id,
                extra_key: row.extra_key,
                display_key: row.display_key,
                sort_order: row.sort_order,
                icon: row.icon,
                name: row.name,
                count: Number(row.count || 0)
            }));

        // =========================
        // TOTAL CARS
        // =========================
        const totalCars = await getFacetedTotalCarsModel(
            normalizedFilters
        );

        return handleSuccess(
            res,
            200,
            "Features list fetched successfully",
            {
                features,
                extras,
                total_cars: totalCars
            },
            lang
        );

    } catch (error) {
        console.error("getFeaturesList error:", error);

        return handleError(
            res,
            500,
            getMessage(
                req.query.lang || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};
