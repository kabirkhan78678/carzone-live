import db from '../../config/db.js';
import { buildFacetedConditions, buildWhereClause } from '../../services/facetedFilters/buildFacetWhereClause.js';

export const toSafeNumber = (value, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const toNullableNumber = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
};

export const getFacetedTotalCarsModel = async (filters = {}, excludeFacet = null) => {
    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "tc",
        excludeFacet
    });
    const whereClause = buildWhereClause(conditions);
    const rows = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM tbl_cars AS tc
        ${whereClause}
        `,
        params
    );
    return toSafeNumber(rows[0]?.total, 0);
};

export const getRangeFacetSummary = async ({
    filters = {},
    excludeFacet = null,
    selectedMin = null,
    selectedMax = null,
    expression = null
}) => {
    if (!expression) {
        throw new Error("getRangeFacetSummary requires 'expression'");
    }

    const { conditions, params } = buildFacetedConditions(filters, {
        alias: "c",
        excludeFacet
    });
    const whereConditions = [...conditions, `${expression} IS NOT NULL`];
    const whereClause = buildWhereClause(whereConditions);
    const rangeRows = await db.query(
        `
        SELECT
            COUNT(*) AS total_cars,
            MIN(${expression}) AS min_value,
            MAX(${expression}) AS max_value
        FROM tbl_cars AS c
        ${whereClause}
        `,
        params
    );
    const totalCars = toSafeNumber(rangeRows[0]?.total_cars, 0);
    const minValue = toNullableNumber(rangeRows[0]?.min_value);
    const maxValue = toNullableNumber(rangeRows[0]?.max_value);
    if (!totalCars || minValue === null || maxValue === null) {
        return {
            total_cars: totalCars,
            min_value: 0,
            max_value: 0,
            selected: {
                min: selectedMin ?? 0,
                max: selectedMax ?? 0,
                count: 0,
                lower_count: 0,
                higher_count: 0
            }
        };
    }
    let normalizedSelectedMin = selectedMin ?? minValue;
    let normalizedSelectedMax = selectedMax ?? maxValue;
    if (normalizedSelectedMin > normalizedSelectedMax) {
        const swapValue = normalizedSelectedMin;
        normalizedSelectedMin = normalizedSelectedMax;
        normalizedSelectedMax = swapValue;
    }
    const selectedRows = await db.query(
        `
        SELECT
            COUNT(CASE WHEN ${expression} >= ? AND ${expression} <= ? THEN 1 END) AS selected_count,
            COUNT(CASE WHEN ${expression} < ? THEN 1 END) AS lower_count,
            COUNT(CASE WHEN ${expression} > ? THEN 1 END) AS higher_count
        FROM tbl_cars AS c
        ${whereClause}
        `,
        [
            normalizedSelectedMin,
            normalizedSelectedMax,
            normalizedSelectedMin,
            normalizedSelectedMax,
            ...params
        ]
    );
    const selectedCount = toSafeNumber(selectedRows[0]?.selected_count, 0);
    const lowerCount = toSafeNumber(selectedRows[0]?.lower_count, 0);
    const higherCount = toSafeNumber(selectedRows[0]?.higher_count, 0);
    return {
        total_cars: totalCars,
        min_value: minValue,
        max_value: maxValue,
        selected: {
            min: normalizedSelectedMin,
            max: normalizedSelectedMax,
            count: selectedCount,
            lower_count: lowerCount,
            higher_count: higherCount
        }
    };
};
