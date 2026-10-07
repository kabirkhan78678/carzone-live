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

const normalizeAccidentStatusIds = (source = {}, rawAccidentStatus = {}) => {
    const candidates = [
        rawAccidentStatus?.ids,
        rawAccidentStatus?.selected_ids,
        rawAccidentStatus?.values,
        rawAccidentStatus?.codes,
        source.accident_status_ids,
        source.accident_status,
        source.vehicle_accident_status_id,
        source.accident_vehicle,
        source.is_accident_vehicle,
        source.accident,
        source.has_accident
    ];

    const result = new Set();

    for (const val of candidates) {
        if (val === null || val === undefined || val === '') continue;

        if (Array.isArray(val)) {
            for (const item of val) {
                if (typeof item === 'object' && item !== null) {
                    if (item.id) result.add(Number(item.id));
                    if (item.code === 'accident' || item.status_key === 'accident') result.add(1);
                    if (item.code === 'no_accident' || item.status_key === 'no_accident') result.add(2);
                } else if (typeof item === 'number' || (typeof item === 'string' && /^\d+$/.test(item.trim()))) {
                    const n = Number(item);
                    if (n === 1 || n === 2) result.add(n);
                    else if (n === 0) result.add(2);
                } else if (typeof item === 'string') {
                    const s = item.trim().toLowerCase();
                    if (s === 'accident' || s === 'has_accident' || s === 'accident_vehicle') result.add(1);
                    if (s === 'no_accident' || s === 'no_accident_vehicle' || s === 'accident_free' || s === 'without_accident') result.add(2);
                }
            }
        } else if (typeof val === 'number') {
            if (val === 1 || val === 2) result.add(val);
            else if (val === 0) result.add(2);
        } else if (typeof val === 'boolean') {
            result.add(val ? 1 : 2);
        } else if (typeof val === 'string') {
            const trimmed = val.trim().toLowerCase();
            if (/^\d+$/.test(trimmed)) {
                const n = Number(trimmed);
                if (n === 1 || n === 2) result.add(n);
                else if (n === 0) result.add(2);
            } else if (trimmed.includes(',')) {
                trimmed.split(',').forEach((part) => {
                    const p = part.trim().toLowerCase();
                    if (p === '1' || p === 'accident' || p === 'true') result.add(1);
                    else if (p === '2' || p === '0' || p === 'no_accident' || p === 'false') result.add(2);
                });
            } else if (trimmed === 'accident' || trimmed === 'true' || trimmed === 'has_accident') {
                result.add(1);
            } else if (trimmed === 'no_accident' || trimmed === 'false' || trimmed === 'accident_free') {
                result.add(2);
            }
        }
    }

    return Array.from(result);
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
        source.engine_power || source.power || source.power_output || source.powerOutput || source.enginePower || {}
    );
    const rawAccidentStatus = parseJsonObjectSafe(source.accident_status || source.accident || source.accident_vehicle || source.accidentStatus || {});
    const rawSeat = parseJsonObjectSafe(source.seat || source.seats || source.sittingCapacity || {});
    const rawDoor = parseJsonObjectSafe(source.door || source.doors || {});
    const rawMfkWarranty = parseJsonObjectSafe(source.mfk_warranty || source.warranty || source.mfkWarranty || {});
    const rawVehicleCondition = parseJsonObjectSafe(source.vehicle_condition || source.condition || source.vehicleCondition || {});
    const rawEnergyEfficiency = parseJsonObjectSafe(source.energy_efficiency || source.energy || source.energyEfficiency || {});
    const rawListingAge = parseJsonObjectSafe(source.listing_age || source.listingAge || source.age || {});
    const rawCubicCapacity = parseJsonObjectSafe(source.cubic_capacity || source.cubicCapacity || source.cubic || {});
    const rawCylinders = parseJsonObjectSafe(source.cylinders || {});
    const rawBatteryCapacity = parseJsonObjectSafe(source.battery_capacity || source.batteryCapacity || source.battery || {});
    const rawTotalWeight = parseJsonObjectSafe(source.total_weight || source.totalWeight || {});
    const rawEmptyWeight = parseJsonObjectSafe(source.empty_weight || source.emptyWeight || {});
    const rawTowingCapacity = parseJsonObjectSafe(source.towing_capacity || source.towingCapacity || source.braked_towing_capacity_kg || {});
    const rawWltpRange = parseJsonObjectSafe(source.wltp_range || source.wltpRange || source.wltp || {});
    const rawExteriorColor = parseJsonObjectSafe(source.exterior_color || source.exteriorColor || {});
    const rawInteriorColor = parseJsonObjectSafe(source.interior_color || source.interiorColor || {});
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
        source.mfk === "1" ||
        source.valid_technical_inspection === true ||
        source.valid_technical_inspection === "true" ||
        source.valid_technical_inspection === 1 ||
        source.valid_technical_inspection === "1";

    const isWarrantySelected =
        source.warranty === true ||
        source.warranty === "true" ||
        source.warranty === 1 ||
        source.warranty === "1" ||
        source.with_warranty === true ||
        source.with_warranty === "true" ||
        source.with_warranty === 1 ||
        source.with_warranty === "1";

    const isMetallicSelected =
        source.is_metallic === true ||
        source.is_metallic === "true" ||
        source.is_metallic === 1 ||
        source.is_metallic === "1" ||
        source.metallic === true ||
        source.metallic === "true" ||
        source.metallic === 1 ||
        source.metallic === "1";

    const rawCarType = pickFirstDefined(source, ["car_type", "carType", "car_types"]);
    const normalizedCarType = Array.isArray(rawCarType) ? rawCarType[0] : rawCarType;
    const isSwissVehicleSelected =
        source.is_swiss_vehicle === true ||
        source.is_swiss_vehicle === "true" ||
        source.is_swiss_vehicle === 1 ||
        source.is_swiss_vehicle === "1" ||
        source.isSwissVehicle === true ||
        source.isSwissVehicle === "true" ||
        source.isSwissVehicle === 1 ||
        source.isSwissVehicle === "1" ||
        source.ch_car === true ||
        source.ch_car === "true" ||
        source.ch_car === 1 ||
        source.ch_car === "1" ||
        normalizedCarType === "only_ch_cars" ||
        normalizedCarType === "ch";

    const rawMfkWarrantyIds = normalizeIdArray(
        pickFirstDefined(rawMfkWarranty, ["ids", "selected_ids", "values"]) ??
        pickFirstDefined(source, ["mfk_warranty_ids", "mfk_warrenty_id", "warranty_id"])
    );
    if (isMfkSelected && !rawMfkWarrantyIds.includes(1)) {
        rawMfkWarrantyIds.push(1);
    }
    if (isWarrantySelected && !rawMfkWarrantyIds.includes(2)) {
        rawMfkWarrantyIds.push(2);
    }
    if (isSwissVehicleSelected && !rawMfkWarrantyIds.includes(3)) {
        rawMfkWarrantyIds.push(3);
    }

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
        accident_status_ids: normalizeAccidentStatusIds(source, rawAccidentStatus),
        mfk_warranty_ids: rawMfkWarrantyIds,
        quality_seal_ids: normalizeIdArray(
            pickFirstDefined(source, ["quality_seal_ids", "quality_seals", "quality_seal", "quality_seal_id", "qualitySeals"])
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
                pickFirstDefined(rawPower, ["min", "from", "power_from", "min_power", "min_po"]) ??
                pickFirstDefined(source, ["power_min", "power_from", "min_hp", "min_power", "min_po", "power_output_from"])
            ),
            max: toNullableNumber(
                pickFirstDefined(rawPower, ["max", "to", "power_to", "max_power", "max_po"]) ??
                pickFirstDefined(source, ["power_max", "power_to", "max_hp", "max_power", "max_po", "power_output_to"])
            ),
            unit: String(
                pickFirstDefined(rawPower, ["unit", "power_unit"]) ??
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
        car_type: isSwissVehicleSelected ? "only_ch_cars" : (normalizedCarType ? String(normalizedCarType).toLowerCase().trim() : "all_standard"),
        is_swiss_vehicle: isSwissVehicleSelected,
        is_reel: Boolean(
            pickFirstDefined(source, ["is_reel", "has_reel", "only_reels", "for_reels", "reels", "isReel", "hasReel"]) === true ||
            pickFirstDefined(source, ["is_reel", "has_reel", "only_reels", "for_reels", "reels", "isReel", "hasReel"]) === "true" ||
            pickFirstDefined(source, ["is_reel", "has_reel", "only_reels", "for_reels", "reels", "isReel", "hasReel"]) === 1 ||
            pickFirstDefined(source, ["is_reel", "has_reel", "only_reels", "for_reels", "reels", "isReel", "hasReel"]) === "1"
        ),
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
        (source.extra_filter_ids || []).length > 0 ||
        (source.quality_seal_ids || []).length > 0;

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
        Boolean(source.metallic) ||
        Boolean(source.is_swiss_vehicle) ||
        (source.car_type && source.car_type !== "all" && source.car_type !== "all_standard");

    const hasSearch = Boolean(source.search_text);

    return hasArraySelection || hasRangeSelection || hasFlagSelection || hasSearch;
};
