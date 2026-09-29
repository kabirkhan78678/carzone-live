import db from '../config/db.js';
import fs from 'fs/promises';
import path from 'path';
import { viewCarDetailByCarIdModel, getCarImagesByCarIdModel, getSellerOpeningTimesModel, fetchCarImagesByCarId, suggestedCarOfCarId } from '../models/user.model.js';
import { buildMfk } from '../utils/user_helper.js';
import { baseurl } from '../config/path.js';

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
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
        mon: "Mon",
        monday: "Mon",
        tue: "Tue",
        tues: "Tue",
        tuesday: "Tue",
        wed: "Wed",
        wednesday: "Wed",
        thu: "Thu",
        thur: "Thu",
        thurs: "Thu",
        thursday: "Thu",
        fri: "Fri",
        friday: "Fri",
        sat: "Sat",
        saturday: "Sat",
        sun: "Sun",
        sunday: "Sun"
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

const pickFirstNonEmpty = (...values) =>
    values.find(
        (v) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "")
    );

const toDisplayValue = (...values) => {
    const value = pickFirstNonEmpty(...values);
    return value !== undefined ? value : "N/A";
};

export const getCarDetailsForPdf = async (carId) => {
    const carData = await viewCarDetailByCarIdModel(carId);
    if (!carData || carData.length === 0) {
        return null;
    }

    const car = carData[0];

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
        )
    ]);

    await Promise.all(
        suggestedCars.map(async (item) => {
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

    const monthlyPayment = toNumber(leasing?.monthly_price) ?? toNumber(car.leasingPrice);
    const residualPercent = toNumber(leasing?.residual_percentage);
    const basePrice = toNumber(car.totalPrice);
    const residualValue = basePrice !== null && residualPercent !== null
        ? (basePrice * residualPercent) / 100
        : null;

    const mfkStatus = mfk?.status || "no_data";

    const resolvedImages = (
        await Promise.all(
            (images || [])
                .map((i) => i.images)
                .filter(Boolean)
                .map((img) => toDataUriIfLocalProfile(img))
        )
    ).filter(Boolean);

    if ((images || []).length > 0 && resolvedImages.length === 0) {
        console.warn(`PDF image resolution failed for carId=${carId}`);
    }

    const templateLogoPath = path.join(process.cwd(), "templates", "car_zone_logo.jpg");
    const fixedCarzoneLogo = await toDataUriFromFile(templateLogoPath);
    const sellerLogo = await toDataUriIfLocalProfile(car.profileImage || car.coverImage);
    
    const ratingNumeric = toNumber(car.google_rating ?? car.rating);
    const ratingDisplay =
        ratingNumeric !== null && ratingNumeric > 0
            ? String(Math.round(ratingNumeric * 10) / 10).replace(/\.0$/, "")
            : null;

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
            mileage: toDisplayValue(car.carMileage),
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
            price: toDisplayValue(car.totalPrice, car.selling_price, car.new_price),
            perMonthPrice: toDisplayValue(car.leasingPrice, leasing?.monthly_price),
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

        equipment: car.carFeatures
            ? car.carFeatures.split(",").map((i) => i.trim()).filter(Boolean)
            : [],

        warrantyAndReturn: {
            warrantyIncluded: !!car.mfk_warrenty_id,
            warrantyIncludedText: !!car.mfk_warrenty_id ? "Yes" : "No",
            coverage: "12 months / 20'000 km",
            qualityBaseText: asYesNo(car.quality_base),
            swissCarText: asYesNo(car.swiss_car),
            text: "From take-over, 12 months or 20,000 km"
        },

        seller: {
            name: car.fullName || "-",
            company: car.companyName || "-",
            // rating: car.google_rating || car.rating || "N/A",
            rating: ratingDisplay,
            phone: car.phoneNumber || "-",
            whatsapp: car.whatsappNumber || "-",
            email: car.email || "-",
            profileImage: await toDataUriIfLocalProfile(car.profileImage),
            coverImage: await toDataUriIfLocalProfile(car.coverImage),
            website: car.websiteUrl || "-",
            // address: car.fullAddress || "N/A",
            address: car.fullAddress || null,
            city: car.city || "-",
            pincode: car.pincode || "-",
            tagline: car.tagline || "-",
            description: car.sellerDescription || "-",
            openingTimes
        },
        branding: {
            logoUrl: fixedCarzoneLogo || sellerLogo
        },

        leasing: {
            monthlyPayment: monthlyPayment ?? "-",
            residualValue: residualValue ?? "-",
            interestRate: leasing?.interest_rate ?? "-",
            leaseDurationMonths: leasing?.lease_duration_months ?? "-",
            kmPerYear: leasing?.km_per_year ?? "-",
            downPayment: leasing?.down_payment ?? "-"
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
