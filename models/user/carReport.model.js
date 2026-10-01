import axios from 'axios';
import db from '../../config/db.js';

export const getCarVinByIdModel = async (carId) => {
    const [car] = await db.query(`
    SELECT vin_number
    FROM tbl_cars
    WHERE id = ?
  `, [carId]);

    return car;
};

export const generateCarVerticalReport = async (registration_number) => {
    const response = await axios.post(
        "https://api.carvertical.com/api/v1/checks",
        {
            registration_number,
            country_code: "IN",
        },
        {
            headers: {
                "x-api-key": process.env.CARVERTICAL_API_KEY,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

export const getCarById = async (carId) => {
    const rows = await db.query(
        `
    SELECT
      c.id,
      c.user_id,
      c.vrn,
      c.vin_number,
      c.isLeasing,
      c.mfk_status,
      c.last_mfk_date,
      c.next_mfk_due,
      c.brandName
    FROM tbl_cars c
    WHERE c.id = ?
      AND c.is_deleted = 0
    LIMIT 1
    `,
        [carId]
    );

    return rows?.[0] || null;
};

export const getCarByIdmfk = async (carId) => {
console.log('carId',carId);
 
    const result = await db.query(
        `
        SELECT
            id,
            first_registration_date,
            last_mfk_date,
            mfk_status,
            mfk_status_override,
            next_mfk_due
        FROM tbl_cars
        WHERE id = ?
        LIMIT 1
        `,
        [carId]
    );
console.log('result',result);
 
    return result[0] || null;
};

export const toSafeNumber = (value, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const getWarrantyDetailsService = async (carId, language = "en") => {
    const cars = await db.query(
        `
        SELECT
            c.id,
            c.mfk_warrenty_id,
            c.warranty_from,
            c.warranty_to,
            c.warranty_type_text,
            wt.warranty_key AS warranty,
            wq.code AS warranty_quality,
            wqt.label AS warranty_quality_label
        FROM tbl_cars c
        LEFT JOIN tbl_warranty_types wt
            ON wt.id = c.mfk_warrenty_id
        LEFT JOIN warranty_qualities wq
            ON wq.id = c.warranty_type_text
        LEFT JOIN warranty_qualities_translations wqt
            ON wqt.warranty_quality_id = wq.id
            AND wqt.language_code = ?
        WHERE c.id = ?
        LIMIT 1
        `,
        [language, carId]
    );

    if (!cars || cars.length === 0) {
        throw new Error("CAR_NOT_FOUND");
    }

    const car = cars[0];

    const selectedLanguage = ["en", "fr", "de", "it"].includes(language)
        ? language
        : "en";

    const warrantyType = car.warranty || null;

    // Fixed warranty types
    const WARRANTY_TYPE_LABELS = {
        en: {
            fresh_from_service: "Fresh from service",
            from_handover: "From handover",
            from_first_registration: "From first registration",
            from_date: "From date"
        },

        fr: {
            fresh_from_service: "Nouveau du service",
            from_handover: "À partir de la remise",
            from_first_registration: "À partir de la première immatriculation",
            from_date: "À partir de la date"
        },

        de: {
            fresh_from_service: "Frisch ab Service",
            from_handover: "Ab Übergabe",
            from_first_registration: "Ab Erstzulassung",
            from_date: "Ab Datum"
        },

        it: {
            fresh_from_service: "Fresco dal servizio",
            from_handover: "Dalla consegna",
            from_first_registration: "Dalla prima immatricolazione",
            from_date: "Dalla data"
        }
    };

    const warrantyTypeLabel =
        WARRANTY_TYPE_LABELS[selectedLanguage]?.[warrantyType] ||
        WARRANTY_TYPE_LABELS.en[warrantyType] ||
        warrantyType ||
        null;

    // No warranty
    if (warrantyType === "no_warranty") {
        return {
            warrantyIncluded: false,
            warrantyType: "no_warranty",
            warrantyCode: null,
            warrantyLabel: null,
            warrantyDescription: null,
            warrantyFrom: null,
            warrantyTo: null
        };
    }

    const qualityCode = car.warranty_quality || null;

    // Warranty package descriptions
    const WARRANTY_PACKAGE_MAPPING = {
        Q_BASE: {
            en: "12 months or 20,000 km",
            fr: "12 mois ou 20 000 km",
            de: "12 Monate oder 20.000 km",
            it: "12 mesi o 20.000 km"
        },

        Q_PLUS: {
            en: "24 months or 50,000 km",
            fr: "24 mois ou 50 000 km",
            de: "24 Monate oder 50.000 km",
            it: "24 mesi o 50.000 km"
        },

        PREMIUM: {
            en: "36 months or 100,000 km",
            fr: "36 mois ou 100 000 km",
            de: "36 Monate oder 100 000 km",
            it: "36 mesi o 100.000 km"
        }
    };

    const packageDescription =
        qualityCode
            ? WARRANTY_PACKAGE_MAPPING[qualityCode]?.[selectedLanguage] || null
            : null;

    // Combine human-readable warranty type + package description
    const warrantyDescription =
        warrantyTypeLabel && packageDescription
            ? `${warrantyTypeLabel}, ${packageDescription}`
            : warrantyTypeLabel || packageDescription || null;

    return {
        warrantyIncluded: true,
        warrantyType: warrantyType,
        warrantyTypeLabel: warrantyTypeLabel,
        warrantyCode: qualityCode,
        warrantyLabel: car.warranty_quality_label || null,
        warrantyDescription: warrantyDescription,
        warrantyFrom: car.warranty_from || null,
        warrantyTo: car.warranty_to || null
    };
};

export const getCarDetailsById = async (carId) => {
    const result = await db.query(
        `
        SELECT
            id,
            brandName,
            carModel,
            selling_price
        FROM tbl_cars
        WHERE id = ?
        LIMIT 1
        `,
        [carId]
    );

    return result[0] || null;
};

export const getCarNameById = async (carId) => {
    const result = await db.query(
        `
        SELECT carModel
        FROM tbl_cars
        WHERE id = ?
        LIMIT 1
        `,
        [carId]
    );

    return result[0]?.carModel || null;
};
