import db from '../../config/db.js';

export const filterCars = async ({ user_id, search }) => {
    let baseQuery = `
        SELECT * FROM tbl_cars
        WHERE is_deleted = 0 AND user_id != ?
    `;
    const params = [user_id];

    if (search && search.trim() !== "") {
        const keywords = search.trim().split(/\s+/); // split by space

        const searchConditions = keywords
            .map(() => `(carModel LIKE ? OR brandName LIKE ?)`)
            .join(" AND ");

        baseQuery += ` AND (${searchConditions})`;

        keywords.forEach(term => {
            const likeTerm = `%${term}%`;
            params.push(likeTerm, likeTerm);
        });
    }

    console.log("FINAL QUERY:", baseQuery);
    console.log("PARAMS:", params);

    let cars = await db.query(baseQuery, params);
    return cars;
};

export const searchCarAccordingToModelAndModel = async ({ brandNames = [], carModels = [] }) => {
    let where = [];
    let params = [];

    if (Array.isArray(brandNames) && brandNames.length > 0) {
        where.push(`brandName IN (${brandNames.map(() => '?').join(',')})`);
        params.push(...brandNames);
    }

    if (Array.isArray(carModels) && carModels.length > 0) {
        where.push(`carModel IN (${carModels.map(() => '?').join(',')})`);
        params.push(...carModels);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `SELECT * FROM tbl_cars ${whereClause} ORDER BY id DESC`;
    const rows = await db.query(sql, params);
    return rows;
};
