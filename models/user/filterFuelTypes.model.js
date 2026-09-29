import db from '../../config/db.js';

export const getFuelTypesByIdsModel = async (fuelTypeIds = [], lang = "en") => {
    if (!fuelTypeIds || fuelTypeIds.length === 0) return [];

    const ids = Array.isArray(fuelTypeIds) ? fuelTypeIds : [fuelTypeIds];

    const rows = await db.query(
        `
    SELECT 
      ft.id,
      ft.code,
      ftt.label
    FROM tbl_fuel_types ft
    JOIN tbl_fuel_type_translations ftt
      ON ftt.fuel_type_id = ft.id
     AND ftt.lang = ?
    WHERE ft.id IN (${ids.map(() => "?").join(",")})
      AND ft.is_active = 1
    `,
        [lang, ...ids]
    );

    return rows;
};
