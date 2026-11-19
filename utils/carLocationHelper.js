import { geocodeAddress } from '../services/geocoding.service.js';
import { updateCarCoordinates } from '../models/user/carDetailView.model.js';

/**
 * Validates whether a value is a valid numeric coordinate.
 */
export const isValidCoordinate = (val, min, max) => {
    if (val === null || val === undefined || val === '') return false;
    const num = Number(val);
    return Number.isFinite(num) && num >= min && num <= max;
};

/**
 * Resolves accurate coordinates for a car, with multi-tier geocoding fallback if missing in DB,
 * and enriches the car and location response object.
 *
 * @param {Object} car - Car details row from DB
 * @returns {Promise<Object>} Formatted location object
 */
export const resolveAndEnrichCarLocation = async (car) => {
    if (!car) {
        return {
            latitude: null,
            longitude: null,
            lat: null,
            lng: null,
            city: null,
            postal_code: null
        };
    }

    // 1. Pick coordinate candidates from tbl_cars and tbl_car_contacts
    const rawLat = car.latitude ?? car.car_latitude ?? car.contact_latitude;
    const rawLng = car.longitude ?? car.car_longitude ?? car.contact_longitude ?? car.contant_longitude;

    let latNum = isValidCoordinate(rawLat, -90, 90) ? Number(rawLat) : null;
    let lngNum = isValidCoordinate(rawLng, -180, 180) ? Number(rawLng) : null;

    // Discard (0, 0) "Null Island"
    if (latNum === 0 && lngNum === 0) {
        latNum = null;
        lngNum = null;
    }

    let needsDbUpdate = false;

    // 2. If coordinates are missing or invalid, resolve via geocoding
    if (latNum === null || lngNum === null) {
        const candidateQueries = [];

        // Candidate 1: Specific Contact Location (Postal Code + City + Country)
        const contactCity = car.contact_city ? String(car.contact_city).trim() : null;
        const contactZip = car.contact_postal_code ? String(car.contact_postal_code).trim() : null;
        const contactCountry = car.contact_country ? String(car.contact_country).trim() : 'Switzerland';

        if (contactZip && contactCity) {
            candidateQueries.push(`${contactZip} ${contactCity}, ${contactCountry}`);
        } else if (contactCity) {
            candidateQueries.push(`${contactCity}, ${contactCountry}`);
        } else if (contactZip) {
            candidateQueries.push(`${contactZip}, ${contactCountry}`);
        }

        // Candidate 2: Seller Location fallback (if contact details not present or different)
        const sellerCity = car.city ? String(car.city).trim() : null;
        const sellerZip = car.pincode ? String(car.pincode).trim() : null;

        if (sellerZip && sellerCity) {
            candidateQueries.push(`${sellerZip} ${sellerCity}, Switzerland`);
        } else if (sellerCity && sellerCity !== contactCity) {
            candidateQueries.push(`${sellerCity}, Switzerland`);
        } else if (sellerZip && sellerZip !== contactZip) {
            candidateQueries.push(`${sellerZip}, Switzerland`);
        }

        // Filter unique non-empty candidates (max 2 focused queries instead of 8 redundant ones)
        const uniqueQueries = [...new Set(candidateQueries.filter(Boolean))];

        for (const query of uniqueQueries) {
            try {
                const geo = await geocodeAddress(query);
                if (geo && isValidCoordinate(geo.latitude, -90, 90) && isValidCoordinate(geo.longitude, -180, 180)) {
                    latNum = geo.latitude;
                    lngNum = geo.longitude;
                    needsDbUpdate = true;
                    break;
                }
            } catch (err) {
                // Try next candidate
            }
        }
    }

    // 3. If geocoded or resolved, asynchronously save back to DB for fast future lookups
    if (needsDbUpdate && car.id && latNum !== null && lngNum !== null) {
        updateCarCoordinates(car.id, latNum, lngNum).catch(err => {
            console.warn(`[resolveAndEnrichCarLocation] Could not persist coordinates for car ${car.id}:`, err.message);
        });
    }

    const latStr = latNum !== null ? String(latNum) : null;
    const lngStr = lngNum !== null ? String(lngNum) : null;

    // 4. Enrich the in-memory car object
    car.latitude = latStr;
    car.longitude = lngStr;
    car.lat = latNum;
    car.lng = lngNum;
    car.contact_latitude = car.contact_latitude || latStr;
    car.contact_longitude = car.contact_longitude || lngStr;
    car.contant_longitude = car.contact_longitude;

    // 5. Build clean location object
    const location = {
        latitude: latStr,
        longitude: lngStr,
        lat: latNum,
        lng: lngNum,
        latitude_num: latNum,
        longitude_num: lngNum,
        city: car.contact_city || car.city || null,
        postal_code: car.contact_postal_code || car.pincode || null,
        street: car.contact_street || null,
        house_number: car.contact_house_number || null,
        country: car.contact_country || null,
        country_code: car.contact_country_code || null,
        address: [car.contact_street, car.contact_house_number].filter(Boolean).join(' ') || car.fullAddress || null
    };

    return location;
};

