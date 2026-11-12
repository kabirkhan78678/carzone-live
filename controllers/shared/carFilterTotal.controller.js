import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { filterCarsModel } from '../../models/user.model.js';
import { getFacetedTotalCarsModel } from '../../models/facetedFilter.model.js';
import { resolveLocationCoordinates } from '../../services/geocoding.service.js';

export const filterCarsController = async (req, res) => {
    try {
        const rawQuery = req.query || {};
        const activeFiltersInput = parseFacetedInput(
            rawQuery.active_filters ?? rawQuery.applied_filters
        );

        const mergedInput = {
            ...rawQuery,
            ...activeFiltersInput
        };

        const locationInput = (typeof mergedInput.location === 'object' && mergedInput.location !== null) ? mergedInput.location : {};
        const rawCity = mergedInput.city ?? mergedInput.cityName ?? mergedInput.city_name ?? locationInput.city ?? locationInput.cityName ?? (typeof mergedInput.location === 'string' && isNaN(Number(mergedInput.location.trim())) ? mergedInput.location : undefined);
        const rawPincode = mergedInput.pincode ?? mergedInput.postal_code ?? mergedInput.postalCode ?? mergedInput.zip ?? mergedInput.zipcode ?? mergedInput.plz ?? locationInput.pincode ?? locationInput.postal_code ?? locationInput.zip ?? (typeof mergedInput.location === 'string' && !isNaN(Number(mergedInput.location.trim())) ? mergedInput.location : undefined);
        const rawRadius = mergedInput.radius ?? mergedInput.distance ?? mergedInput.radius_km ?? locationInput.radius ?? locationInput.distance;
        const rawLat = mergedInput.latitude ?? mergedInput.lat ?? locationInput.latitude ?? locationInput.lat;
        const rawLng = mergedInput.longitude ?? mergedInput.lng ?? mergedInput.lon ?? locationInput.longitude ?? locationInput.lng;

        const hasLocationInput = Boolean(rawCity || rawPincode || (rawLat && rawLng));

        if (Object.keys(activeFiltersInput).length || hasLocationInput) {
            let resolvedLocation = null;
            if (hasLocationInput) {
                resolvedLocation = await resolveLocationCoordinates({
                    city: rawCity,
                    pincode: rawPincode,
                    radius: rawRadius,
                    latitude: rawLat,
                    longitude: rawLng
                });
            }

            const normalizedFilters = normalizeFacetedFilters({
                ...mergedInput,
                ...(resolvedLocation ? { location: resolvedLocation } : {})
            });

            const total = await getFacetedTotalCarsModel(normalizedFilters);

            return res.json({
                success: true,
                total,
                ...(resolvedLocation ? { location: resolvedLocation } : {})
            });
        }

        const result = await filterCarsModel(req.query);

        res.json({
            success: true,
            total: result.total,
            // only count is required data is commented
            //data: result.data,
            //yearCounts: result.yearCounts,
            //priceCounts: result.priceCounts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
