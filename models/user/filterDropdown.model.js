import db from '../../config/db.js';

export const getFuelTypesModel = async (lang, selectedIds = []) => {

    const ids = selectedIds.map(Number).filter(Boolean);

    const rows = await db.query(
        `
        SELECT
            c.code AS category,
            fi.id,
            fi.code,
            fit.label,
            COUNT(
                CASE
                    WHEN ${ids.length ? `car.fuel_type_id IN (${ids.join(",")})` : "car.id IS NOT NULL"}
                    THEN car.id
                END
            ) AS car_count
        FROM tbl_fuel_categories c
        JOIN tbl_fuel_types fi ON fi.category_id = c.id
        JOIN tbl_fuel_type_translations fit
            ON fit.fuel_type_id = fi.id AND fit.lang = ?
        LEFT JOIN tbl_cars car
            ON car.fuel_type_id = fi.id
           AND car.is_active = 1
           AND car.is_deleted = 0
           AND car.listing_status = 'published'
        WHERE fi.is_active = 1
        GROUP BY fi.id
        `,
        [lang]
    );

    // 2️⃣ Total cars (FILTER AWARE)
    let totalCarsQuery = `
    SELECT COUNT(*) AS total
    FROM tbl_cars
    WHERE is_deleted = 0
      AND is_active = 1
      AND listing_status = 'published'
`;

    const params = [];

    if (ids.length > 0) {
        totalCarsQuery += ` AND fuel_type_id IN (${ids.map(() => "?").join(",")})`;
        params.push(...ids);
    }

    const totalCarsResult = await db.query(totalCarsQuery, params);
    const totalCars = totalCarsResult[0]?.total || 0;

    return { rows, totalCars };
};

export const getTransmissionTypesModel = async (lang, transmissionIds = []) => {

    // 1️⃣ Transmission-wise count
    const rows = await db.query(
        `
    SELECT
        t.id,
        t.code,
        tt.label,
        COUNT(c.id) AS car_count
    FROM tbl_transmissions t
    JOIN tbl_transmission_translations tt
      ON tt.transmission_id = t.id
      AND tt.language_code = ?
    LEFT JOIN tbl_cars c
      ON c.transmission_id = t.id
      AND c.is_deleted = 0
      AND c.is_active = 1
      AND c.listing_status = 'published'
    WHERE t.is_active = 1
    GROUP BY t.id, t.code, tt.label
    ORDER BY t.id ASC
    `,
        [lang]
    );

    // 2️⃣ Total cars (FILTER AWARE)
    let totalCarsQuery = `
    SELECT COUNT(*) AS total
    FROM tbl_cars
    WHERE is_deleted = 0
      AND is_active = 1
      AND listing_status = 'published'
  `;

    const params = [];

    if (transmissionIds.length > 0) {
        totalCarsQuery += ` AND transmission_id IN (${transmissionIds.map(() => "?").join(",")})`;
        params.push(...transmissionIds);
    }

    const totalCarsResult = await db.query(totalCarsQuery, params);
    const totalCars = totalCarsResult[0].total;

    return { rows, totalCars };
};

export const getDriveTypesModel = async (lang, driveIds = []) => {

    // 1️⃣ Drive types with per-drive car count
    const rows = await db.query(
        `
    SELECT
        d.id,
        d.code,
        dt.label,
        COUNT(c.id) AS car_count
    FROM tbl_drives d
    JOIN tbl_drive_translations dt
      ON dt.drive_id = d.id
     AND dt.language_code = ?
    LEFT JOIN tbl_cars c
      ON c.drive_type_id = d.id
     AND c.is_active = 1
     AND c.is_deleted = 0
     AND c.listing_status = 'published'
    WHERE d.is_active = 1
    GROUP BY d.id, d.code, dt.label
    ORDER BY d.id ASC
    `,
        [lang]
    );

    // 2️⃣ Total cars (only if selected)
    let totalCars = 0;

    if (driveIds.length > 0) {
        const placeholders = driveIds.map(() => "?").join(",");

        const totalCarsResult = await db.query(
            `
      SELECT COUNT(*) AS total
      FROM tbl_cars
      WHERE is_active = 1
        AND is_deleted = 0
        AND listing_status = 'published'
        AND drive_type_id IN (${placeholders})
      `,
            driveIds
        );

        totalCars = totalCarsResult[0].total;
    }

    return { rows, totalCars };
};

export const getBodyTypesModel = async (lang, bodyTypeIds = []) => {
    // Body types with car count
    const rows = await db.query(
        `
    SELECT
        bt.id,
        bt.code,
        bt.image,
        btt.label,
        COUNT(c.id) AS car_count
    FROM tbl_body_types bt
    JOIN tbl_body_type_translations btt
      ON btt.body_type_id = bt.id
     AND btt.language_code = ?
    LEFT JOIN tbl_cars c
      ON c.body_type_id = bt.id
     AND c.is_active = 1
     AND c.is_deleted = 0
     AND c.listing_status = 'published'
    WHERE bt.is_active = 1
    GROUP BY bt.id, bt.code, bt.image, btt.label
    ORDER BY bt.id ASC
    `,
        [lang]
    );

    // Total cars (FILTER AWARE)
    let totalCarsQuery = `
    SELECT COUNT(*) AS total
    FROM tbl_cars
    WHERE is_active = 1
      AND is_deleted = 0
      AND listing_status = 'published'
    `;

    const params = [];

    if (bodyTypeIds.length > 0) {
        totalCarsQuery += ` AND body_type_id IN (${bodyTypeIds.map(() => "?").join(",")})`;
        params.push(...bodyTypeIds);
    }

    const totalCarsResult = await db.query(totalCarsQuery, params);

    return {
        rows,
        totalCars: totalCarsResult[0].total
    };
};

export const getVehicleStatesModel = async (lang, stateIds = []) => {

    // 1️⃣ Vehicle states with per-state car count
    const rows = await db.query(
        `
    SELECT
        vs.id,
        vs.code,
        vst.label,
        COUNT(c.id) AS car_count
    FROM tbl_vehicle_states vs
    JOIN tbl_vehicle_state_translations vst
      ON vst.vehicle_state_id = vs.id
     AND vst.language_code = ?
    LEFT JOIN tbl_cars c
      ON c.state_id = vs.id
     AND c.is_active = 1
     AND c.is_deleted = 0
    WHERE vs.is_active = 1
    GROUP BY vs.id, vs.code, vst.label
    ORDER BY vs.id ASC
    `,
        [lang]
    );

    // 2️⃣ Total cars ONLY if selected
    let totalCars = 0;

    if (stateIds.length > 0) {
        const placeholders = stateIds.map(() => "?").join(",");

        const totalCarsResult = await db.query(
            `
      SELECT COUNT(*) AS total
      FROM tbl_cars
      WHERE is_active = 1
        AND is_deleted = 0
        AND state_id IN (${placeholders})
      `,
            stateIds
        );

        totalCars = totalCarsResult[0].total;
    }

    return { rows, totalCars };
};

export const getSeatRangeCountModel = async (min, max) => {
    if (min === null || max === null) {
        return 0;
    }

    const result = await db.query(
        `
    SELECT COUNT(*) AS total
    FROM tbl_cars
    WHERE is_active = 1
      AND is_deleted = 0
      AND sittingCapacity BETWEEN ? AND ?
    `,
        [min, max]
    );

    return result[0].total;
};

export const getDoorRangeCountModel = async (min, max) => {
    if (min === null || max === null) {
        return 0;
    }

    const result = await db.query(
        `
    SELECT COUNT(*) AS total
    FROM tbl_cars
    WHERE is_active = 1
      AND is_deleted = 0
      AND doors BETWEEN ? AND ?
    `,
        [min, max]
    );

    return result[0].total;
};

///////////////////////////////////////////////////////

// Count cars based on optional power output range
