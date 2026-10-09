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
        const lang = req.query.lang || req.body?.lang || "en";

        const rawQuery = req.query || {};
        const rawBody = req.body || {};

        const activeFiltersPayload = typeof rawBody.active_filters === 'object' && rawBody.active_filters !== null
            ? rawBody.active_filters
            : (typeof rawBody.applied_filters === 'object' && rawBody.applied_filters !== null ? rawBody.applied_filters : {});
        const activeFiltersQuery = parseFacetedInput(
            rawQuery.active_filters ?? rawQuery.applied_filters
        );
        const parsedActivePayload = typeof rawBody.active_filters === 'string'
            ? parseFacetedInput(rawBody.active_filters)
            : (typeof rawBody.applied_filters === 'string' ? parseFacetedInput(rawBody.applied_filters) : {});

        const mergedActiveFilters = {
            ...rawQuery,
            ...rawBody,
            ...(typeof activeFiltersPayload === 'object' ? activeFiltersPayload : {}),
            ...(typeof parsedActivePayload === 'object' ? parsedActivePayload : {}),
            ...(typeof activeFiltersQuery === 'object' ? activeFiltersQuery : {})
        };

        const normalizedFilters = normalizeFacetedFilters({
            ...mergedActiveFilters,
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId
        });

        const filters = {
            ...mergedActiveFilters,
            // direct-web object compatibility aliases for legacy getAllFilters
            seller_type: mergedActiveFilters.seller_type ?? mergedActiveFilters.sellerType ?? (normalizedFilters.seller_types?.length ? normalizedFilters.seller_types : undefined),
            fuel_type_id: mergedActiveFilters.fuel_type_id ?? mergedActiveFilters.fuelType ?? (normalizedFilters.fuel_type_ids?.length ? normalizedFilters.fuel_type_ids : undefined),
            transmission_id: mergedActiveFilters.transmission_id ?? mergedActiveFilters.transmission ?? (normalizedFilters.transmission_ids?.length ? normalizedFilters.transmission_ids : undefined),
            body_type_id: mergedActiveFilters.body_type_id ?? mergedActiveFilters.body_type ?? (normalizedFilters.body_type_ids?.length ? normalizedFilters.body_type_ids : undefined),
            drive_type_id: mergedActiveFilters.drive_type_id ?? mergedActiveFilters.drive_type ?? (normalizedFilters.drive_ids?.length ? normalizedFilters.drive_ids : undefined),
            state_id: mergedActiveFilters.state_id ?? mergedActiveFilters.state_ids ?? (normalizedFilters.state_ids?.length ? normalizedFilters.state_ids : undefined),
            interior_color_id: mergedActiveFilters.interior_color_id ?? mergedActiveFilters.interior_color_ids ?? mergedActiveFilters.interior_color ?? (normalizedFilters.interior_color_ids?.length ? normalizedFilters.interior_color_ids : undefined),
            exterior_color_id: mergedActiveFilters.exterior_color_id ?? mergedActiveFilters.exterior_color_ids ?? mergedActiveFilters.exterior_color ?? (normalizedFilters.exterior_color_ids?.length ? normalizedFilters.exterior_color_ids : undefined),
            brand_name: mergedActiveFilters.brand_name ?? mergedActiveFilters.brandName ?? (normalizedFilters.brand_names?.length ? normalizedFilters.brand_names : undefined),
            model_name: mergedActiveFilters.model_name ?? mergedActiveFilters.carModel ?? mergedActiveFilters.model ?? (normalizedFilters.model_names?.length ? normalizedFilters.model_names : undefined),
            km_from: mergedActiveFilters.km_from ?? mergedActiveFilters.from_km ?? (normalizedFilters.mileage?.min !== null ? normalizedFilters.mileage?.min : undefined),
            km_to: mergedActiveFilters.km_to ?? mergedActiveFilters.to_km ?? (normalizedFilters.mileage?.max !== null ? normalizedFilters.mileage?.max : undefined),
            price_from: mergedActiveFilters.price_from ?? mergedActiveFilters.from_price ?? (normalizedFilters.price?.min !== null ? normalizedFilters.price?.min : undefined),
            price_to: mergedActiveFilters.price_to ?? mergedActiveFilters.to_price ?? (normalizedFilters.price?.max !== null ? normalizedFilters.price?.max : undefined),
            year_from: mergedActiveFilters.year_from ?? mergedActiveFilters.from_year ?? (normalizedFilters.year?.min !== null ? normalizedFilters.year?.min : undefined),
            year_to: mergedActiveFilters.year_to ?? mergedActiveFilters.to_year ?? (normalizedFilters.year?.max !== null ? normalizedFilters.year?.max : undefined),
            quality_seals: mergedActiveFilters.quality_seals ?? mergedActiveFilters.quality_seal_ids ?? mergedActiveFilters.quality_seal ?? mergedActiveFilters.quality_seal_id ?? mergedActiveFilters.qualitySeals ?? (normalizedFilters.quality_seal_ids?.length ? normalizedFilters.quality_seal_ids : undefined),
            exclude_user_id: viewerUserId,
            excluded_user_id: viewerUserId,
            lang
        };

        const data = await getAllFilters(filters, normalizedFilters);

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
        const lang = req.query.lang || req.body?.lang || "en";
        const viewerUserId = extractViewerUserId(req);

        const rawPayload = req.body || {};
        const activeFiltersPayload = typeof rawPayload.active_filters === 'object' && rawPayload.active_filters !== null
            ? rawPayload.active_filters
            : (typeof rawPayload.applied_filters === 'object' && rawPayload.applied_filters !== null ? rawPayload.applied_filters : {});
        const activeFiltersQuery = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );

        const mergedActiveFilters = {
            ...req.query,
            ...rawPayload,
            ...(typeof activeFiltersPayload === 'object' ? activeFiltersPayload : {}),
            ...(typeof activeFiltersQuery === 'object' ? activeFiltersQuery : {})
        };

        const normalizedFilters = normalizeFacetedFilters({
            ...mergedActiveFilters,
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
                title: row.title || row.name || row.display_key,
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
                req.query.lang || req.body?.lang || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

export const getFeaturesList = async (req, res) => {
    try {
        const lang = req.query.lang || req.body?.lang || "en";
        const viewerUserId = extractViewerUserId(req);

        const rawPayload = req.body || {};
        const activeFiltersPayload = typeof rawPayload.active_filters === 'object' && rawPayload.active_filters !== null
            ? rawPayload.active_filters
            : (typeof rawPayload.applied_filters === 'object' && rawPayload.applied_filters !== null ? rawPayload.applied_filters : {});
        const activeFiltersQuery = parseFacetedInput(
            req.query.active_filters ?? req.query.applied_filters
        );

        const mergedActiveFilters = {
            ...req.query,
            ...rawPayload,
            ...(typeof activeFiltersPayload === 'object' ? activeFiltersPayload : {}),
            ...(typeof activeFiltersQuery === 'object' ? activeFiltersQuery : {})
        };

        const normalizedFilters = normalizeFacetedFilters({
            ...mergedActiveFilters,
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
