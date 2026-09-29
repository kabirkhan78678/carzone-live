import db from '../../config/db.js';

export const getVersionsListModel = async (

    model_id,

    lang = "en"

) => {

    const query = `

        SELECT
 
            v.id,

            v.model_id,

            v.fzkey,

            v.version_name,

            v.production_from,

            v.production_to,
 
            vd.raw_payload,

            vd.raw_payload_stringify_eng,
 
            m.model_name,

            m.vehicle_type,
 
            b.brand_name,
 
            -- ====================================

            -- FUEL

            -- ====================================
 
            ft.id AS local_fuel_id,

            ft.code AS local_fuel_code,
 
            ftt.label AS fuel_translation,
 
            -- ====================================

            -- TRANSMISSION

            -- ====================================
 
            tr.id AS local_transmission_id,

            tr.code AS local_transmission_code,
 
            tt.label AS transmission_translation,
 
            -- ====================================

            -- BODY

            -- ====================================
 
            bt.id AS local_body_id,

            bt.code AS local_body_code,

            bt.image AS body_image,
 
            btt.label AS body_translation,
 
            -- ====================================

            -- DRIVE

            -- ====================================
 
            dr.id AS local_drive_id,

            dr.code AS local_drive_code,
 
            dtt.label AS drive_translation
 
        FROM tbl_vehicle_catalog_versions v
 
        LEFT JOIN tbl_vehicle_catalog_version_details vd

            ON vd.version_id = v.id
 
        LEFT JOIN tbl_vehicle_catalog_models m

            ON m.id = v.model_id
 
        LEFT JOIN tbl_vehicle_catalog_brands b

            ON b.id = m.brand_id
 
        -- ====================================

        -- FUEL JOIN

        -- ====================================
 
        LEFT JOIN tbl_fuel_types ft
            ON LOWER(ft.code) = (
                CASE
                    WHEN LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel'))) LIKE '%diesel%' THEN 'diesel'
                    WHEN LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel'))) LIKE '%petrol%' THEN 'petrol'
                    ELSE LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.fuel')))
                END
            )
 
        LEFT JOIN tbl_fuel_type_translations ftt

            ON ftt.fuel_type_id = ft.id

            AND ftt.lang = ?
 
        -- ====================================

        -- TRANSMISSION JOIN

        -- ====================================
 
        LEFT JOIN tbl_transmissions tr
            ON LOWER(tr.code) = (
                CASE
                    WHEN LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox'))) LIKE '%semi%' THEN 'semi-automatic'
                    WHEN LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox'))) LIKE '%manual%' THEN 'manual'
                    WHEN LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox'))) LIKE '%auto%' THEN 'automatic'
                    ELSE LOWER(JSON_UNQUOTE(JSON_EXTRACT(vd.raw_payload_stringify_eng, '$.gearbox')))
                END
            )
 
        LEFT JOIN tbl_transmission_translations tt

            ON tt.transmission_id = tr.id

            AND tt.language_code = ?
 
        -- ====================================

        -- BODY JOIN

        -- ====================================
 
        LEFT JOIN tbl_body_types bt

            ON LOWER(bt.code) = LOWER(

                JSON_UNQUOTE(

                    JSON_EXTRACT(

                        vd.raw_payload_stringify_eng,

                        '$.body'

                    )

                )

            )
 
        LEFT JOIN tbl_body_type_translations btt

            ON btt.body_type_id = bt.id

            AND btt.language_code = ?
 
        -- ====================================

        -- DRIVE JOIN

        -- ====================================
 
        LEFT JOIN tbl_drives dr

            ON LOWER(dr.code) = LOWER(

                JSON_UNQUOTE(

                    JSON_EXTRACT(

                        vd.raw_payload_stringify_eng,

                        '$.drive'

                    )

                )

            )
 
        LEFT JOIN tbl_drive_translations dtt

            ON dtt.drive_id = dr.id

            AND dtt.language_code = ?
 
        WHERE v.model_id = ?
 
        ORDER BY v.version_name ASC

    `;

    return db.query(query, [

        lang,

        lang,

        lang,

        lang,

        model_id

    ]);

};
