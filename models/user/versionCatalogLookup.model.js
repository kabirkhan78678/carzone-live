import db from '../../config/db.js';

export const getVehicleCatalogByVinModel = async ({
    vin_number,
    manufacture_month,
    manufacture_year,
    lang = "en"
}) => {
    const dateFilter = getVehicleCatalogLookupDateFilter(manufacture_year, manufacture_month);
    const query = `
        ${vehicleCatalogLookupSelect}
        WHERE LOWER(TRIM(vd.vin_number)) = LOWER(TRIM(?))
        ${dateFilter.clause}
        LIMIT 1
    `;

    return db.query(query, [
        lang,
        lang,
        lang,
        lang,
        vin_number,
        ...dateFilter.params
    ]);
};

export const getVehicleCatalogByTypeApprovalModel = async ({
    type_approval,
    manufacture_month,
    manufacture_year,
    lang = "en"
}) => {
    const dateFilter = getVehicleCatalogLookupDateFilter(manufacture_year, manufacture_month);
    const query = `
        ${vehicleCatalogLookupSelect}
        WHERE JSON_SEARCH(
            CASE
                WHEN JSON_VALID(vd.type_approval_numbers) THEN vd.type_approval_numbers
                ELSE JSON_ARRAY()
            END,
            'one',
            ?
        ) IS NOT NULL
        ${dateFilter.clause}
        ORDER BY v.production_from DESC
        LIMIT 20
    `;

    return db.query(query, [
        lang,
        lang,
        lang,
        lang,
        type_approval,
        ...dateFilter.params
    ]);
};


// ----------------------tmp --------------------

export const getVehicleCatalogLookupDateFilter = (manufactureYear, manufactureMonth) => {
    if (!manufactureYear || !manufactureMonth) {
        return { clause: "", params: [] };
    }

    const month = String(manufactureMonth).padStart(2, "0");
    const manufactureDate = Number(`${manufactureYear}${month}`);

    if (!Number.isFinite(manufactureDate)) {
        return { clause: "", params: [] };
    }

    return {
        clause: `
            AND CAST(v.production_from AS UNSIGNED) <= ?
            AND (
                v.production_to IS NULL
                OR v.production_to = ''
                OR v.production_to = '000000'
                OR CAST(v.production_to AS UNSIGNED) >= ?
            )
        `,
        params: [manufactureDate, manufactureDate]
    };
};

const vehicleCatalogLookupSelect = `
    SELECT
        v.id,
        v.model_id,
        v.fzkey,
        v.version_name,
        v.production_from,
        v.production_to,
        vd.raw_payload,
        vd.raw_payload_stringify_eng,
        vd.vin_number,
        vd.type_approval_numbers,
        m.model_name,
        m.vehicle_type,
        b.brand_name,

        ft.id AS local_fuel_id,
        ft.code AS local_fuel_code,
        ftt.label AS fuel_translation,

        tr.id AS local_transmission_id,
        tr.code AS local_transmission_code,
        tt.label AS transmission_translation,

        bt.id AS local_body_id,
        bt.code AS local_body_code,
        bt.image AS body_image,
        btt.label AS body_translation,

        dr.id AS local_drive_id,
        dr.code AS local_drive_code,
        dtt.label AS drive_translation
    FROM tbl_vehicle_catalog_version_details vd
    JOIN tbl_vehicle_catalog_versions v
        ON v.fzkey = vd.fzkey
    LEFT JOIN tbl_vehicle_catalog_models m
        ON m.id = v.model_id
    LEFT JOIN tbl_vehicle_catalog_brands b
        ON b.id = m.brand_id
    LEFT JOIN tbl_fuel_types ft
        ON LOWER(ft.code) = (
            CASE
                WHEN LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].fuel')), '')
                    )
                ) LIKE '%diesel%' THEN 'diesel'
                WHEN LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].fuel')), '')
                    )
                ) LIKE '%petrol%' THEN 'petrol'
                ELSE LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].fuel')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].fuel')), '')
                    )
                )
            END
        )
    LEFT JOIN tbl_fuel_type_translations ftt
        ON ftt.fuel_type_id = ft.id
        AND ftt.lang = ?
    LEFT JOIN tbl_transmissions tr
        ON LOWER(tr.code) = (
            CASE
                WHEN LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].transmission')), '')
                    )
                ) LIKE '%semi%' THEN 'semi-automatic'
                WHEN LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].transmission')), '')
                    )
                ) LIKE '%manual%' THEN 'manual'
                WHEN LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].transmission')), '')
                    )
                ) LIKE '%auto%' THEN 'automatic'
                ELSE LOWER(
                    COALESCE(
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.data[0].transmission')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].gearbox')), ''),
                        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$[0].transmission')), '')
                    )
                )
            END
        )
    LEFT JOIN tbl_transmission_translations tt
        ON tt.transmission_id = tr.id
        AND tt.language_code = ?
    LEFT JOIN tbl_body_types bt
        ON LOWER(bt.code) = LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.body')))
    LEFT JOIN tbl_body_type_translations btt
        ON btt.body_type_id = bt.id
        AND btt.language_code = ?
    LEFT JOIN tbl_drives dr
        ON LOWER(dr.code) = LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.drive')))
    LEFT JOIN tbl_drive_translations dtt
        ON dtt.drive_id = dr.id
        AND dtt.language_code = ?
`;
