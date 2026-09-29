import db from '../../config/db.js';

export const updateVersionDetailsPayload = async (
    id,
    payload
) => {

    const query = `
        UPDATE tbl_vehicle_catalog_version_details
        SET raw_payload_stringify_eng = ?
        WHERE id = ?
    `;

    await db.query(query, [payload, id]);
};






// by kRn 

// ======================================================
// GET ALL MAKES
// ======================================================





//         whereClause = `
//             WHERE LOWER(b.brand_name)
//             LIKE ?
//         `;

//         params.push(`%${search.toLowerCase()}%`);
//     }


//         SELECT * FROM tbl_vehicle_catalog_brands ORDER BY brand_name ASC
//     `;
// };


// by kashish

export const getVersionEquipmentDetailsModel = async (fzkey) => {

    const query = `
        SELECT
            version_id,
            fzkey,
            equipment_payload
 
        FROM tbl_vehicle_catalog_version_details
 
        WHERE fzkey = ?
 
        LIMIT 1
    `;

    return db.query(query, [fzkey]);

};

export const getVersionDetailsRows = async () => {
    const query = `
        SELECT id, fzkey
        FROM tbl_vehicle_catalog_version_details
        WHERE CAST(fzkey AS UNSIGNED) BETWEEN 100102 AND 100126
        ORDER BY CAST(fzkey AS UNSIGNED) ASC
        LIMIT 100
    `;

    const rows = await db.query(query);
    return rows;
};
