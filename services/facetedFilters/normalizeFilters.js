const parseMaybeJson = (value) => {
    if (value === null || value === undefined) return {};
    if (typeof value !== "string") return value;

    try {
        return JSON.parse(value);
    } catch (error) {
        return {};
    }
};

const pickFirstDefined = (source, keys) => {
    for (const key of keys) {
        if (source[key] !== undefined && source[key] !== null) {
            return source[key];
        }
    }
    return undefined;
};

const toNullableNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeIdArray = (value) => {
    if (value === null || value === undefined || value === "") return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item) && item > 0);
    }

    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0 ? [value] : [];
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => Number(item.trim()))
            .filter((item) => Number.isFinite(item) && item > 0);
    }

    return [];
};

const normalizeStringArray = (value) => {
    if (value === null || value === undefined || value === "") return [];

    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

const parseRelaxedFacetedFilters = (value) => {
    if (typeof value !== "string") return {};

    const hasDoorKey = /\bdoors?\s*:/.test(value);
    if (!hasDoorKey) return {};

    const minMatch = value.match(/\bmin\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?/i);
    const maxMatch = value.match(/\bmax\s*:\s*["']?(-?\d+(?:\.\d+)?)["']?/i);
    const min = minMatch ? toNullableNumber(minMatch[1]) : null;
    const max = maxMatch ? toNullableNumber(maxMatch[1]) : null;

    if (min === null && max === null) return {};

    return {
        door: {
            min,
            max
        }
    };
};

export const parseJsonObjectSafe = (value) => {
    const parsed = parseMaybeJson(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length) {
        return parsed;
    }

    const relaxedParsed = parseRelaxedFacetedFilters(value);
    return relaxedParsed && typeof relaxedParsed === "object" && !Array.isArray(relaxedParsed) ? relaxedParsed : {};
};






export const normalizeFacetedFilters = (rawFilters = {}) => {
    const source = parseJsonObjectSafe(rawFilters);

    const rawPrice = parseJsonObjectSafe(source.price || {});
    const rawLeasing = parseJsonObjectSafe(source.leasing || {});
    const rawYear = parseJsonObjectSafe(source.year || {});
    const rawMileage = parseJsonObjectSafe(source.mileage || {});
    const rawPower = parseJsonObjectSafe(
        source.engine_power || source.power || source.power_output || {}
    );
    const rawAccidentStatus = parseJsonObjectSafe(source.accident_status || source.accident || {});
    const rawSeat = parseJsonObjectSafe(source.seat || {});
    const rawDoor = parseJsonObjectSafe(source.door || source.doors || {});
    const rawMfkWarranty = parseJsonObjectSafe(source.mfk_warranty || source.warranty || {});
    const rawVehicleCondition = parseJsonObjectSafe(source.vehicle_condition || source.condition || {});
    const rawEnergyEfficiency = parseJsonObjectSafe(source.energy_efficiency || source.energy || {});
    const rawListingAge = parseJsonObjectSafe(source.listing_age || {});
    const rawCubicCapacity = parseJsonObjectSafe(source.cubic_capacity || {});
    const rawCylinders = parseJsonObjectSafe(source.cylinders || {});
    const rawBatteryCapacity = parseJsonObjectSafe(source.battery_capacity || {});
    const rawTotalWeight = parseJsonObjectSafe(source.total_weight || {});
    const rawEmptyWeight = parseJsonObjectSafe(source.empty_weight || {});
    const rawTowingCapacity = parseJsonObjectSafe(source.towing_capacity || {});
    const rawWltpRange = parseJsonObjectSafe(source.wltp_range || {});
    const rawExteriorColor = parseJsonObjectSafe(source.exterior_color || {});
    const rawInteriorColor = parseJsonObjectSafe(source.interior_color || {});
    const rawConsumption = parseJsonObjectSafe(source.consumption || {});
    const rawCo2 = parseJsonObjectSafe(source.co2_emission || source.co2Emission || source.co2 || {});

    const rawPriceType = pickFirstDefined(source, ["price_type", "pricing_type"]);
    const hasLeasingRange = rawLeasing?.min !== undefined || rawLeasing?.max !== undefined;
    const normalizedPriceType =
        String(rawPriceType || rawPrice.type || (hasLeasingRange ? "leasing" : "purchase"))
            .toLowerCase() === "leasing"
            ? "leasing"
            : "purchase";

     const isMfkSelected =
    source.mfk === true ||
    source.mfk === "true" ||
    source.mfk === 1 ||
    source.mfk === "1";

const isWarrantySelected =
    source.warranty === true ||
    source.warranty === "true" ||
    source.warranty === 1 ||
    source.warranty === "1";

const isMetallicSelected =
    source.is_metallic === true ||
    source.is_metallic === "true" ||
    source.is_metallic === 1 ||
    source.is_metallic === "1" ||
    source.metallic === true ||
    source.metallic === "true" ||
    source.metallic === 1 ||
    source.metallic === "1";

    return {
        fuel_type_ids: normalizeIdArray(
            pickFirstDefined(source, ["fuel_type_ids", "fuelType", "selected_ids"])
        ),
        transmission_ids: normalizeIdArray(
            pickFirstDefined(source, ["transmission_ids", "transmission"])
        ),
        body_type_ids: normalizeIdArray(
            pickFirstDefined(source, ["body_type_ids", "body_type", "bodytypeIds"])
        ),
        drive_ids: normalizeIdArray(
            pickFirstDefined(source, ["drive_ids", "drive_type"])
        ),
        state_ids: normalizeIdArray(
            pickFirstDefined(source, ["state_ids"])
        ),
        accident_status_ids: normalizeIdArray(
            pickFirstDefined(rawAccidentStatus, ["ids", "selected_ids", "values"]) ??
            // pickFirstDefined(source, ["accident_status_ids", "vehicle_accident_status_id"])
            pickFirstDefined(source, ["accident_status_ids", "vehicle_accident_status_id", "accident_vehicle"])

        ),


        mfk_warranty_ids: normalizeIdArray(
            pickFirstDefined(rawMfkWarranty, ["ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["mfk_warranty_ids", "mfk_warrenty_id", "warranty_id"])
        ),
        vehicle_condition_ids: normalizeIdArray(
            pickFirstDefined(rawVehicleCondition, ["ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["vehicle_condition_ids", "condition_id", "carCondition"])
        ),
        energy_efficiency_codes: normalizeStringArray(
            pickFirstDefined(rawEnergyEfficiency, ["codes", "ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["energy_efficiency_codes", "energy_efficiency", "energyEfficiency"])
        ),
        listing_age_days: normalizeIdArray(
            pickFirstDefined(rawListingAge, ["ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["listing_age_days", "listing_age"])
        ),

        // exterior_color_ids: normalizeIdArray(
        //     pickFirstDefined(rawExteriorColor, ["ids", "selected_ids", "values"]) ??
        //     pickFirstDefined(source, ["exterior_color_ids", "exterior_color_id", "exterior_color"])
        // ),
        // interior_color_ids: normalizeIdArray(
        //     pickFirstDefined(rawInteriorColor, ["ids", "selected_ids", "values"]) ??
        //     pickFirstDefined(source, ["interior_color_ids", "interior_color_id", "interior_color"])
        // ),

        exterior_color_ids: normalizeIdArray(
            pickFirstDefined(rawExteriorColor, ["ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["exterior_color_ids", "exterior_color_id", "exterior_color"])
        ),
        interior_color_ids: normalizeIdArray(
            pickFirstDefined(rawInteriorColor, ["ids", "selected_ids", "values"]) ??
            pickFirstDefined(source, ["interior_color_ids", "interior_color_id", "interior_color"])
        ),
        price: {
            min: toNullableNumber(
                pickFirstDefined(rawPrice, ["min", "from"]) ??
                pickFirstDefined(rawLeasing, ["min", "from"]) ??
                pickFirstDefined(source, ["price_min", "price_from", "car_price_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawPrice, ["max", "to"]) ??
                pickFirstDefined(rawLeasing, ["max", "to"]) ??
                pickFirstDefined(source, ["price_max", "price_to", "car_price_to"])
            ),
            type: normalizedPriceType
        },
        year: {
            min: toNullableNumber(
                pickFirstDefined(rawYear, ["min", "from"]) ??
                pickFirstDefined(source, ["year_min", "year_from", "from_year"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawYear, ["max", "to"]) ??
                pickFirstDefined(source, ["year_max", "year_to", "to_year"])
            )
        },
        mileage: {
            min: toNullableNumber(
                pickFirstDefined(rawMileage, ["min", "from"]) ??
                pickFirstDefined(source, ["mileage_min", "mileage_from", "min_mileage", "from_km"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawMileage, ["max", "to"]) ??
                pickFirstDefined(source, ["mileage_max", "mileage_to", "max_mileage", "to_km"])
            )
        },
        engine_power: {
            min: toNullableNumber(
                pickFirstDefined(rawPower, ["min", "from"]) ??
                pickFirstDefined(source, ["power_min", "power_from", "min_hp"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawPower, ["max", "to"]) ??
                pickFirstDefined(source, ["power_max", "power_to", "max_hp"])
            ),
            unit: String(
                pickFirstDefined(rawPower, ["unit"]) ??
                pickFirstDefined(source, ["power_unit", "unit"]) ??
                "PS"
            ).toUpperCase()
        },
        seat: {
            min: toNullableNumber(
                pickFirstDefined(rawSeat, ["min", "from"]) ??
                pickFirstDefined(source, ["seat_min", "seat_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawSeat, ["max", "to"]) ??
                pickFirstDefined(source, ["seat_max", "seat_to"])
            )
        },
        door: {
            min: toNullableNumber(
                pickFirstDefined(rawDoor, ["min", "from"]) ??
                pickFirstDefined(source, ["door_min", "door_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawDoor, ["max", "to"]) ??
                pickFirstDefined(source, ["door_max", "door_to"])
            )
        },
        cubic_capacity: {
            min: toNullableNumber(
                pickFirstDefined(rawCubicCapacity, ["min", "from"]) ??
                pickFirstDefined(source, ["cubic_capacity_min", "cubic_capacity_from", "cubic_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawCubicCapacity, ["max", "to"]) ??
                pickFirstDefined(source, ["cubic_capacity_max", "cubic_capacity_to", "cubic_to"])
            )
        },
        cylinders: {
            min: toNullableNumber(
                pickFirstDefined(rawCylinders, ["min", "from"]) ??
                pickFirstDefined(source, ["cylinders_min", "cylinders_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawCylinders, ["max", "to"]) ??
                pickFirstDefined(source, ["cylinders_max", "cylinders_to"])
            )
        },
        battery_capacity: {
            min: toNullableNumber(
                pickFirstDefined(rawBatteryCapacity, ["min", "from"]) ??
                pickFirstDefined(source, ["battery_capacity_min", "battery_capacity_from", "battery_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawBatteryCapacity, ["max", "to"]) ??
                pickFirstDefined(source, ["battery_capacity_max", "battery_capacity_to", "battery_to"])
            )
        },
        total_weight: {
            min: toNullableNumber(
                pickFirstDefined(rawTotalWeight, ["min", "from"]) ??
                pickFirstDefined(source, ["total_weight_min", "total_weight_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawTotalWeight, ["max", "to"]) ??
                pickFirstDefined(source, ["total_weight_max", "total_weight_to"])
            )
        },
        empty_weight: {
            min: toNullableNumber(
                pickFirstDefined(rawEmptyWeight, ["min", "from"]) ??
                pickFirstDefined(source, ["empty_weight_min", "empty_weight_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawEmptyWeight, ["max", "to"]) ??
                pickFirstDefined(source, ["empty_weight_max", "empty_weight_to"])
            )
        },
        towing_capacity: {
            min: toNullableNumber(
                pickFirstDefined(rawTowingCapacity, ["min", "from"]) ??
                pickFirstDefined(source, ["towing_capacity_min", "towing_capacity_from", "towing_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawTowingCapacity, ["max", "to"]) ??
                pickFirstDefined(source, ["towing_capacity_max", "towing_capacity_to", "towing_to"])
            )
        },
        wltp_range: {
            min: toNullableNumber(
                pickFirstDefined(rawWltpRange, ["min", "from"]) ??
                pickFirstDefined(source, ["wltp_range_min", "wltp_range_from", "range_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawWltpRange, ["max", "to"]) ??
                pickFirstDefined(source, ["wltp_range_max", "wltp_range_to", "range_to"])
            )
        },
        consumption: {
            min: toNullableNumber(
                pickFirstDefined(rawConsumption, ["min", "from"]) ??
                pickFirstDefined(source, ["consumption_min", "consumption_from", "consumption_from_value"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawConsumption, ["max", "to"]) ??
                pickFirstDefined(source, ["consumption_max", "consumption_to", "consumption_to_value"])
            )
        },
        co2_emission: {
            min: toNullableNumber(
                pickFirstDefined(rawCo2, ["min", "from"]) ??
                pickFirstDefined(source, ["co2_emission_min", "co2_emission_from", "co2_min", "co2_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawCo2, ["max", "to"]) ??
                pickFirstDefined(source, ["co2_emission_max", "co2_emission_to", "co2_max", "co2_to"])
            )
        },
        brand_names: normalizeStringArray(
            pickFirstDefined(source, ["brand_names", "brandName", "make", "makes"])
        ),
        model_names: normalizeStringArray(
            pickFirstDefined(source, ["model_names", "carModel", "models", "model"])
        ),
        seller_types: normalizeStringArray(
            pickFirstDefined(source, ["seller_types", "sellerType"])
        ).filter((item) => String(item).toLowerCase() !== "all"),
        extra_filter_ids: normalizeIdArray(
            pickFirstDefined(source, ["extra_filter_ids", "extra_filters", "extraFilters", "extras_filters", "extras"])
        ),
        search_text: String(
            pickFirstDefined(source, ["search_text", "search"]) || ""
        ).trim(),
        mfk: isMfkSelected,
        warranty: isWarrantySelected,
        is_metallic: isMetallicSelected,
        metallic: isMetallicSelected,
        exclude_user_id: toNullableNumber(
            pickFirstDefined(source, ["exclude_user_id", "excluded_user_id", "viewer_user_id", "viewerUserId"])
        ),
        excluded_user_id: toNullableNumber(
            pickFirstDefined(source, ["exclude_user_id", "excluded_user_id", "viewer_user_id", "viewerUserId"])
        )
    };
};

export const hasAnyFacetedSelection = (filters = {}) => {
    const source = filters || {};

    const hasArraySelection =
        (source.fuel_type_ids || []).length > 0 ||
        (source.transmission_ids || []).length > 0 ||
        (source.body_type_ids || []).length > 0 ||
        (source.drive_ids || []).length > 0 ||
        (source.state_ids || []).length > 0 ||
        (source.accident_status_ids || []).length > 0 ||
        (source.mfk_warranty_ids || []).length > 0 ||
        (source.vehicle_condition_ids || []).length > 0 ||
        (source.energy_efficiency_codes || []).length > 0 ||
        (source.listing_age_days || []).length > 0 ||
        (source.exterior_color_ids || []).length > 0 ||
        (source.interior_color_ids || []).length > 0 ||
        (source.brand_names || []).length > 0 ||
        (source.model_names || []).length > 0 ||
        (source.seller_types || []).length > 0 ||
        (source.extra_filter_ids || []).length > 0;

    const hasRangeSelection =
        source?.price?.min !== null ||
        source?.price?.max !== null ||
        source?.year?.min !== null ||
        source?.year?.max !== null ||
        source?.mileage?.min !== null ||
        source?.mileage?.max !== null ||
        source?.seat?.min !== null ||
        source?.seat?.max !== null ||
        source?.door?.min !== null ||
        source?.door?.max !== null ||
        source?.engine_power?.min !== null ||
        source?.engine_power?.max !== null ||
        source?.cubic_capacity?.min !== null ||
        source?.cubic_capacity?.max !== null ||
        source?.cylinders?.min !== null ||
        source?.cylinders?.max !== null ||
        source?.battery_capacity?.min !== null ||
        source?.battery_capacity?.max !== null ||
        source?.total_weight?.min !== null ||
        source?.total_weight?.max !== null ||
        source?.empty_weight?.min !== null ||
        source?.empty_weight?.max !== null ||
        source?.towing_capacity?.min !== null ||
        source?.towing_capacity?.max !== null ||
        source?.wltp_range?.min !== null ||
        source?.wltp_range?.max !== null ||
        source?.consumption?.min !== null ||
        source?.consumption?.max !== null ||
        source?.co2_emission?.min !== null ||
        source?.co2_emission?.max !== null;

    const hasFlagSelection =
        Boolean(source.mfk) ||
        Boolean(source.warranty) ||
        Boolean(source.is_metallic) ||
        Boolean(source.metallic);

    const hasSearch = Boolean(source.search_text);

    return hasArraySelection || hasRangeSelection || hasFlagSelection || hasSearch;
};
