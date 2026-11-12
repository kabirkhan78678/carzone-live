import db from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import {
    viewCarDetailByCarIdModel,
    getCarImagesByCarIdModel,
    getSellerOpeningTimesModel,
    fetchCarImagesByCarId,
    suggestedCarOfCarId,
    getFeaturesListModel,
    getExtrasListModel
} from '../models/user.model.js';
import { buildMfk, parseArrayField } from '../utils/user_helper.js';
import { baseurl } from '../config/path.js';

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatSwissNumber = (value) => {
    const num = toNumber(value);
    if (num === null) return null;
    return Math.round(num).toLocaleString('de-CH').replace(/,/g, "'");
};

const cleanNonEmpty = (val) => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str || str === "-" || str === "null" || str === "undefined") return null;
    return str;
};

const pickFirstNonEmpty = (...values) => {
    for (const v of values) {
        const cleaned = cleanNonEmpty(v);
        if (cleaned !== null) return cleaned;
    }
    return null;
};

const formatDateLong = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit"
    });
};

const formatMonthYear = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
    });
};

const formatTime = (value) => {
    if (!value) return null;
    const [h = "00", m = "00"] = String(value).split(":");
    return `${h}:${m}`;
};

const asYesNo = (value) => {
    if (value === true || value === 1 || value === "1" || value === "yes" || value === "Yes") return "Yes";
    if (value === false || value === 0 || value === "0" || value === "no" || value === "No") return "No";
    return "N/A";
};

const toShortDayLabel = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const key = raw.toLowerCase();
    const map = {
        mon: "Mon", monday: "Mon",
        tue: "Tue", tues: "Tue", tuesday: "Tue",
        wed: "Wed", wednesday: "Wed",
        thu: "Thu", thur: "Thu", thurs: "Thu", thursday: "Thu",
        fri: "Fri", friday: "Fri",
        sat: "Sat", saturday: "Sat",
        sun: "Sun", sunday: "Sun"
    };

    if (map[key]) return map[key];
    const first3 = key.slice(0, 3);
    if (!first3) return "";
    return `${first3[0].toUpperCase()}${first3.slice(1)}`;
};

const mimeByExt = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
};

const getPublicBaseUrl = () =>
    process.env.PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    baseurl;

const toAbsoluteUrl = (raw) => {
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    if (value.startsWith("data:")) return value;
    if (/^https?:\/\//i.test(value)) return value;
    const publicBaseUrl = getPublicBaseUrl();
    if (value.startsWith("/")) return `${publicBaseUrl}${value}`;
    if (value.startsWith("profile/") || value.startsWith("uploads/")) return `${publicBaseUrl}/${value}`;
    return `${publicBaseUrl}/profile/${value}`;
};

const toDataUriIfLocalProfile = async (raw) => {
    const absolute = toAbsoluteUrl(raw);
    if (!absolute) return null;
    if (absolute.startsWith("data:")) return absolute;

    try {
        const url = new URL(absolute);
        const normalizedPath = decodeURIComponent(url.pathname || "");
        const markers = [
            { marker: "/profile/", basePath: path.join(process.cwd(), "public", "profile") },
            { marker: "/uploads/", basePath: path.join(process.cwd(), "uploads") }
        ];

        for (const { marker, basePath } of markers) {
            const idx = normalizedPath.indexOf(marker);
            if (idx === -1) continue;

            const relativePath = normalizedPath.slice(idx + marker.length).replace(/^\/+/, "");
            if (!relativePath) continue;

            const safeRelativePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
            const localPath = path.join(basePath, safeRelativePath);

            try {
                const fileBuffer = await fs.readFile(localPath);
                const ext = path.extname(localPath).toLowerCase();
                const mime = mimeByExt[ext] || "application/octet-stream";
                return `data:${mime};base64,${fileBuffer.toString("base64")}`;
            } catch {
                // try next marker/path
            }
        }

        return absolute;
    } catch {
        return absolute;
    }
};

const toDataUriFromFile = async (filePath) => {
    try {
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mime = mimeByExt[ext] || "application/octet-stream";
        return `data:${mime};base64,${fileBuffer.toString("base64")}`;
    } catch {
        return null;
    }
};

const statusLabelMap = {
    valid: "Valid",
    expired: "Expired",
    due_soon: "Due Soon",
    overdue: "Overdue",
    no_data: "No Data"
};

const statusClassMap = {
    valid: "text-success",
    expired: "text-danger",
    due_soon: "text-warning",
    overdue: "text-danger",
    no_data: "text-muted"
};

const toDisplayValue = (...values) => {
    const value = pickFirstNonEmpty(...values);
    return value !== null && value !== undefined ? value : "N/A";
};

// Fallback dictionary for features in case DB lookup is missing
const FEATURE_TRANSLATIONS_FALLBACK = {
    1: { en: "Accessible for disabled people", de: "Für Menschen mit Behinderung zugänglich", fr: "Accessible aux personnes handicapées", it: "Accessibile alle persone con disabilità" },
    2: { en: "Ceramic brakes", de: "Keramikbremsen", fr: "Freins en céramique", it: "Freni in ceramica" },
    3: { en: "Direct/parallel import", de: "Direkt-/Parallelimport", fr: "Importation directe/parallèle", it: "Importazione directa/parallela" },
    4: { en: "Race car", de: "Rennfahrzeug", fr: "Voiture de course", it: "Auto da corsa" },
    5: { en: "Tuning", de: "Tuning", fr: "Tuning", it: "Tuning" },
    6: { en: "8 Tyres", de: "8 Reifen", fr: "8 pneus", it: "8 pneumatici" }
};

const EXTRA_TRANSLATIONS_FALLBACK = {
    1: { en: "Handicapped accessible", de: "Behindertengerecht", fr: "Accessible aux personnes handicapées", it: "Accessibile ai disabili" },
    2: { en: "Racing vehicle", de: "Rennfahrzeug", fr: "Véhicule de course", it: "Veicolo da corsa" },
    3: { en: "Tuning", de: "Tuning", fr: "Tuning", it: "Tuning" },
    4: { en: "Alloy wheels", de: "Alufelgen", fr: "Jantes en alliage", it: "Cerchi in lega" },
    5: { en: "Leather seats", de: "Ledersitze", fr: "Sièges en cuir", it: "Sedili in pelle" },
    6: { en: "Navigation system", de: "Navigationssystem", fr: "Système de navigation", it: "Sistema di navigazione" },
    7: { en: "Sunroof", de: "Schiebedach", fr: "Toit ouvrant", it: "Tettuccio apribile" },
    8: { en: "Parking sensors", de: "Parksensoren", fr: "Capteurs de stationnement", it: "Sensori di parcheggio" },
    9: { en: "Heated seats", de: "Sitzheizung", fr: "Sièges chauffants", it: "Sedili riscaldati" },
    10: { en: "Tow hitch", de: "Anhängerkupplung", fr: "Attelage", it: "Gancio di traino" },
    11: { en: "LED headlights", de: "LED-Scheinwerfer", fr: "Phares LED", it: "Fari LED" },
    12: { en: "Adaptive cruise control", de: "Abstandstempomat", fr: "Régulateur de vitesse adaptatif", it: "Cruise control adattivo" }
};

/**
 * Resolves equipment & features array into human-readable labels
 */
const resolveEquipmentLabels = (rawFeatures, rawExtras, featureRows = [], extraRows = [], lang = 'en') => {
    const featureList = parseArrayField(rawFeatures, []);
    const extraList = parseArrayField(rawExtras, []);
    const combinedRaw = [...featureList, ...extraList];

    const featureMap = new Map();
    (featureRows || []).forEach((f) => {
        const label = f.name || f.title || f.display_key || f.feature_key;
        if (f.id != null) featureMap.set(String(f.id).trim(), label);
        if (f.feature_key) featureMap.set(String(f.feature_key).trim().toLowerCase(), label);
        if (f.display_key) featureMap.set(String(f.display_key).trim().toLowerCase(), label);
    });

    const extraMap = new Map();
    (extraRows || []).forEach((e) => {
        const label = e.title || e.name || e.display_key || e.extra_key;
        if (e.id != null) extraMap.set(String(e.id).trim(), label);
        if (e.extra_key) extraMap.set(String(e.extra_key).trim().toLowerCase(), label);
        if (e.display_key) extraMap.set(String(e.display_key).trim().toLowerCase(), label);
    });

    const results = [];
    const seen = new Set();

    for (const item of combinedRaw) {
        if (!item) continue;
        let strVal = typeof item === 'object' && item !== null
            ? String(item.name || item.value || item.title || item.key || item.id || '').trim()
            : String(item).trim();

        // Strip any brackets or quotes from malformed JSON strings
        strVal = strVal.replace(/[\[\]"']/g, '').trim();
        if (!strVal) continue;

        const lowerVal = strVal.toLowerCase();
        let resolvedLabel = null;

        // 1. Check DB feature map
        if (featureMap.has(strVal)) resolvedLabel = featureMap.get(strVal);
        else if (featureMap.has(lowerVal)) resolvedLabel = featureMap.get(lowerVal);

        // 2. Check DB extra map
        if (!resolvedLabel && extraMap.has(strVal)) resolvedLabel = extraMap.get(strVal);
        else if (!resolvedLabel && extraMap.has(lowerVal)) resolvedLabel = extraMap.get(lowerVal);

        // 3. Check fallback static dictionary
        const numId = Number(strVal);
        if (!resolvedLabel && Number.isFinite(numId)) {
            if (FEATURE_TRANSLATIONS_FALLBACK[numId]) {
                resolvedLabel = FEATURE_TRANSLATIONS_FALLBACK[numId][lang] || FEATURE_TRANSLATIONS_FALLBACK[numId]['en'];
            } else if (EXTRA_TRANSLATIONS_FALLBACK[numId]) {
                resolvedLabel = EXTRA_TRANSLATIONS_FALLBACK[numId][lang] || EXTRA_TRANSLATIONS_FALLBACK[numId]['en'];
            }
        }

        // 4. Fallback: if not purely a numeric ID, use the string label directly
        if (!resolvedLabel) {
            if (Number.isFinite(Number(strVal))) {
                continue; // Do not display raw naked number ID to client
            }
            resolvedLabel = strVal;
        }

        const normalized = String(resolvedLabel).trim();
        if (normalized && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            results.push(normalized);
        }
    }

    return results;
};

export const getCarDetailsForPdf = async (carId, language = 'en') => {
    const lang = ['en', 'de', 'fr', 'it'].includes(language) ? language : 'en';

    const carData = await viewCarDetailByCarIdModel(carId, lang);
    if (!carData || carData.length === 0) {
        return null;
    }

    const car = carData[0];

    let featureRows = [];
    let extraRows = [];
    try {
        [featureRows, extraRows] = await Promise.all([
            getFeaturesListModel(lang).catch(() => []),
            getExtrasListModel(lang, {}).catch(() => [])
        ]);
    } catch (lookupErr) {
        console.warn("Could not fetch feature/extra tables for PDF, using fallback dictionary:", lookupErr?.message);
    }

    const [images, openingTimesRaw, suggestedCars, leasingRows] = await Promise.all([
        getCarImagesByCarIdModel(carId),
        getSellerOpeningTimesModel(car.user_id),
        suggestedCarOfCarId(carId, car.user_id),
        db.query(
            `SELECT lease_duration_months, km_per_year, down_payment, monthly_price, interest_rate, residual_percentage
             FROM tbl_car_leasing
             WHERE car_id = ? AND is_active = 1
             ORDER BY id DESC
             LIMIT 1`,
            [carId]
        ).catch(() => [])
    ]);

    await Promise.all(
        (suggestedCars || []).map(async (item) => {
            const imgs = await fetchCarImagesByCarId(item.id);
            item.car_images = imgs.map((i) => i.images);
            return item;
        })
    );

    const mfk = buildMfk(car);
    const leasing = leasingRows?.[0] || null;

    const openingTimes = (openingTimesRaw || []).map((row) => {
        const isClosed = !!row.is_closed;
        const open = formatTime(row.open_time);
        const close = formatTime(row.close_time);
        return {
            day: row.day,
            dayLabel: toShortDayLabel(row.day),
            isClosed,
            open,
            close,
            display: isClosed ? "Closed" : `${open || "--"} - ${close || "--"}`
        };
    });

    // ----------------------------------------------------
    // 1️⃣ LEASING CALCULATION & SUMMARY
    // ----------------------------------------------------
    const basePrice = toNumber(car.totalPrice) ?? toNumber(car.selling_price) ?? toNumber(car.new_price);

    const months = toNumber(leasing?.lease_duration_months) || 48;
    const kmPerYear = toNumber(leasing?.km_per_year) || 10000;
    const interestRate = toNumber(leasing?.interest_rate) || 4.9;
    const residualPercent = toNumber(leasing?.residual_percentage) || 45.0;

    let kmMultiplier = 1.0;
    if (kmPerYear >= 15000) kmMultiplier = 0.95;
    if (kmPerYear >= 20000) kmMultiplier = 0.90;

    let downPayment = toNumber(leasing?.down_payment);
    if (downPayment === null && basePrice && basePrice > 0) {
        downPayment = Math.round(basePrice * 0.15); // Standard 15% down payment
    }

    let residualValue = null;
    if (basePrice && basePrice > 0) {
        residualValue = Math.round((basePrice * (residualPercent / 100)) * kmMultiplier);
    }

    let calculatedMonthly = null;
    if (basePrice && basePrice > 0 && residualValue !== null && downPayment !== null) {
        const capCost = basePrice - downPayment;
        const monthlyDepreciation = (capCost - residualValue) / (months || 1);
        const monthlyInterest = (capCost + residualValue) * (interestRate / 2400);
        calculatedMonthly = Math.max(1, Math.round(monthlyDepreciation + monthlyInterest));
    }

    const finalMonthlyPayment = toNumber(leasing?.monthly_price) ?? toNumber(car.leasingPrice) ?? calculatedMonthly;

    const mfkStatus = mfk?.status || "no_data";

    const resolvedImages = (
        await Promise.all(
            (images || [])
                .map((i) => i.images)
                .filter(Boolean)
                .map((img) => toDataUriIfLocalProfile(img))
        )
    ).filter(Boolean);

    const templateLogoPath = path.join(process.cwd(), "templates", "car_zone_logo.jpg");
    const fixedCarzoneLogo = await toDataUriFromFile(templateLogoPath);
    const sellerLogo = await toDataUriIfLocalProfile(car.profileImage || car.coverImage);

    const ratingNumeric = toNumber(car.google_rating ?? car.rating);
    const ratingDisplay =
        ratingNumeric !== null && ratingNumeric > 0
            ? String(Math.round(ratingNumeric * 10) / 10).replace(/\.0$/, "")
            : null;

    // ----------------------------------------------------
    // 2️⃣ DEALER INFORMATION RESOLUTION
    // ----------------------------------------------------
    const sellerContactPerson = pickFirstNonEmpty(
        car.fullName,
        [car.contact_first_name, car.contact_last_name].filter(Boolean).join(" "),
        car.userName
    );

    const sellerCompany = pickFirstNonEmpty(
        car.companyName,
        car.contact_company_name,
        car.fullName,
        sellerContactPerson
    ) || "AutoPlace Verified Dealer";

    // Phone resolution with country code
    const rawPhone = pickFirstNonEmpty(
        car.phoneNumber,
        car.contact_phone_number,
        car.business_phone,
        car.whatsappNumber
    );
    const countryCode = cleanNonEmpty(car.code || car.businessCountryCode || car.contact_country_code);
    let formattedPhone = null;
    if (rawPhone) {
        formattedPhone = countryCode && !rawPhone.includes(countryCode)
            ? `${countryCode} ${rawPhone}`
            : rawPhone;
    }

    const validEmail = pickFirstNonEmpty(car.email, car.contact_email);
    const validWebsite = pickFirstNonEmpty(car.websiteUrl, car.website_url, car.company_website);

    const streetAddress = pickFirstNonEmpty(
        car.fullAddress,
        car.companyAddress,
        car.contact_company_address,
        [car.contact_street, car.contact_house_number].filter(Boolean).join(" ")
    );

    const city = pickFirstNonEmpty(car.city, car.contact_city);
    const pincode = pickFirstNonEmpty(car.pincode, car.contact_postal_code);
    const country = pickFirstNonEmpty(car.country, car.contact_country);

    const hasLocation = Boolean(streetAddress || city || pincode);

    // ----------------------------------------------------
    // 3️⃣ EQUIPMENT & FEATURES RESOLUTION (LABELS INSTEAD OF IDS)
    // ----------------------------------------------------
    const resolvedEquipment = resolveEquipmentLabels(
        car.carFeatures,
        car.extras,
        featureRows,
        extraRows,
        lang
    );

    return {
        generatedAt: formatDateLong(new Date()),
        vehicle: {
            id: car.id,
            carName: `${car.brandName || ""} ${car.carModel || ""}`.trim(),
            brand: car.brandName,
            model: car.carModel,
            year: toDisplayValue(
                car.selectYear,
                car.first_registration_date ? new Date(car.first_registration_date).getUTCFullYear() : null
            ),
            firstRegistration: toDisplayValue(
                formatMonthYear(car.first_registration_date),
                car.selectYear
            ),
            mileage: car.carMileage ? formatSwissNumber(car.carMileage) : "N/A",
            fuel: toDisplayValue(
                car.fuel_type_label,
                car.fuel_type_value,
                car.fuelType
            ),
            transmission: toDisplayValue(
                car.transmission_label,
                car.transmission_value,
                car.transmission
            ),
            power: toDisplayValue(car.powerOutput),
            driveType: toDisplayValue(
                car.drive_type_label,
                car.drive_type_value,
                car.drive_type,
                car.driveType,
                car.drive_type_id ? String(car.drive_type_id) : null
            ),
            consumption: toDisplayValue(car.consumption),
            bodyType: toDisplayValue(
                car.body_type_label,
                car.body_type_value,
                car.body_type
            ),
            price: basePrice !== null ? formatSwissNumber(basePrice) : null,
            perMonthPrice: finalMonthlyPayment !== null ? formatSwissNumber(finalMonthlyPayment) : null,
            mfk: {
                ...mfk,
                statusLabel: statusLabelMap[mfkStatus] || mfkStatus,
                statusClass: statusClassMap[mfkStatus] || "text-muted",
                lastDateDisplay: formatMonthYear(mfk?.lastDate),
                nextDueDisplay: formatMonthYear(mfk?.nextDue)
            },
            description: car.description || "-"
        },

        images: resolvedImages,

        // Clean localized human-readable labels instead of raw IDs
        equipment: resolvedEquipment,

        warrantyAndReturn: {
            warrantyIncluded: !!car.mfk_warrenty_id,
            warrantyIncludedText: !!car.mfk_warrenty_id ? "Yes" : "No",
            coverage: "12 months / 20'000 km",
            qualityBaseText: asYesNo(car.quality_base),
            swissCarText: asYesNo(car.swiss_car),
            text: "From take-over, 12 months or 20,000 km"
        },

        seller: {
            name: sellerContactPerson,
            company: sellerCompany,
            rating: ratingDisplay,
            phone: formattedPhone,
            email: validEmail,
            website: validWebsite,
            address: streetAddress,
            city,
            pincode,
            country,
            hasLocation,
            profileImage: await toDataUriIfLocalProfile(car.profileImage),
            coverImage: await toDataUriIfLocalProfile(car.coverImage),
            tagline: cleanNonEmpty(car.tagline),
            description: cleanNonEmpty(car.sellerDescription),
            openingTimes
        },

        branding: {
            logoUrl: fixedCarzoneLogo || sellerLogo
        },

        leasing: {
            monthlyPayment: finalMonthlyPayment ? formatSwissNumber(finalMonthlyPayment) : null,
            downPayment: downPayment !== null ? formatSwissNumber(downPayment) : null,
            residualValue: residualValue !== null ? formatSwissNumber(residualValue) : null,
            interestRate: interestRate !== null ? String(interestRate) : "4.9",
            leaseDurationMonths: months ? String(months) : "48",
            kmPerYear: kmPerYear ? formatSwissNumber(kmPerYear) : "10'000",
            hasData: Boolean(finalMonthlyPayment || basePrice)
        },

        location: {
            latitude: car.latitude ?? null,
            longitude: car.longitude ?? null,
            mapUrl: car.latitude && car.longitude
                ? `https://maps.google.com/maps?q=${car.latitude},${car.longitude}&z=14&output=embed`
                : null
        },

        suggestedCars
    };
};
