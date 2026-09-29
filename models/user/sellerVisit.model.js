import db from '../../config/db.js';
import { physicalVisitSelectClause, physicalVisitFromClause } from './visitCreate.model.js';
import { appendPhysicalVisitFilters } from './buyerVisit.model.js';

export const getPhysicalVisitsBySellerModel = async (
    seller_id,
    options = {}
) => {
    const { status = null, search = null, limit = null, offset = 0 } = options;
    const params = [];

    let query = appendPhysicalVisitFilters({
        query: `${physicalVisitSelectClause} ${physicalVisitFromClause}`,
        params,
        ownerId: seller_id,
        status,
        search
    });

    query += ` ORDER BY pv.created_at DESC`;

    if (limit !== null && limit !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset) || 0);
    }

    return db.query(query, params);
};

export const updatePhysicalVisitActionModel = async (
    visit_id,
    seller_id,
    status,
    updateData
) => {
    const {
        rescheduled_date,
        rescheduled_time
    } = updateData;

    const query = `
    UPDATE tbl_physical_visits
    SET 
      status = ?,buyer_side_status =?,
      rescheduled_date = ?,
      rescheduled_time = ?
    WHERE id = ? AND seller_id = ?
  `;

    const params = [
        status,
        status,
        rescheduled_date,
        rescheduled_time,
        visit_id,
        seller_id
    ];

    return db.query(query, params);
};

export const getPhysicalVisitForNotificationModel = async ({
    carId,
    senderId,
    receiverId
}) => {

    const params = [
        carId,
        senderId,
        receiverId,
        receiverId,
        senderId
    ];

    const query = `
        ${physicalVisitSelectClause}
        ${physicalVisitFromClause}

        WHERE pv.car_id = ?
          AND (
                (
                    pv.user_id = ?
                    AND pv.seller_id = ?
                )
                OR
                (
                    pv.seller_id = ?
                    AND pv.user_id = ?
                )
              )

        ORDER BY pv.id DESC
        LIMIT 1
    `;

    const result = await db.query(
        query,
        params
    );

    return result[0] || null;
};

export const getSellerPhysicalVisitsCountModel = async (seller_id, options = {}) => {
    const { status = null, search = null } = options;
    const params = [];
    const query = appendPhysicalVisitFilters({
        query: `SELECT COUNT(*) AS total ${physicalVisitFromClause}`,
        params,
        ownerId: seller_id,
        status,
        search
    });
    return db.query(query, params);
};

export const getSellerPhysicalVisitsModel = async (seller_id, status, search = null, limit = null, offset = 0) => {
    return getPhysicalVisitsBySellerModel(seller_id, {
        status,
        search,
        limit,
        offset
    });
};

export const getSellerPhysicalVisitByIdModel = async (seller_id, visit_id) => {
    const params = [];
    const query = appendPhysicalVisitFilters({
        query: `${physicalVisitSelectClause} ${physicalVisitFromClause}`,
        params,
        ownerId: seller_id,
        visitId: visit_id
    });
    return db.query(query, params);
};
