import { toNumber, composePowerOutput, toBool } from './carListingHelper.js';
import { buildFirstRegistrationDateFromMonthYear } from '../../utils/user_helper.js';

export const buildCarPayload = (body, filesData = {}, userId) => {
    const {
        car_id,
        listing_step,
        is_final_submit,
        page,
        fuel_type_id,
        transmission_id,
        drive_type_id,
        body_type_id,
        brandName,
        carModel,
        version,
        registration_month,
        registration_year,
        first_registration_date: firstRegistrationDateInput,
        carCondition,
        exterior_color,
        exterior_color_id,
        interior_color,
        seats,
        doors,
        cubic_capacity,
        cylinders,
        power_output,
        power_kw,
        power_ps,
        empty_weight,
        total_weight,
        wltp_range,
        towing_capacity,
        consumption,
        co2_emission,
        energy_efficiency,
        equipment,
        standard_equipment,
        optional_equipment,
        selling_price,
        new_price,
        selectYear,
        carMileage,
        carType,
        carName,
        title,
        description,
        is_expert_evaluated,
        has_accident,
        has_warranty,
        has_battery_certificate,
        is_price_negotiable,
        is_basic_plan,
        is_8x_tires,
        is_top_condition,
        is_non_smoking,
        is_service_book,
        is_direct_import,
        is_free_service,
        vehicle_condition_id,
        warranty_type_id,
        color_id,
        interior_color_id,
        warranty_quality_id,
        energy_efficiency_id,
        last_mfk_month,
        last_mfk_year,
        last_mfk_date,
        mfk_status_id,
        is_mfk_completed,
        type_approval,
        vin,
        zip_code,
        city,
        state,
        country,
        address,
        is_draft,
        quality_seal_id
    } = body;

    const firstRegistrationDate = firstRegistrationDateInput || buildFirstRegistrationDateFromMonthYear(registration_month, registration_year);
    const finalPowerOutput = composePowerOutput(power_kw, power_ps, power_output);

    const payload = {
        user_id: userId,
        brandName: brandName || body.brand_name || null,
        carModel: carModel || body.model_name || null,
        version: version || null,
        selectYear: selectYear || registration_year || body.year || null,
        carMileage: carMileage || body.km || body.mileage || null,
        totalPrice: selling_price || body.totalPrice || body.price || 0,
        selling_price: selling_price || body.selling_price || body.totalPrice || body.price || 0,
        new_price: new_price || body.new_price || null,
        fuel_type_id: toNumber(fuel_type_id || body.fuel_type),
        transmission_id: toNumber(transmission_id || body.transmission),
        drive_type_id: toNumber(drive_type_id || body.drive_type),
        body_type_id: toNumber(body_type_id || body.body_type),
        color_id: toNumber(color_id),
        interior_color_id: toNumber(interior_color_id),
        exterior_color_id: toNumber(exterior_color_id || color_id),
        sittingCapacity: toNumber(seats || body.sittingCapacity || body.seat),
        doors: toNumber(doors || body.door),
        cubic_capacity: toNumber(cubic_capacity),
        cylinders: toNumber(cylinders),
        powerOutput: finalPowerOutput || null,
        power_kw: toNumber(power_kw),
        power_ps: toNumber(power_ps || body.horse_power),
        empty_weight: toNumber(empty_weight),
        total_weight: toNumber(total_weight),
        wltp_range: toNumber(wltp_range),
        battery_capacity: toNumber(body.battery_capacity),
        braked_towing_capacity_kg: toNumber(towing_capacity || body.braked_towing_capacity_kg),
        consumption: consumption || body.consumption || null,
        co2Emission: toNumber(co2_emission || body.co2Emission),
        energy_efficiency: energy_efficiency || body.energy_efficiency || null,
        carFeatures: typeof equipment === 'object' ? JSON.stringify(equipment) : (equipment || body.carFeatures || null),
        extras: typeof body.extras === 'object' ? JSON.stringify(body.extras) : (body.extras || null),
        description: description || body.description || null,
        carCondition: carCondition || body.carCondition || null,
        state_id: toNumber(body.state_id || 1),
        is_accident_vehicle: has_accident !== undefined ? (toBool(has_accident) ? 1 : 0) : (body.is_accident_vehicle ? 1 : 0),
        first_registration_date: firstRegistrationDate || null,
        last_mfk_date: last_mfk_date || body.last_mfk_date || null,
        mfk_status_id: toNumber(mfk_status_id || body.mfk_status_id),
        type_approval: type_approval || body.type_approval || null,
        vin_number: vin || body.vin_number || body.vin || null,
        vrn: body.vrn || null,
        location: address || body.location || (city ? `${city}, ${country || ''}`.trim() : null),
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        listing_status: body.listing_status || (is_final_submit ? 'published' : (is_draft ? 'draft' : 'published')),
        listing_step: toNumber(listing_step) || 1,
        is_active: 1,
        is_deleted: 0,
        carReel: filesData.carReel || null,
        reelThumbnails: filesData.reelThumbnails || null,
        document: filesData.document || null,
        warranty_number_of_months: toNumber(body.warranty_number_of_months),
        warranty_kilometer: toNumber(body.warranty_kilometer),
        warranty_description: body.warranty_description || null,
        mfk_warrenty_id: toNumber(body.mfk_warrenty_id || warranty_type_id),
        quality_seal_id: (() => {
            const val = [
                quality_seal_id,
                body.quality_seal,
                body.qualitySealId,
                body.qualitySeal,
                body.quality_seals,
                body.qualitySeals,
                body.quality_seal_ids,
                body.quality_seal_id_resolved
            ].find(v => v !== undefined);
            if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") return null;
            if (typeof val === "number" && !isNaN(val)) return val > 0 ? val : null;
            if (typeof val === "string") {
                const trimmed = val.trim();
                if (/^\d+$/.test(trimmed)) return Number(trimmed) > 0 ? Number(trimmed) : null;
                try {
                    const parsed = JSON.parse(trimmed);
                    if (typeof parsed === "number") return parsed > 0 ? parsed : null;
                    if (Array.isArray(parsed) && parsed.length > 0) return Number(parsed[0]?.id ?? parsed[0]) || null;
                    if (typeof parsed === "object") return Number(parsed.id ?? parsed.quality_seal_id ?? parsed.value) || null;
                } catch (_) { return null; }
            }
            if (Array.isArray(val) && val.length > 0) return Number(val[0]?.id ?? val[0]) || null;
            if (typeof val === "object") return Number(val.id ?? val.quality_seal_id ?? val.value) || null;
            return null;
        })()
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
    });

    return payload;
};
