import { parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { getVehicleConditionFacetModel, getFacetedTotalCarsModel, getEnergyEfficiencyFacetModel, getListingAgeFacetModel, getSellerTypeFacetModel, getCarTypeFacetModel, getQualitySealFacetModel } from '../../models/facetedFilter.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const vehicleConditionsDropdown = async (req, res) => {

    try {

        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const conditionFacet = await getVehicleConditionFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Vehicle conditions fetched successfully", {
            types: conditionFacet.options,
            total_cars: totalCars
        });

    } catch (err) {

        console.error(err);
        return handleError(res, 500, "Internal Server Error");

    }
};

export const getEnergyEfficiency = async (req, res) => {
    try {
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const energyFacet = await getEnergyEfficiencyFacetModel(normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Energy efficiency fetched successfully", {
            types: energyFacet.options,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getListingAge = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const listingAgeFacet = await getListingAgeFacetModel(normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Listing age fetched successfully", {
            types: [
                { id: 0, label: "Any", count: totalCars },
                ...listingAgeFacet.options
            ],
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getSellerTypes = async (req, res) => {
    try {
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const sellerFacet = await getSellerTypeFacetModel(normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Seller types fetched successfully", {
            types: sellerFacet.options,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getCarTypesDropdown = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const carTypeFacet = await getCarTypeFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Car types fetched successfully", {
            types: carTypeFacet.options,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getCarTypes = getCarTypesDropdown;

export const getQualitySealsDropdown = async (req, res) => {
    try {
        const lang = req.query.lang || "en";
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);

        const qualitySealFacet = await getQualitySealFacetModel(lang, normalizedFilters);
        const totalCars = await getFacetedTotalCarsModel(normalizedFilters);

        return handleSuccess(res, 200, "Quality seals fetched successfully", {
            quality_seals: qualitySealFacet.options,
            total_cars: totalCars
        });
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getQualitySeals = getQualitySealsDropdown;
export const getQualitySeal = getQualitySealsDropdown;

//     try {

//             ...rawFilters,
//             // direct-web object compatibility aliases for legacy getAllFilters
//             seller_type: rawFilters.seller_type ?? rawFilters.sellerType,
//             fuel_type_id: rawFilters.fuel_type_id ?? rawFilters.fuelType,
//             transmission_id: rawFilters.transmission_id ?? rawFilters.transmission,
//             body_type_id: rawFilters.body_type_id ?? rawFilters.body_type,
//             drive_type_id: rawFilters.drive_type_id ?? rawFilters.drive_type,
//             state_id: rawFilters.state_id ?? rawFilters.state_ids,
//             interior_color_id: rawFilters.interior_color_id ?? rawFilters.interior_color_ids,
//             exterior_color_id: rawFilters.exterior_color_id ?? rawFilters.exterior_color_ids,
//             brand_name: rawFilters.brand_name ?? rawFilters.brandName,
//             model_name: rawFilters.model_name ?? rawFilters.carModel ?? rawFilters.model,
//             km_from: rawFilters.km_from ?? rawFilters.from_km,
//             km_to: rawFilters.km_to ?? rawFilters.to_km
//         };

//         // Keep legacy web payload and append missing faceted blocks.
//             req.query.active_filters ?? req.query.applied_filters
//         );
//             ...filters,
//             ...(activeFiltersInput || {})
//         });

//             accidentFacet,
//             mfkFacet,
//             vehicleConditionFacet,
//             energyFacet,
//             listingAgeFacet,
//             seatFacet,
//             doorFacet,
//             enginePowerFacet,
//             cubicCapacityFacet,
//             cylindersFacet,
//             batteryFacet,
//             totalWeightFacet,
//             emptyWeightFacet,
//             towingFacet,
//             wltpFacet,
//             consumptionFacet,
//             co2Facet
//         ] = await Promise.all([
//             getAccidentStatusFacetModel(lang, normalizedFilters),
//             getMfkWarrantyFacetModel(lang, normalizedFilters),
//             getVehicleConditionFacetModel(lang, normalizedFilters),
//             getEnergyEfficiencyFacetModel(normalizedFilters),
//             getListingAgeFacetModel(normalizedFilters),
//             getSeatFacetModel(normalizedFilters),
//             getDoorFacetModel(normalizedFilters),
//             getEnginePowerFacetModel(normalizedFilters),
//             getCubicCapacityFacetModel(normalizedFilters),
//             getCylindersFacetModel(normalizedFilters),
//             getBatteryCapacityFacetModel(normalizedFilters),
//             getTotalWeightFacetModel(normalizedFilters),
//             getEmptyWeightFacetModel(normalizedFilters),
//             getTowingCapacityFacetModel(normalizedFilters),
//             getWltpRangeFacetModel(normalizedFilters),
//             getConsumptionFacetModel(normalizedFilters),
//             getCo2EmissionFacetModel(normalizedFilters)
//         ]);

//             (facet?.options || []).map((item) => ({
//                 id: item.id ?? null,
//                 code: item.code ?? null,
//                 name: item.label ?? item.name ?? null,
//                 total: Number(item.count) || 0
//             }));

//             min_value: facet?.min_value ?? null,
//             max_value: facet?.max_value ?? null,
//             selected_range: facet?.selected_range || null,
//             breakdown: facet?.breakdown || {
//                 selected_count: 0,
//                 lower_count: 0,
//                 higher_count: 0
//             },
//             total_cars_found: Number(facet?.total_cars) || 0
//         });

//         data.accident_vehicle = mapFacetOptions(accidentFacet);
//         data.mfk_warranty = mapFacetOptions(mfkFacet);
//         data.vehicle_condition = mapFacetOptions(vehicleConditionFacet);
//         data.energy_efficiency = mapFacetOptions(energyFacet);
//         data.listing_age = mapFacetOptions(listingAgeFacet);

//         data.seat_range = mapRangeFacet(seatFacet);
//         data.door_range = mapRangeFacet(doorFacet);
//         data.engine_power = mapRangeFacet(enginePowerFacet);
//         data.cubic_capacity = mapRangeFacet(cubicCapacityFacet);
//         data.cylinders = mapRangeFacet(cylindersFacet);
//         data.battery_capacity = mapRangeFacet(batteryFacet);
//         data.total_weight = mapRangeFacet(totalWeightFacet);
//         data.empty_weight = mapRangeFacet(emptyWeightFacet);
//         data.towing_capacity = mapRangeFacet(towingFacet);
//         data.wltp_range = mapRangeFacet(wltpFacet);
//         data.consumption = mapRangeFacet(consumptionFacet);
//         data.co2_emission = mapRangeFacet(co2Facet);

//     } catch (error) {
//         console.error(error);
//     }
// };

//     try {
//                 sellerType: 'seller_type',
//                 fuelType: 'fuel_type_id',
//                 transmission: 'transmission_id',
//                 body_type: 'body_type_id',
//                 drive_type: 'drive_type_id',
//                 brandName: 'brand_name',
//                 carModel: 'model_name',
//                 model: 'model_name',
//                 powerUnit: 'power_unit',
//                 listingAge: 'listing_age',
//                 energyEfficiency: 'energy_efficiency',
//                 state_ids: 'state_id',
//                 interior_color_ids: 'interior_color_id',
//                 exterior_color_ids: 'exterior_color_id',
//                 from_km: 'km_from',
//                 to_km: 'km_to'
//             };
//             Object.entries(aliases).forEach(([alias, key]) => {
//                     normalized[key] = input[alias];
//                 }
//             });
//         };

//         // Keep legacy web payload and append missing faceted blocks.
//             req.query.active_filters ?? req.query.applied_filters
//         );
//             ...filters,
//             ...(activeFiltersInput || {})
//         });

//             accidentFacet,
//             mfkFacet,
//             vehicleConditionFacet,
//             energyFacet,
//             listingAgeFacet,
//             seatFacet,
//             doorFacet,
//             enginePowerFacet,
//             cubicCapacityFacet,
//             cylindersFacet,
//             batteryFacet,
//             totalWeightFacet,
//             emptyWeightFacet,
//             towingFacet,
//             wltpFacet,
//             consumptionFacet,
//             co2Facet
//         ] = await Promise.all([
//             getAccidentStatusFacetModel(lang, normalizedFilters),
//             getMfkWarrantyFacetModel(lang, normalizedFilters),
//             getVehicleConditionFacetModel(lang, normalizedFilters),
//             getEnergyEfficiencyFacetModel(normalizedFilters),
//             getListingAgeFacetModel(normalizedFilters),
//             getSeatFacetModel(normalizedFilters),
//             getDoorFacetModel(normalizedFilters),
//             getEnginePowerFacetModel(normalizedFilters),
//             getCubicCapacityFacetModel(normalizedFilters),
//             getCylindersFacetModel(normalizedFilters),
//             getBatteryCapacityFacetModel(normalizedFilters),
//             getTotalWeightFacetModel(normalizedFilters),
//             getEmptyWeightFacetModel(normalizedFilters),
//             getTowingCapacityFacetModel(normalizedFilters),
//             getWltpRangeFacetModel(normalizedFilters),
//             getConsumptionFacetModel(normalizedFilters),
//             getCo2EmissionFacetModel(normalizedFilters)
//         ]);

//             (facet?.options || []).map((item) => ({
//                 id: item.id ?? null,
//                 code: item.code ?? null,
//                 name: item.label ?? item.name ?? null,
//                 total: Number(item.count) || 0
//             }));

//             min_value: facet?.min_value ?? null,
//             max_value: facet?.max_value ?? null,
//             selected_range: facet?.selected_range || null,
//             breakdown: facet?.breakdown || {
//                 selected_count: 0,
//                 lower_count: 0,
//                 higher_count: 0
//             },
//             total_cars_found: Number(facet?.total_cars) || 0
//         });

//         data.accident_vehicle = mapFacetOptions(accidentFacet);
//         data.mfk_warranty = mapFacetOptions(mfkFacet);
//         data.vehicle_condition = mapFacetOptions(vehicleConditionFacet);
//         data.energy_efficiency = mapFacetOptions(energyFacet);
//         data.listing_age = mapFacetOptions(listingAgeFacet);

//         data.seat_range = mapRangeFacet(seatFacet);
//         data.door_range = mapRangeFacet(doorFacet);
//         data.engine_power = mapRangeFacet(enginePowerFacet);
//         data.cubic_capacity = mapRangeFacet(cubicCapacityFacet);
//         data.cylinders = mapRangeFacet(cylindersFacet);
//         data.battery_capacity = mapRangeFacet(batteryFacet);
//         data.total_weight = mapRangeFacet(totalWeightFacet);
//         data.empty_weight = mapRangeFacet(emptyWeightFacet);
//         data.towing_capacity = mapRangeFacet(towingFacet);
//         data.wltp_range = mapRangeFacet(wltpFacet);
//         data.consumption = mapRangeFacet(consumptionFacet);
//         data.co2_emission = mapRangeFacet(co2Facet);

//     } catch (error) {
//         console.error(error);
//     }
// };
