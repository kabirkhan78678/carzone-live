import db from '../../config/db.js';

export const getEnergyEfficiencyModel = async (selectedCodes = []) => {
    const allowed = ["A", "B", "C", "D", "E", "F", "G"];
    const normalizedSelected = selectedCodes
        .map((c) => String(c).trim().toUpperCase())
        .filter((c) => allowed.includes(c));

    const rows = await db.query(`
        SELECT
            codes.code,
            COUNT(c.id) AS car_count
        FROM (
            SELECT 'A' AS code UNION ALL
            SELECT 'B' UNION ALL
            SELECT 'C' UNION ALL
            SELECT 'D' UNION ALL
            SELECT 'E' UNION ALL 
            SELECT 'F' UNION ALL
            SELECT 'G'
        ) codes
        LEFT JOIN tbl_cars c
            ON UPPER(TRIM(c.energy_efficiency)) = codes.code
           AND c.is_active = 1
           AND c.is_deleted = 0
        GROUP BY codes.code
        ORDER BY codes.code ASC
    `);

    let totalQuery = `
        SELECT COUNT(*) AS total
        FROM tbl_cars
        WHERE is_active = 1
          AND is_deleted = 0
    `;
    const params = [];

    if (normalizedSelected.length > 0) {
        totalQuery += ` AND UPPER(TRIM(energy_efficiency)) IN (${normalizedSelected.map(() => "?").join(",")})`;
        params.push(...normalizedSelected);
    }

    const totalResult = await db.query(totalQuery, params);
    const totalCars = totalResult[0]?.total || 0;

    return { rows, totalCars };
};

export const getAccidentVehicleFilterModel = async (
    lang,
    accidentStatusIds = []
) => {

    // 1️⃣ Accident status list with per-status car count
    const rows = await db.query(
        `
    SELECT
        vas.id,
        vas.code,
        vast.label,
        COUNT(c.id) AS car_count
    FROM tbl_vehicle_accident_status vas
    JOIN tbl_vehicle_accident_status_translations vast
      ON vast.accident_status_id = vas.id
     AND vast.language_code = ?
    LEFT JOIN tbl_cars c
      ON (c.vehicle_accident_status_id = vas.id OR (c.vehicle_accident_status_id IS NULL AND ((vas.id = 1 AND c.is_accident_vehicle = 1) OR (vas.id = 2 AND (c.is_accident_vehicle = 0 OR c.is_accident_vehicle IS NULL)))))
     AND c.is_active = 1
     AND c.is_deleted = 0
    WHERE vas.is_active = 1
    GROUP BY vas.id, vas.code, vast.label
    ORDER BY vas.id ASC
    `,
        [lang]
    );

    // 2️⃣ Total cars ONLY if filter selected
    let totalCars = 0;

    if (accidentStatusIds.length > 0) {
        const placeholders = accidentStatusIds.map(() => "?").join(",");

        const totalCarsResult = await db.query(
            `
      SELECT COUNT(*) AS total
      FROM tbl_cars
      WHERE is_active = 1
        AND is_deleted = 0
        AND vehicle_accident_status_id IN (${placeholders})
      `,
            accidentStatusIds
        );

        totalCars = totalCarsResult[0].total;
    }

    return { rows, totalCars };
};

export const getMfkWarrantyFilterModel = async (
    lang,
    mfkWarrantyIds = []
) => {

    // 1️⃣ Warranty list with per-type count
    const rows = await db.query(
        `
    SELECT
        vmw.id,
        vmw.code,
        vmwt.label,
        COUNT(c.id) AS car_count
    FROM tbl_vehicle_mfk_warranty vmw
    JOIN tbl_vehicle_mfk_warranty_translations vmwt
      ON vmwt.mfk_warranty_id = vmw.id
     AND vmwt.language_code = ?
    LEFT JOIN tbl_cars c
      ON c.mfk_warrenty_id = vmw.id
     AND c.is_active = 1
     AND c.is_deleted = 0
    WHERE vmw.is_active = 1
    GROUP BY vmw.id, vmw.code, vmwt.label
    ORDER BY vmw.id ASC
    `,
        [lang]
    );

    // 2️⃣ Total cars ONLY when filter selected
    let totalCars = 0;

    if (mfkWarrantyIds.length > 0) {
        const placeholders = mfkWarrantyIds.map(() => "?").join(",");

        const totalCarsResult = await db.query(
            `
      SELECT COUNT(*) AS total
      FROM tbl_cars
      WHERE is_active = 1
        AND is_deleted = 0
        AND mfk_warrenty_id IN (${placeholders})
      `,
            mfkWarrantyIds
        );

        totalCars = totalCarsResult[0].total;
    }

    return { rows, totalCars };
};
