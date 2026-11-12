import { EUROPEAN_COUNTRIES_DATA } from '../../utils/europeanCitiesData.js';
import { handleSuccess, handleError, getRequestLanguage } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Controller to fetch cities for Spain, Germany, Switzerland, France, and Italy
 * Public GET API (no token/authentication required)
 * Supports language localization (en, de, fr, it), country filtering, and search
 */
export const getCities = async (req, res) => {
    try {
        const lang = getRequestLanguage(req);
        const countryFilter = String(req.query.country || req.query.country_code || '').trim().toLowerCase();
        const searchQuery = String(req.query.search || req.query.q || '').trim().toLowerCase();
        const groupedOnly = String(req.query.grouped || '').toLowerCase() === 'true';

        // Filter countries if country filter is provided
        let filteredCountries = EUROPEAN_COUNTRIES_DATA;
        if (countryFilter) {
            filteredCountries = EUROPEAN_COUNTRIES_DATA.filter((c) => {
                const codeMatch = c.code.toLowerCase() === countryFilter;
                const nameMatch = c.name.toLowerCase() === countryFilter;
                const transMatch = Object.values(c.translations).some(
                    (val) => val.toLowerCase() === countryFilter
                );
                return codeMatch || nameMatch || transMatch;
            });
        }

        // Process each country with localized names and its filtered cities
        const processedCountries = [];
        const flatCities = [];

        for (const country of filteredCountries) {
            const countryLocalizedName = country.translations[lang] || country.name;

            // Process cities
            const localizedCities = country.cities
                .map((city) => {
                    const cityName = city.translations?.[lang] || city.name;
                    return {
                        id: city.id,
                        name: cityName,
                        native_name: city.name,
                        country: countryLocalizedName,
                        country_code: country.code,
                        ...(city.canton ? { canton: city.canton } : {}),
                        ...(city.postal_code ? { postal_code: city.postal_code } : {})
                    };
                })
                .filter((city) => {
                    if (!searchQuery) return true;
                    const matchesName = city.name.toLowerCase().includes(searchQuery);
                    const matchesNative = city.native_name?.toLowerCase().includes(searchQuery);
                    const matchesPostal = city.postal_code?.includes(searchQuery);
                    return matchesName || matchesNative || matchesPostal;
                });

            if (localizedCities.length > 0 || !searchQuery) {
                processedCountries.push({
                    id: country.id,
                    code: country.code,
                    name: countryLocalizedName,
                    cities_count: localizedCities.length,
                    cities: localizedCities
                });

                flatCities.push(...localizedCities);
            }
        }

        const responsePayload = groupedOnly
            ? {
                  total_countries: processedCountries.length,
                  total_cities: flatCities.length,
                  countries: processedCountries
              }
            : {
                  total_countries: processedCountries.length,
                  total_cities: flatCities.length,
                  countries: processedCountries,
                  cities: flatCities
              };

        const successMessage = getMessage(lang, 'citiesFetchedSuccessfully') || 'Cities fetched successfully';

        return handleSuccess(res, 200, successMessage, responsePayload, lang);
    } catch (error) {
        console.error('getCities error:', error);
        const lang = getRequestLanguage(req);
        return handleError(res, 500, getMessage(lang, 'internalServerError') || 'Internal Server Error', lang);
    }
};

