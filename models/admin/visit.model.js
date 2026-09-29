import { appendPhysicalVisitFilters, physicalVisitSelectClause, physicalVisitFromClause } from '../user.model.js';
import db from '../../config/db.js';

export const getAllPhysicalVisitsModel = async (options = {}) => {
    const {
        status = null,
        search = null,
        limit = null,
        offset = 0
    } = options;

    const params = [];

    let query = appendPhysicalVisitFilters({
        query: `${physicalVisitSelectClause} ${physicalVisitFromClause}`,
        params,
        status,
        search
    });

    query += ` ORDER BY pv.id DESC`;

    if (limit !== null && limit !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
    }

    return db.query(query, params);
};

export const getAllPhysicalVisitsCountModel = async (options = {}) => {
    const {
        status = null,
        search = null
    } = options;

    const params = [];

    let query = appendPhysicalVisitFilters({
        query: `SELECT COUNT(*) AS total ${physicalVisitFromClause}`,
        params,
        status,
        search
    });

    const rows = await db.query(query, params);
    return rows?.[0]?.total || 0;
};

export const getPhysicalVisitByIdModel = async (visitId) => {
    const params = [];

    let query = appendPhysicalVisitFilters({
        query: `${physicalVisitSelectClause} ${physicalVisitFromClause}`,
        params,
        visitId
    });

    query += ` LIMIT 1`;

    return db.query(query, params);
};
