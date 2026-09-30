import { fetchUserByIdCount, fetchUserById, fetchCarImagesByCarId } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const asGuestUserFetchSellerCarsList = async (req, res) => {
    try {
        const {
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            page = 1,
            limit = 10
        } = req.query;

        // Guest user (No token required)
        const id = 0;
        const language = "en";

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;
        const offset = (pageNumber - 1) * limitNumber;

        // Total Count
        const totalResult = await fetchUserByIdCount(
            id,
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            language
        );

        const total = totalResult[0]?.total || 0;

        // Fetch Cars
        let data = await fetchUserById(
            id,
            brandName,
            carModel,
            totalPrice,
            fuelType,
            carColor,
            sittingCapacity,
            sellerType,
            search,
            priceRange,
            transmission,
            min_mileage,
            max_mileage,
            min_year,
            max_year,
            unit,
            min_hp,
            max_hp,
            body_type,
            consumption,
            drive_type_id,
            mfk_warrenty_id,
            state_id,
            limitNumber,
            offset,
            language
        );

        if (data.length) {
            data = await Promise.all(
                data.map(async (item) => {
                    const carImages = await fetchCarImagesByCarId(item.id);
                    const sellerName =
                        item.companyName || item.fullName || null;

                    return {
                        ...item,
                        sellerName,
                        warranty_type_id:
                            item.warranty_type_id_resolved ??
                            item.warranty_type_text ??
                            null,
                        warranty_type_value:
                            item.warranty_type_value ?? null,
                        warranty_value: item.warranty_value ?? null,
                        quality_seal_id: item.quality_seal_id ?? item.quality_seal_id_resolved ?? null,
                        quality_seal_name: item.quality_seal_name ?? null,
                        quality_seal_image: item.quality_seal_image ?? null,
                        quality_seal_description: item.quality_seal_description ?? null,
                        leasing_value:
                            item.leasing_value ??
                            item.leasingPrice ??
                            null,
                        annual_interest_rate:
                            item.annual_interest_rate ?? null,
                        residual_value:
                            item.residual_value ?? null,

                        // Guest user has no wishlist
                        isWishlist: false,

                        carImages: carImages.map((img) => img.images),

                        sellerDetails: {
                            sellerId: item.seller_id,
                            role: item.role,
                            sellerType: item.seller_type,
                            isBlocked: item.isBlocked,
                            isActive: item.is_active,
                            sellerName,
                            fullName: item.fullName,
                            email: item.email,
                            phoneNumber: item.phoneNumber,
                            whatsappNumber: item.whatsappNumber,
                            profileImage: item.profileImage,
                            city: item.city,
                            pincode: item.pincode,
                            fullAddress: item.fullAddress,
                            companyName: item.companyName,
                            companyAddress: item.companyAddress,
                            vat: item.vat,
                            countryCode: item.countryCode
                        }
                    };
                })
            );
        }

        if (data.length) {
            data.forEach((item) => {
                delete item.warranty_type_id_resolved;
                delete item.quality_seal_id_resolved;
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            language,
            message: getMessage(
                language,
                variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY
            ),
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber),
            data: data || []
        });
    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            getMessage("en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

const pickFirstNonEmpty = (...values) =>
    values.find(
        (v) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")
    );

const toBooleanValue = (v) => v === 1 || v === "1" || v === true;

const toDateString = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
};

const toTimeHHMM = (value) => {
    if (value === null || value === undefined) return value;
    const raw = String(value).trim();
    if (!raw) return raw;
    const [h = "", m = ""] = raw.split(":");
    if (!h || !m) return raw;
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

const normalizeOpeningTimes = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
        ...row,
        open_time: toTimeHHMM(row.open_time),
        close_time: toTimeHHMM(row.close_time)
    }));
};

export const buildVehicleDetailPayload = (car, openingTimes, mfk) => {
    const firstRegistrationDate = toDateString(car.first_registration_date);
    const parsedDate = firstRegistrationDate ? new Date(firstRegistrationDate) : null;
    const selectYearNum = Number(car.selectYear);
    const fallbackYear =
        Number.isInteger(selectYearNum) && selectYearNum >= 1900 ? selectYearNum : null;
    const registrationYear = parsedDate ? parsedDate.getUTCFullYear() : fallbackYear;
    const registrationMonth = parsedDate ? parsedDate.getUTCMonth() + 1 : null;

    const fuelLabel = pickFirstNonEmpty(car.fuel_type_label, car.fuelType) || null;
    const transmissionLabel = pickFirstNonEmpty(car.transmission_label, car.transmission) || null;
    const bodyTypeLabel = pickFirstNonEmpty(car.body_type_label, car.body_type) || null;
    const driveTypeLabel = pickFirstNonEmpty(car.drive_type_label, car.driveType) || null;

    const carPrice = pickFirstNonEmpty(car.new_price, car.selling_price, car.totalPrice) ?? null;
    const perMonthPrice = pickFirstNonEmpty(car.leasing_monthly_price, car.leasingPrice) ?? null;

        const powerParts = [];

if (car.power_ps != null) {
    powerParts.push(`${car.power_ps} PS`);
}

if (car.power_kw != null) {
    powerParts.push(`${car.power_kw} KW`);
}

const power = powerParts.length ? powerParts.join(" / ") : null;
    return {
        id: car.id,
        carName: `${car.brandName || ""} ${car.carModel || ""}`.trim(),
        brand: car.brandName,
        model: car.carModel,
        version: car.version ?? null,
        year: registrationYear,
        registration_year: registrationYear,
        registration_month: registrationMonth,
        first_registration_date: firstRegistrationDate,
        open_timmings: openingTimes,
        mileage: car.carMileage,
        fuel: fuelLabel,
        fuel_type_id: car.fuel_type_id ?? null,
        fuel_type_value: fuelLabel,
        transmission: transmissionLabel,
        transmission_id: car.transmission_id ?? null,
        driveType: driveTypeLabel,
        drive_type_id: car.drive_type_id ?? null,
        bodyType: bodyTypeLabel,
        body_type_id: car.body_type_id ?? null,
        power:  power,
        consumption: car.consumption,
        price: carPrice,
        carPrice,
        selling_price: car.selling_price ?? null,
        new_price: car.new_price ?? null,
        perMonthPrice,
        isLeasing: toBooleanValue(car.isLeasing),
        annual_interest_rate: car.leasing_interest_rate ?? null,
        residual_value: car.leasing_residual_percentage ?? null,
        leasing_value: perMonthPrice,
        leasing: {
            monthly_price: perMonthPrice,
            banking_partner: car.leasing_banking_partner ?? null,
            interest_rate: car.leasing_interest_rate ?? null,
            residual_percentage: car.leasing_residual_percentage ?? null
        },
        mfk,
        mfk_warrenty_id: car.mfk_warrenty_id ?? null,
        warranty_value: car.warranty_value ?? null,
        warranty_type_id: car.warranty_type_id_resolved ?? car.warranty_type_text ?? null,
        warranty_type_value: car.warranty_type_value ?? null,
        warranty_from: car.warranty_from ?? null,
        warranty_to: car.warranty_to ?? null,
        last_mfk_date: car.last_mfk_date ?? null,
        exterior_color_id: car.exterior_color_id ?? null,
        interior_color_id: car.interior_color_id ?? null,
        exterior_color_value: car.exterior_color_value ?? null,
        interior_color_value: car.interior_color_value ?? null,
        height_mm: car.height_mm ?? null,
        width_mm: car.width_mm ?? null,
        length_mm: car.length_mm ?? null,
        braked_towing_capacity_kg: car.braked_towing_capacity_kg ?? null,
        energy_efficiency: car.energy_efficiency ?? null,
        power_kw: car.power_kw ?? null,
        power_ps: car.power_ps ?? null,
        type_approval: car.type_approval ?? null,
        carCondition: car.carCondition ?? null,
        condition_value: car.condition_value ?? null,
        state_id: car.state_id ?? null,
        state_value: car.state_value ?? null,
        is_metallic: toBooleanValue(car.is_metallic),
        is_swiss_vehicle: toBooleanValue(car.is_swiss_vehicle),
        is_accident_vehicle: toBooleanValue(car.is_accident_vehicle),
        vin_number: car.vin_number ?? null,
        registration_master_number: car.registration_master_number ?? null,
        additional_title_999: car.additional_title_999 ?? null,
        first_name: car.contact_first_name ?? null,
        last_name: car.contact_last_name ?? null,
        street: car.contact_street ?? null,
        house_number: car.contact_house_number ?? null,
        postal_code: car.contact_postal_code ?? null,
        city: car.contact_city ?? null,
        po_box: car.contact_po_box ?? null,
        country: car.contact_country ?? null,
        country_code: car.contact_country_code ?? null,
        phone_number: car.contact_phone_number ?? null,
        description: car.description,
        quality_seal_id: car.quality_seal_id ?? car.quality_seal_id_resolved ?? null,
        quality_seal_name: car.quality_seal_name ?? null,
        quality_seal_image: car.quality_seal_image ?? null,
        quality_seal_description: car.quality_seal_description ?? null
    };
};
