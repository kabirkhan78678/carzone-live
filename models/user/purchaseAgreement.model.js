import db from '../../config/db.js';

/**
 * Creates a new purchase agreement with an immutable snapshot.
 * @param {Object} data - Agreement data payload
 * @returns {Promise<Object>} Insert result containing insertId
 */
export const createPurchaseAgreement = async (data) => {
    return db.query('INSERT INTO purchase_agreements SET ?', [data]);
};

/**
 * Alias for backward compatibility / controller convenience.
 */
export const insertPurchaseAgreement = createPurchaseAgreement;
export const addPurchaseAgreementModel = createPurchaseAgreement;

/**
 * Retrieves a single purchase agreement by ID.
 * Returns only non-deleted snapshot data directly from purchase_agreements.
 * @param {number|string} id - Purchase agreement ID
 * @returns {Promise<Object|null>} Agreement record or null
 */
export const getPurchaseAgreementById = async (id) => {
    const result = await db.query(
        `
        SELECT *
        FROM purchase_agreements
        WHERE id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [id]
    );

    return result[0] || null;
};

/**
 * Alias for retrieving agreement details by ID.
 */
export const getPurchaseAgreementDetailsById = getPurchaseAgreementById;
export const getExistingPurchaseAgreement = getPurchaseAgreementById;

/**
 * Retrieves all non-deleted purchase agreements created by a specific seller/dealer.
 * Ordered newest first.
 * @param {number|string} sellerUserId - Seller user ID (tbl_users.id)
 * @param {Object} [options] - Optional pagination parameters ({ limit, offset })
 * @returns {Promise<Array>} List of agreement records
 */
export const getPurchaseAgreementsBySeller = async (sellerUserId, options = {}) => {
    let query = `
        SELECT *
        FROM purchase_agreements
        WHERE seller_user_id = ?
          AND deleted_at IS NULL
        ORDER BY created_at DESC
    `;
    const params = [sellerUserId];

    if (options.limit !== undefined && options.limit !== null) {
        const limit = Number(options.limit);
        const offset = Number(options.offset) || 0;
        if (Number.isFinite(limit) && limit > 0) {
            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);
        }
    }

    return db.query(query, params);
};

/**
 * Alias for retrieving agreements by seller/dealer user ID.
 */
export const getPurchaseAgreementsByUserId = getPurchaseAgreementsBySeller;
export const getPurchaseAgreementModel = getPurchaseAgreementsBySeller;
export const getPurchaseAgreementList = getPurchaseAgreementsBySeller;

/**
 * Updates a purchase agreement record.
 * @param {number|string} agreementId - Agreement ID
 * @param {Object} data - Key-value pairs to update
 * @returns {Promise<Object>} Update result
 */
export const updatePurchaseAgreement = async (agreementId, data) => {
    if (!data || Object.keys(data).length === 0) {
        throw new Error('No data provided to update purchase agreement');
    }

    return db.query(
        `
        UPDATE purchase_agreements
        SET ?
        WHERE id = ?
          AND deleted_at IS NULL
        `,
        [data, agreementId]
    );
};

/**
 * Soft deletes a purchase agreement.
 * Only allows deletion if the agreement belongs to the authenticated seller.
 * @param {number|string} id - Agreement ID
 * @param {number|string} sellerUserId - Seller user ID
 * @returns {Promise<Object>} Update result
 */
export const deletePurchaseAgreement = async (id, sellerUserId) => {
    return db.query(
        `
        UPDATE purchase_agreements
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND seller_user_id = ?
          AND deleted_at IS NULL
        `,
        [id, sellerUserId]
    );
};
