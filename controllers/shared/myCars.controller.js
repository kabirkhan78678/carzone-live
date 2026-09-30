import { fetchCarsById, getLatestDraftCarByUser, getCarImagesByCarIdForDraft, getCarLeasingByCarIdForDraft, getCarContactByCarIdForDraft, fetchCarImagesByCarId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { parseArrayField, getMessage } from '../../utils/user_helper.js';

export const getMyCar = async (req, res) => {
    try {
        let lang = req.user?.language || 'en';
        let id = req.user.id;
        let data = await fetchCarsById(id, lang);

        // Only fully listed cars
        data = (data || []).filter(
            (item) => String(item.listing_status || "").toLowerCase() === "published"
        );

        if (data.length > 0) {
            data = await Promise.all(data.map(async (item) => {
                let carImgObjects = await fetchCarImagesByCarId(item.id);
                item.carImages = carImgObjects.map(img => img.images);
                item.warranty_type_id = item.warranty_type_id_resolved ?? item.warranty_type_text ?? null;
                item.warranty_type_value = item.warranty_type_value ?? null;
                item.warranty_value = item.warranty_value ?? null;
                item.leasing_value = item.leasing_value ?? item.leasingPrice ?? null;
                item.annual_interest_rate = item.annual_interest_rate ?? null;
                item.residual_value = item.residual_value ?? null;
                item.quality_seal_id = item.quality_seal_id ?? item.quality_seal_id_resolved ?? null;
                item.quality_seal_name = item.quality_seal_name ?? null;
                item.quality_seal_image = item.quality_seal_image ?? null;
                item.quality_seal_description = item.quality_seal_description ?? null;
                delete item.quality_seal_id_resolved;
                delete item.warranty_type_id_resolved;

                const isActive = Number(item.is_active) === 1;
                item.is_active = isActive ? 1 : 0;
                item.is_plan_expired = !isActive;
                item.can_renew = true;
                item.status_message = isActive 
                    ? "Active" 
                    : "Expired / Inactive (Renew subscription to activate)";

                return item;
            }));
        }
        data = data.length > 0 ? data : []
        return handleSuccess(res, 200, getMessage(lang, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY), data);

    } catch (error) {
        console.error("getMyCar error:", error);
        return handleError(res, 500, getMessage(variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getLatestDraftCar = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user?.language || "en";

        const [car] = await getLatestDraftCarByUser(user_id, lang);

        if (!car) {
            return handleSuccess(res, 200, "No draft found", {
                exists: false,
                car_id: null,
                page: 1,
                data: null
            });
        }

        const images = await getCarImagesByCarIdForDraft(car.id);
        const [leasing] = await getCarLeasingByCarIdForDraft(car.id);
        const [contact] = await getCarContactByCarIdForDraft(car.id);

        //   if (!val) return fallback;
        //   try { return JSON.parse(val); } catch { return fallback; }
        // };

        const toBool = (v) => v === 1 || v === "1" || v === true;

        let registration_month = null;
        let registration_year = null;
        const firstRegDateString =
            typeof car.first_registration_date_str === "string"
                ? car.first_registration_date_str
                : null;

        if (firstRegDateString) {
            const [y, m] = firstRegDateString.split("-").map(Number);
            if (Number.isInteger(y) && Number.isInteger(m)) {
                registration_year = y;
                registration_month = m;
            }
        }

        const payload = {
            car_id: car.id,
            page: Number(car.listing_step) || 1,

            // page 1
            brandName: car.brandName,
            carModel: car.carModel,
            version: car.version,
            fuel_type_id: car.fuel_type_id,
            transmission_id: car.transmission_id,
            drive_type_id: car.drive_type_id,
            body_type_id: car.body_type_id,

            fuel_type_value: car.fuel_type_value || null,
            transmission_value: car.transmission_value || null,
            drive_type_value: car.drive_type_value || null,
            body_type_value: car.body_type_value || null,

            registration_month,
            registration_year,
            first_registration_date: firstRegDateString,
            //carCondition: car.carCondition,
            carCondition: Number(car.carCondition),
            doors: car.doors ?? null,
            seats: car.sittingCapacity ?? null,
            cylinders: car.cylinders ?? null,
            consumption: car.consumption ?? null,
            emptyWeight: car.empty_weight ?? null,
            totalWeight: car.total_weight ?? null,
            gears: car.gears ?? null,
            power_kw: car.power_kw ?? null,
            power_ps: car.power_ps ?? null,
            powerOutput: car.powerOutput ?? (
                car.power_kw !== null && car.power_kw !== undefined && car.power_ps !== null && car.power_ps !== undefined
                    ? `${car.power_kw}(${car.power_ps})`
                    : car.power_kw !== null && car.power_kw !== undefined
                        ? String(car.power_kw)
                        : car.power_ps !== null && car.power_ps !== undefined
                            ? String(car.power_ps)
                            : null
            ),
            carMileage: car.carMileage,
            state_id: car.state_id,
            mfk_warrenty_id: car.mfk_warrenty_id,
            //warranty_type_id: car.warranty_type_text,
            warranty_type_id: car.warranty_type_id_resolved || null,

            warranty_from: car.warranty_from,
            warranty_to: car.warranty_to,
            last_mfk_date: car.last_mfk_date,

            exterior_color_id: car.exterior_color_id,
            interior_color_id: car.interior_color_id,

            exterior_color_value: car.exterior_color_value || null,
            interior_color_value: car.interior_color_value || null,

            condition_value: car.condition_value || null,
            warranty_value: car.warranty_value || null,
            warranty_type_value: car.warranty_type_value || null,

            is_metallic: toBool(car.is_metallic),
            is_swiss_vehicle: toBool(car.is_swiss_vehicle),
            is_accident_vehicle: toBool(car.is_accident_vehicle),
            height_mm: car.height_mm,
            width_mm: car.width_mm,
            length_mm: car.length_mm,
            braked_towing_capacity_kg: car.braked_towing_capacity_kg,
            energy_efficiency: car.energy_efficiency,
            type_approval: car.type_approval,
            vin_number: car.vin_number,
            registration_master_number: car.registration_master_number,
            carFeatures: parseArrayField(car.carFeatures, []),
            extras: parseArrayField(car.extras, []),
            additional_title_999: car.additional_title_999,
            description: car.description,
            quality_seal_id: car.quality_seal_id ?? car.quality_seal_id_resolved ?? null,
            quality_seal_name: car.quality_seal_name ?? null,
            quality_seal_image: car.quality_seal_image ?? null,
            quality_seal_description: car.quality_seal_description ?? null,

            // page 2
            selling_price: car.selling_price,
            new_price: car.new_price,
            isLeasing: toBool(car.isLeasing),
            banking_partner: leasing?.banking_partner || null,
            annual_interest_rate: leasing?.annual_interest_rate || null,
            residual_value: leasing?.residual_value || null,
            leasing_value: leasing?.leasing_value || null,

            // page 3
            first_name: contact?.first_name || null,
            last_name: contact?.last_name || null,
            street: contact?.street || null,
            house_number: contact?.house_number || null,
            postal_code: contact?.postal_code || null,
            city: contact?.city || null,
            po_box: contact?.po_box || null,
            country: contact?.country || null,
            country_code: contact?.country_code || null,
            phone_number: contact?.phone_number || null,

            // page4

            //carImages: images.map((x) => x.images),
            carImages: images.map((x) => ({
                id: x.id,
                url: x.images
            })),
            carReel: car.carReel,
            reelThumbnails: car.reelThumbnails,
            document: car.document,

            listing_status: car.listing_status,
            listing_step: car.listing_step,
               warranty_number_of_months:car.warranty_number_of_months,
            warranty_kilometer:car.warranty_kilometer,
            warranty_description:car.warranty_description,
            mfk_status_id:car.mfk_status_id,
             mfk_status_value:car.mfk_status_value
        };

        return handleSuccess(res, 200, "Latest draft fetched", {
            exists: true,
            car_id: car.id,
            page: Number(car.listing_step) || 1,
            data: payload
        });
    } catch (err) {
        console.error("getLatestDraftCar error:", err);
        return handleError(res, 500, "Internal Server Error");
    }
};
