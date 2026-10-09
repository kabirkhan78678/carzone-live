
import { getExtrasListModel } from './analytics.model.js';
import { normalizeFacetedFilters } from '../../services/facetedFilters/normalizeFilters.js';
import {
    getTextValues,
    buildWhereConditions,
    buildSellerJoinExtra
} from './filtersWhereBuilder.js';
import {
    querySellerTypeFacet,
    queryBrandAndModelFacets,
    queryCategoricalFacets,
    queryAgeOfListingFacet
} from './filtersDropdownQueries.js';
import { queryRangeAndTotalsFacets } from './filtersRangeQueries.js';

export const getAllFilters = async (filters, normalizedFilters = null) => {
    if (filters.vehicle_accident_status_id === undefined && filters.accident_vehicle !== undefined) {
        filters.vehicle_accident_status_id = filters.accident_vehicle;
    }

    const selectedBrandNames = getTextValues(filters.brand_name ?? filters.brandName);
    const selectedModels = getTextValues(filters.model_name ?? filters.model ?? filters.carModel);

    const sellerJoinExtra = buildSellerJoinExtra(filters, selectedBrandNames, selectedModels);
    const sellerType = await querySellerTypeFacet(sellerJoinExtra);

    const sellerJoin = `LEFT JOIN tbl_users u ON u.id = c.user_id`;
    const baseConditions = buildWhereConditions(filters, selectedBrandNames, selectedModels);
    const baseWhere = baseConditions.length ? `WHERE ${baseConditions.join(" AND ")}` : "";

    const carConditions = baseConditions.filter((cond) => String(cond).includes("c."));
    const nonCarConditions = baseConditions.filter((cond) => !String(cond).includes("c."));

    const carJoinClause = carConditions.length ? `AND ${carConditions.join(" AND ")}` : "";
    const whereNonCar = nonCarConditions.length ? `WHERE ${nonCarConditions.join(" AND ")}` : "WHERE 1=1";

    const lang = filters.lang || "en";
    const effectiveNormalized = normalizedFilters || normalizeFacetedFilters(filters);

    const [{ brand_name_list, model_name_list }, categorical, age_of_listing_raw, rangeTotals, extrasRows] = await Promise.all([
        queryBrandAndModelFacets(sellerJoin, baseWhere),
        queryCategoricalFacets(carJoinClause, sellerJoin, whereNonCar),
        queryAgeOfListingFacet(sellerJoin, baseWhere),
        queryRangeAndTotalsFacets(filters, sellerJoin, baseWhere),
        getExtrasListModel(lang, effectiveNormalized)
    ]);

    const extras = (extrasRows || [])
        .filter((row) => row.id !== 6)
        .map((row) => ({
            id: row.id,
            extra_key: row.extra_key,
            display_key: row.display_key,
            icon: row.icon ?? null,
            sort_order: row.sort_order,
            is_active: row.is_active,
            real_name_id: row.real_name_id,
            title: row.title || row.name || row.display_key || row.extra_key,
            name: row.name || row.title || row.display_key || row.extra_key,
            count: Number(row.count || 0)
        }));

    return {
        brand_name: brand_name_list,
        model_name: model_name_list,
        seller_type: sellerType,
        body_type: categorical.bodyType,
        fuel_type: categorical.fuelType,
        transmission: categorical.transmission,
        drive: categorical.drive,
        state: categorical.state,
        interior_color: categorical.interior_color,
        exterior_color: categorical.exterior_color,
        age_of_listing: age_of_listing_raw,
        year_range: rangeTotals.year_range,
        kilometer_range: rangeTotals.kilometer_range,
        price_range: rangeTotals.price_range,
        mfk_warranty: rangeTotals.mfk_warranty,
        total_cars: rangeTotals.total_cars,
        extras
    };
};
