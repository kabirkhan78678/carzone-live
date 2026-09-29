import { getFacetedTotalCarsModel } from './facetedCommon.model.js';
import {
    getFuelFacetModel,
    getTransmissionFacetModel,
    getBodyTypeFacetModel,
    getDriveFacetModel,
    getStateFacetModel,
    getAccidentStatusFacetModel,
    getMfkWarrantyFacetModel,
    getVehicleConditionFacetModel,
    getEnergyEfficiencyFacetModel,
    getListingAgeFacetModel,
    getExteriorColorFacetModel,
    getInteriorColorFacetModel,
    getSellerTypeFacetModel
} from './facetedCategorical.model.js';
import {
    getPriceFacetModel,
    getYearFacetModel,
    getMileageFacetModel,
    getEnginePowerFacetModel,
    getSeatFacetModel,
    getDoorFacetModel,
    getCubicCapacityFacetModel,
    getCylindersFacetModel,
    getBatteryCapacityFacetModel,
    getTotalWeightFacetModel,
    getEmptyWeightFacetModel,
    getTowingCapacityFacetModel,
    getWltpRangeFacetModel,
    getConsumptionFacetModel,
    getCo2EmissionFacetModel
} from './facetedRanges.model.js';

export const getFacetedFiltersSnapshotModel = async (filters = {}, lang = "en") => {
    const totalCars = await getFacetedTotalCarsModel(filters);
    const priceFacet = await getPriceFacetModel(filters);
    const yearFacet = await getYearFacetModel(filters);
    const mileageFacet = await getMileageFacetModel(filters);
    const enginePowerFacet = await getEnginePowerFacetModel(filters);
    const seatFacet = await getSeatFacetModel(filters);
    const doorFacet = await getDoorFacetModel(filters);
    return {
        total_cars: totalCars,
        facets: {
            price: priceFacet,
            year: yearFacet,
            mileage: mileageFacet,
            engine_power: enginePowerFacet,
            seat: seatFacet,
            door: doorFacet,
            cubic_capacity: await getCubicCapacityFacetModel(filters),
            cylinders: await getCylindersFacetModel(filters),
            battery_capacity: await getBatteryCapacityFacetModel(filters),
            total_weight: await getTotalWeightFacetModel(filters),
            empty_weight: await getEmptyWeightFacetModel(filters),
            towing_capacity: await getTowingCapacityFacetModel(filters),
            wltp_range: await getWltpRangeFacetModel(filters),
            consumption: await getConsumptionFacetModel(filters),
            co2_emission: await getCo2EmissionFacetModel(filters),
            fuel: await getFuelFacetModel(filters, lang),
            transmission: await getTransmissionFacetModel(filters, lang),
            body_type: await getBodyTypeFacetModel(filters, lang),
            drive: await getDriveFacetModel(filters, lang),
            state: await getStateFacetModel(filters, lang),
            accident_status: await getAccidentStatusFacetModel(filters, lang),
            mfk_warranty: await getMfkWarrantyFacetModel(filters, lang),
            vehicle_condition: await getVehicleConditionFacetModel(filters, lang),
            energy_efficiency: await getEnergyEfficiencyFacetModel(filters),
            listing_age: await getListingAgeFacetModel(filters),
            exterior_color: await getExteriorColorFacetModel(filters, lang),
            interior_color: await getInteriorColorFacetModel(filters, lang),
            seller_type: await getSellerTypeFacetModel(filters)
        }
    };
};
