import db from '../../config/db.js';

export const getVehicleConditionsModel = async (lang) => {

    const rows = await db.query(
        `
        SELECT 
            vc.id,
            vct.name
        FROM tbl_vehicle_conditions vc
        JOIN tbl_vehicle_condition_translations vct
            ON vct.condition_id = vc.id
        WHERE vct.language_code = ?
        AND vc.is_active = 1
        ORDER BY vct.name ASC
        `,
        [lang]
    );

    return rows;
};


// Warranty Types

export const getWarrantyTypesModel = async (lang) => {

    const rows = await db.query(
        `
        SELECT 
            wt.id,
            wtt.name
        FROM tbl_warranty_types wt
        JOIN tbl_warranty_type_translations wtt
            ON wtt.warranty_type_id = wt.id
        WHERE wtt.language_code = ?
        AND wt.is_active = 1
        AND wt.warranty_key <> 'fresh_from_service'
        ORDER BY wtt.name ASC
        `,
        [lang]
    );

    return rows;
};
// colors

export const getColorsModel = async (lang) => {

    const rows = await db.query(
        `
        SELECT 
            c.id,
            ct.name,
            c.hex_code
        FROM tbl_colors c
        JOIN tbl_color_translations ct
            ON ct.color_id = c.id
        WHERE ct.language_code = ?
        AND c.is_active = 1
        ORDER BY ct.name ASC
        `,
        [lang]
    );

    return rows;
};
// contact details insertion

export const getWarrantyQualityModel = async (lang = "en") => {
    const rows = await db.query(
        `
        SELECT
            wq.id,
            wq.code,
            wqt.label
        FROM warranty_qualities wq
        JOIN warranty_qualities_translations wqt
            ON wq.id = wqt.warranty_quality_id
        WHERE wqt.language_code = ?
          AND wq.is_active = 1
        ORDER BY wqt.label ASC
        `,
        [lang]
    );

    return rows;
};

// energy efficiency drop down
