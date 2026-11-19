import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyBkFQIVCNlXw8R334Op4b8KLslYlTjPTz0";

// In-memory cache for fast lookups without repeating API calls
const geocodeCache = new Map();
const MAX_CACHE_SIZE = 2000;
const NEGATIVE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes negative cache for failed lookups

// Circuit breaker for Google Geocoding API (stops flooding when key is restricted/blocked)
let googleBlockedUntil = 0;
const CIRCUIT_BREAKER_DURATION_MS = 15 * 60 * 1000; // 15 minutes cooldown after REQUEST_DENIED

// Curated Swiss & European Cities and Postal Code Coordinates Database
const BUILT_IN_COORDINATES = {
    // Switzerland Major Cities
    "zurich": { lat: 47.3769, lng: 8.5417, city: "Zurich", country: "Switzerland", postal_code: "8000" },
    "zürich": { lat: 47.3769, lng: 8.5417, city: "Zürich", country: "Switzerland", postal_code: "8000" },
    "geneva": { lat: 46.2044, lng: 6.1432, city: "Geneva", country: "Switzerland", postal_code: "1200" },
    "genève": { lat: 46.2044, lng: 6.1432, city: "Genève", country: "Switzerland", postal_code: "1200" },
    "genf": { lat: 46.2044, lng: 6.1432, city: "Genf", country: "Switzerland", postal_code: "1200" },
    "basel": { lat: 47.5596, lng: 7.5886, city: "Basel", country: "Switzerland", postal_code: "4000" },
    "bâle": { lat: 47.5596, lng: 7.5886, city: "Bâle", country: "Switzerland", postal_code: "4000" },
    "bern": { lat: 46.9480, lng: 7.4474, city: "Bern", country: "Switzerland", postal_code: "3000" },
    "berne": { lat: 46.9480, lng: 7.4474, city: "Berne", country: "Switzerland", postal_code: "3000" },
    "lausanne": { lat: 46.5197, lng: 6.6323, city: "Lausanne", country: "Switzerland", postal_code: "1000" },
    "winterthur": { lat: 47.4984, lng: 8.7299, city: "Winterthur", country: "Switzerland", postal_code: "8400" },
    "lucerne": { lat: 47.0502, lng: 8.3093, city: "Lucerne", country: "Switzerland", postal_code: "6000" },
    "luzern": { lat: 47.0502, lng: 8.3093, city: "Luzern", country: "Switzerland", postal_code: "6000" },
    "st. gallen": { lat: 47.4245, lng: 9.3767, city: "St. Gallen", country: "Switzerland", postal_code: "9000" },
    "st gallen": { lat: 47.4245, lng: 9.3767, city: "St. Gallen", country: "Switzerland", postal_code: "9000" },
    "sankt gallen": { lat: 47.4245, lng: 9.3767, city: "Sankt Gallen", country: "Switzerland", postal_code: "9000" },
    "lugano": { lat: 46.0037, lng: 8.9511, city: "Lugano", country: "Switzerland", postal_code: "6900" },
    "biel": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", country: "Switzerland", postal_code: "2500" },
    "bienne": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", country: "Switzerland", postal_code: "2500" },
    "biel/bienne": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", country: "Switzerland", postal_code: "2500" },
    "thun": { lat: 46.7580, lng: 7.6280, city: "Thun", country: "Switzerland", postal_code: "3600" },
    "bellinzona": { lat: 46.1928, lng: 9.0170, city: "Bellinzona", country: "Switzerland", postal_code: "6500" },
    "fribourg": { lat: 46.8065, lng: 7.1620, city: "Fribourg", country: "Switzerland", postal_code: "1700" },
    "freiburg": { lat: 46.8065, lng: 7.1620, city: "Fribourg", country: "Switzerland", postal_code: "1700" },
    "schaffhausen": { lat: 47.6960, lng: 8.6349, city: "Schaffhausen", country: "Switzerland", postal_code: "8200" },
    "chur": { lat: 46.8508, lng: 9.5320, city: "Chur", country: "Switzerland", postal_code: "7000" },
    "uster": { lat: 47.3496, lng: 8.7188, city: "Uster", country: "Switzerland", postal_code: "8610" },
    "sion": { lat: 46.2331, lng: 7.3606, city: "Sion", country: "Switzerland", postal_code: "1950" },
    "sitten": { lat: 46.2331, lng: 7.3606, city: "Sitten", country: "Switzerland", postal_code: "1950" },
    "neuchatel": { lat: 46.9896, lng: 6.9293, city: "Neuchâtel", country: "Switzerland", postal_code: "2000" },
    "neuchâtel": { lat: 46.9896, lng: 6.9293, city: "Neuchâtel", country: "Switzerland", postal_code: "2000" },
    "aarau": { lat: 47.3925, lng: 8.0442, city: "Aarau", country: "Switzerland", postal_code: "5000" },
    "solothurn": { lat: 47.2088, lng: 7.5370, city: "Solothurn", country: "Switzerland", postal_code: "4500" },
    "zug": { lat: 47.1662, lng: 8.5155, city: "Zug", country: "Switzerland", postal_code: "6300" },
    "baden": { lat: 47.4737, lng: 8.3059, city: "Baden", country: "Switzerland", postal_code: "5400" },
    "olten": { lat: 47.3520, lng: 7.9077, city: "Olten", country: "Switzerland", postal_code: "4600" },
    "locarno": { lat: 46.1710, lng: 8.7995, city: "Locarno", country: "Switzerland", postal_code: "6600" },

    // Swiss Postal Codes
    "8000": { lat: 47.3769, lng: 8.5417, city: "Zürich", country: "Switzerland", postal_code: "8000" },
    "8001": { lat: 47.3725, lng: 8.5418, city: "Zürich", country: "Switzerland", postal_code: "8001" },
    "8002": { lat: 47.3600, lng: 8.5300, city: "Zürich", country: "Switzerland", postal_code: "8002" },
    "8003": { lat: 47.3700, lng: 8.5150, city: "Zürich", country: "Switzerland", postal_code: "8003" },
    "8004": { lat: 47.3780, lng: 8.5250, city: "Zürich", country: "Switzerland", postal_code: "8004" },
    "8005": { lat: 47.3880, lng: 8.5200, city: "Zürich", country: "Switzerland", postal_code: "8005" },
    "8006": { lat: 47.3830, lng: 8.5450, city: "Zürich", country: "Switzerland", postal_code: "8006" },
    "8008": { lat: 47.3550, lng: 8.5550, city: "Zürich", country: "Switzerland", postal_code: "8008" },
    "8048": { lat: 47.3870, lng: 8.4900, city: "Zürich Altstetten", country: "Switzerland", postal_code: "8048" },
    "8050": { lat: 47.4110, lng: 8.5440, city: "Zürich Oerlikon", country: "Switzerland", postal_code: "8050" },
    "8400": { lat: 47.4984, lng: 8.7299, city: "Winterthur", country: "Switzerland", postal_code: "8400" },
    "1200": { lat: 46.2044, lng: 6.1432, city: "Genève", country: "Switzerland", postal_code: "1200" },
    "1201": { lat: 46.2120, lng: 6.1450, city: "Genève", country: "Switzerland", postal_code: "1201" },
    "1202": { lat: 46.2180, lng: 6.1380, city: "Genève", country: "Switzerland", postal_code: "1202" },
    "1203": { lat: 46.2110, lng: 6.1210, city: "Genève", country: "Switzerland", postal_code: "1203" },
    "1204": { lat: 46.2010, lng: 6.1430, city: "Genève", country: "Switzerland", postal_code: "1204" },
    "1205": { lat: 46.1960, lng: 6.1370, city: "Genève", country: "Switzerland", postal_code: "1205" },
    "1000": { lat: 46.5197, lng: 6.6323, city: "Lausanne", country: "Switzerland", postal_code: "1000" },
    "1003": { lat: 46.5210, lng: 6.6310, city: "Lausanne", country: "Switzerland", postal_code: "1003" },
    "3000": { lat: 46.9480, lng: 7.4474, city: "Bern", country: "Switzerland", postal_code: "3000" },
    "3001": { lat: 46.9480, lng: 7.4400, city: "Bern", country: "Switzerland", postal_code: "3001" },
    "3011": { lat: 46.9480, lng: 7.4500, city: "Bern", country: "Switzerland", postal_code: "3011" },
    "4000": { lat: 47.5596, lng: 7.5886, city: "Basel", country: "Switzerland", postal_code: "4000" },
    "4001": { lat: 47.5584, lng: 7.5878, city: "Basel", country: "Switzerland", postal_code: "4001" },
    "6000": { lat: 47.0502, lng: 8.3093, city: "Luzern", country: "Switzerland", postal_code: "6000" },
    "6003": { lat: 47.0470, lng: 8.3070, city: "Luzern", country: "Switzerland", postal_code: "6003" },
    "9000": { lat: 47.4245, lng: 9.3767, city: "St. Gallen", country: "Switzerland", postal_code: "9000" },
    "6900": { lat: 46.0037, lng: 8.9511, city: "Lugano", country: "Switzerland", postal_code: "6900" },
    "2500": { lat: 47.1368, lng: 7.2468, city: "Biel/Bienne", country: "Switzerland", postal_code: "2500" },
    "3600": { lat: 46.7580, lng: 7.6280, city: "Thun", country: "Switzerland", postal_code: "3600" },
    "6500": { lat: 46.1928, lng: 9.0170, city: "Bellinzona", country: "Switzerland", postal_code: "6500" },
    "1700": { lat: 46.8065, lng: 7.1620, city: "Fribourg", country: "Switzerland", postal_code: "1700" },
    "8200": { lat: 47.6960, lng: 8.6349, city: "Schaffhausen", country: "Switzerland", postal_code: "8200" },
    "7000": { lat: 46.8508, lng: 9.5320, city: "Chur", country: "Switzerland", postal_code: "7000" },
    "8610": { lat: 47.3496, lng: 8.7188, city: "Uster", country: "Switzerland", postal_code: "8610" },
    "1950": { lat: 46.2331, lng: 7.3606, city: "Sion", country: "Switzerland", postal_code: "1950" },
    "2000": { lat: 46.9896, lng: 6.9293, city: "Neuchâtel", country: "Switzerland", postal_code: "2000" },
    "5000": { lat: 47.3925, lng: 8.0442, city: "Aarau", country: "Switzerland", postal_code: "5000" },
    "4500": { lat: 47.2088, lng: 7.5370, city: "Solothurn", country: "Switzerland", postal_code: "4500" },
    "6300": { lat: 47.1662, lng: 8.5155, city: "Zug", country: "Switzerland", postal_code: "6300" },

    // European Capitals / Major Cities
    "madrid": { lat: 40.4168, lng: -3.7038, city: "Madrid", country: "Spain", postal_code: "28001" },
    "barcelona": { lat: 41.3851, lng: 2.1734, city: "Barcelona", country: "Spain", postal_code: "08001" },
    "valencia": { lat: 39.4699, lng: -0.3763, city: "Valencia", country: "Spain", postal_code: "46001" },
    "berlin": { lat: 52.5200, lng: 13.4050, city: "Berlin", country: "Germany", postal_code: "10115" },
    "munich": { lat: 48.1351, lng: 11.5820, city: "München", country: "Germany", postal_code: "80331" },
    "münchen": { lat: 48.1351, lng: 11.5820, city: "München", country: "Germany", postal_code: "80331" },
    "frankfurt": { lat: 50.1109, lng: 8.6821, city: "Frankfurt", country: "Germany", postal_code: "60311" },
    "stuttgart": { lat: 48.7758, lng: 9.1829, city: "Stuttgart", country: "Germany", postal_code: "70173" },
    "paris": { lat: 48.8566, lng: 2.3522, city: "Paris", country: "France", postal_code: "75001" },
    "lyon": { lat: 45.7640, lng: 4.8357, city: "Lyon", country: "France", postal_code: "69001" },
    "marseille": { lat: 43.2965, lng: 5.3698, city: "Marseille", country: "France", postal_code: "13001" },
    "milan": { lat: 45.4642, lng: 9.1900, city: "Milan", country: "Italy", postal_code: "20121" },
    "milano": { lat: 45.4642, lng: 9.1900, city: "Milano", country: "Italy", postal_code: "20121" },
    "rome": { lat: 41.9028, lng: 12.4964, city: "Roma", country: "Italy", postal_code: "00100" },
    "roma": { lat: 41.9028, lng: 12.4964, city: "Roma", country: "Italy", postal_code: "00100" },
    "turin": { lat: 45.0703, lng: 7.6869, city: "Torino", country: "Italy", postal_code: "10121" },
    "torino": { lat: 45.0703, lng: 7.6869, city: "Torino", country: "Italy", postal_code: "10121" },

    // Indian Cities (for developer/testing compatibility)
    "indore": { lat: 22.7196, lng: 75.8577, city: "Indore", country: "India", postal_code: "452001" },
    "452001": { lat: 22.7196, lng: 75.8577, city: "Indore", country: "India", postal_code: "452001" }
};

const CITY_VARIANTS_MAP = {
    'zurich': ['zurich', 'zürich'],
    'zürich': ['zurich', 'zürich'],
    'geneva': ['geneva', 'genève', 'genf'],
    'genève': ['geneva', 'genève', 'genf'],
    'genf': ['geneva', 'genève', 'genf'],
    'basel': ['basel', 'bâle'],
    'bâle': ['basel', 'bâle'],
    'bern': ['bern', 'berne'],
    'berne': ['bern', 'berne'],
    'lucerne': ['lucerne', 'luzern'],
    'luzern': ['lucerne', 'luzern'],
    'biel': ['biel', 'bienne', 'biel/bienne'],
    'bienne': ['biel', 'bienne', 'biel/bienne'],
    'biel/bienne': ['biel', 'bienne', 'biel/bienne'],
    'st. gallen': ['st. gallen', 'st gallen', 'sankt gallen'],
    'st gallen': ['st. gallen', 'st gallen', 'sankt gallen'],
    'sankt gallen': ['st. gallen', 'st gallen', 'sankt gallen'],
    'neuchatel': ['neuchatel', 'neuchâtel'],
    'neuchâtel': ['neuchatel', 'neuchâtel'],
    'fribourg': ['fribourg', 'freiburg'],
    'freiburg': ['fribourg', 'freiburg'],
    'sion': ['sion', 'sitten'],
    'sitten': ['sion', 'sitten'],
    'milan': ['milan', 'milano'],
    'milano': ['milan', 'milano'],
    'rome': ['rome', 'roma'],
    'roma': ['rome', 'roma'],
    'munich': ['munich', 'münchen'],
    'münchen': ['munich', 'münchen'],
    'turin': ['turin', 'torino'],
    'torino': ['turin', 'torino']
};

export const getCityVariants = (name) => {
    if (!name || typeof name !== 'string') return [];
    const lower = name.trim().toLowerCase();
    return CITY_VARIANTS_MAP[lower] || [lower];
};

/**
 * Geocode an address/location string via Google Geocoding API with multi-tier fallback.
 * @param {string} query Address, city, or postal code
 * @returns {Promise<{latitude: number, longitude: number, formatted_address: string, city?: string, postal_code?: string, source: string}|null>}
 */
export const geocodeAddress = async (query) => {
    if (!query || typeof query !== 'string') return null;
    const cleanQuery = query.trim();
    if (!cleanQuery) return null;

    const cacheKey = cleanQuery.toLowerCase();

    // 1. Check in-memory cache
    if (geocodeCache.has(cacheKey)) {
        const cached = geocodeCache.get(cacheKey);
        if (cached && cached._isNegative) {
            if (Date.now() < cached.expiresAt) {
                return null; // Negative cached: address not found
            }
            geocodeCache.delete(cacheKey);
        } else if (cached) {
            return cached;
        }
    }

    // 2. Check built-in dictionary
    const dictLookup = BUILT_IN_COORDINATES[cacheKey] ||
        BUILT_IN_COORDINATES[cleanQuery.toLowerCase().replace(/,\s*(switzerland|ch|suisse|schweiz|svizzera)/gi, '').trim()];

    if (dictLookup) {
        const result = {
            latitude: dictLookup.lat,
            longitude: dictLookup.lng,
            formatted_address: `${dictLookup.city}, ${dictLookup.country}`,
            city: dictLookup.city,
            postal_code: dictLookup.postal_code,
            country: dictLookup.country,
            source: 'built-in'
        };
        geocodeCache.set(cacheKey, result);
        return result;
    }

    // 3. Try Google Geocoding API if key exists and circuit breaker is NOT active
    if (GOOGLE_API_KEY) {
        if (Date.now() < googleBlockedUntil) {
            // Google API is currently restricted/denied; skip to avoid flood and error spikes
        } else {
            try {
                const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${GOOGLE_API_KEY}`;
                const response = await axios.get(googleUrl, { timeout: 4000 });

                if (response.data && response.data.status === 'OK' && response.data.results?.length > 0) {
                    googleBlockedUntil = 0; // Reset circuit breaker on success
                    const firstResult = response.data.results[0];
                    const loc = firstResult.geometry.location;

                    let city = null;
                    let postal_code = null;
                    let country = null;

                    for (const comp of (firstResult.address_components || [])) {
                        if (comp.types.includes('locality')) city = comp.long_name;
                        if (comp.types.includes('postal_code')) postal_code = comp.long_name;
                        if (comp.types.includes('country')) country = comp.long_name;
                    }

                    const result = {
                        latitude: loc.lat,
                        longitude: loc.lng,
                        formatted_address: firstResult.formatted_address,
                        city,
                        postal_code,
                        country,
                        source: 'google'
                    };

                    if (geocodeCache.size >= MAX_CACHE_SIZE) {
                        const firstKey = geocodeCache.keys().next().value;
                        geocodeCache.delete(firstKey);
                    }
                    geocodeCache.set(cacheKey, result);
                    return result;
                } else if (response.data?.status === 'REQUEST_DENIED') {
                    // Activate circuit breaker for 15 minutes to prevent hammering Google with 403 errors
                    googleBlockedUntil = Date.now() + CIRCUIT_BREAKER_DURATION_MS;
                    console.warn(`[Geocoding] Google Geocoding REQUEST_DENIED (${response.data.error_message || 'API key restricted'}). Pausing Google calls for 15 min. Falling back to built-in/Nominatim.`);
                } else if (response.data?.status === 'OVER_QUERY_LIMIT') {
                    googleBlockedUntil = Date.now() + 5 * 60 * 1000;
                    console.warn(`[Geocoding] Google Geocoding OVER_QUERY_LIMIT. Pausing Google calls for 5 min.`);
                } else {
                    console.warn(`[Geocoding] Google Geocoding status: ${response.data?.status || 'NO_RESULT'}`);
                }
            } catch (googleError) {
                console.warn(`[Geocoding] Google API request error: ${googleError.message}`);
            }
        }
    }

    // 4. Try OpenStreetMap (Nominatim) Fallback
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;
        const response = await axios.get(nominatimUrl, {
            headers: {
                'User-Agent': 'AutoPlace-Geocoding-Service/1.0 (contact@autoplace.ch)'
            },
            timeout: 5000
        });

        if (Array.isArray(response.data) && response.data.length > 0) {
            const item = response.data[0];
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const result = {
                    latitude: lat,
                    longitude: lng,
                    formatted_address: item.display_name,
                    source: 'nominatim'
                };

                if (geocodeCache.size >= MAX_CACHE_SIZE) {
                    const firstKey = geocodeCache.keys().next().value;
                    geocodeCache.delete(firstKey);
                }
                geocodeCache.set(cacheKey, result);
                return result;
            }
        }
    } catch (nomErr) {
        console.warn(`[Geocoding] Nominatim fallback failed: ${nomErr.message}`);
    }

    // 5. Negative caching: Remember this failed lookup so we don't repeat external requests for 30 minutes
    if (geocodeCache.size >= MAX_CACHE_SIZE) {
        const firstKey = geocodeCache.keys().next().value;
        geocodeCache.delete(firstKey);
    }
    geocodeCache.set(cacheKey, { _isNegative: true, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS });

    return null;
};

/**
 * Resolve user location filter input into coordinates & structured location object.
 * Accepts city OR pincode/postal_code, and radius.
 * @param {Object} input - { city, pincode, postal_code, radius, latitude, longitude }
 * @returns {Promise<Object>}
 */
export const resolveLocationCoordinates = async (input = {}) => {
    if (!input || typeof input !== 'object') {
        return {
            city: null,
            pincode: null,
            radius: null,
            latitude: null,
            longitude: null,
            resolved: false,
            source: null
        };
    }

    const city = input.city ? String(input.city).trim() : null;
    const pincode = (input.pincode ?? input.postal_code ?? input.zip ?? input.plz) ? String(input.pincode ?? input.postal_code ?? input.zip ?? input.plz).trim() : null;
    const radiusNum = Number(input.radius ?? input.distance ?? input.radius_km);
    const radius = Number.isFinite(radiusNum) && radiusNum > 0 ? radiusNum : null;

    let latNum = Number(input.latitude ?? input.lat);
    let lngNum = Number(input.longitude ?? input.lng ?? input.lon);

    // If only radius is provided without city/coords, try userId's profile location
    if (!city && !pincode && (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) && input.userId) {
        try {
            const db = (await import('../config/db.js')).default;
            const uRows = await db.query('SELECT city, pincode, latitude, longitude FROM tbl_users WHERE id = ?', [input.userId]);
            if (uRows && uRows[0]) {
                if (uRows[0].city) city = String(uRows[0].city).trim();
                if (uRows[0].pincode) pincode = String(uRows[0].pincode).trim();
                if (Number.isFinite(Number(uRows[0].latitude)) && Number.isFinite(Number(uRows[0].longitude))) {
                    latNum = Number(uRows[0].latitude);
                    lngNum = Number(uRows[0].longitude);
                }
            }
        } catch {
            // ignore
        }
    }

    // If client already provided valid coordinates
    if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
        return {
            city: city || null,
            pincode: pincode || null,
            radius,
            latitude: latNum,
            longitude: lngNum,
            formatted_address: input.formatted_address || (city ? `${city}` : null),
            resolved: true,
            source: 'client_provided'
        };
    }

    // If neither city nor pincode is provided, cannot geocode
    if (!city && !pincode) {
        return {
            city: null,
            pincode: null,
            radius,
            latitude: null,
            longitude: null,
            resolved: false,
            source: null
        };
    }

    // Try geocoding: pincode has higher specificity if present, else city
    let geocode = null;

    if (pincode) {
        // e.g. "8001, Switzerland"
        geocode = await geocodeAddress(`${pincode}, Switzerland`);
        if (!geocode) {
            geocode = await geocodeAddress(pincode);
        }
    }

    if (!geocode && city) {
        geocode = await geocodeAddress(`${city}, Switzerland`);
        if (!geocode) {
            geocode = await geocodeAddress(city);
        }
    }

    if (geocode) {
        return {
            city: city || geocode.city || null,
            pincode: pincode || geocode.postal_code || null,
            radius,
            latitude: geocode.latitude,
            longitude: geocode.longitude,
            formatted_address: geocode.formatted_address,
            resolved: true,
            source: geocode.source
        };
    }

    // Geocoding couldn't find coordinates, return input with resolved=false
    return {
        city: city || null,
        pincode: pincode || null,
        radius,
        latitude: null,
        longitude: null,
        resolved: false,
        source: null
    };
};

export default {
    geocodeAddress,
    resolveLocationCoordinates
};

