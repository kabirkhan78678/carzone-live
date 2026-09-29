import db from '../../config/db.js';

export const createQualitySealModel = async ({
    name,
    image,
    description
}) => {
    return db.query(
        `
        INSERT INTO tbl_quality_seals
        (
            name,
            image,
            description
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
        `,
        [
            name,
            image,
            description
        ]
    );
};

export const getQualitySealByIdModel = async (id) => {
    const result = await db.query(
        `
        SELECT *
        FROM tbl_quality_seals
        WHERE id = ?
        AND is_delete = 0
        `,
        [id]
    );
    return result[0];
};

export const fetchQualitySealById = async (id) => {
    return db.query(
        `
        SELECT *
        FROM tbl_quality_seals
        WHERE id = ?
        AND is_delete = 0
        `,
        [id]
    );
};

export const updateQualitySealModel = async ({
    id,
    name,
    image,
    description,
    status
}) => {
    return db.query(
        `
        UPDATE tbl_quality_seals
        SET
            name = COALESCE(?, name),
            image = COALESCE(?, image),
            description = COALESCE(?, description),
            status = COALESCE(?, status)
        WHERE id = ?
        `,
        [
            name,
            image,
            description,
            status,
            id
        ]
    );
};

export const deleteQualitySealModel = async (id) => {
    return db.query(
        `
        UPDATE tbl_quality_seals
        SET is_delete = 1
        WHERE id = ?
        `,
        [id]
    );
};

export const getQualitySealListModel = async ({
    page = 1,
    limit = 20,
    search = "",
    status = ""
}) => {
    const offset = (page - 1) * limit;

    let whereClause = `WHERE is_delete = 0`;
    const params = [];

    if (search && search.trim() !== "") {
        whereClause += ` AND name LIKE ?`;
        params.push(`%${search.trim()}%`);
    }

    if (status !== "" && status !== null && status !== undefined) {
        whereClause += ` AND status = ?`;
        params.push(Number(status));
    }

    const countQuery = `
        SELECT COUNT(*) as total
        FROM tbl_quality_seals
        ${whereClause}
    `;

    const totalResult = await db.query(countQuery, params);
    const total = totalResult[0]?.total || 0;

    const dataQuery = `
        SELECT
            id,
            name,
            image,
            description,
            status,
            created_at,
            updated_at
        FROM tbl_quality_seals
        ${whereClause}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;

    const data = await db.query(dataQuery, [...params, limit, offset]);

    return {
        total,
        data
    };
};
