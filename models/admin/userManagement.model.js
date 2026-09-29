import db from '../../config/db.js';

export const getAllSellers = async (search = '') => {
  const likeSearch = `%${search}%`;
  return db.query(
    `
    SELECT u.*, r.seller_type 
    FROM tbl_users u 
    JOIN tbl_roles r ON u.id = r.user_id 
    WHERE r.role = 'seller'
      AND (
        u.fullName LIKE ? OR
        u.email LIKE ? OR
        u.phoneNumber LIKE ?
      ) ORDER BY u.id DESC
    `,
    [likeSearch, likeSearch, likeSearch]
  );
};

export const getAllPrivateUsers = async (search = '') => {
  const likeSearch = `%${search}%`;
  return db.query(
    `
    SELECT *
    FROM tbl_users u
    WHERE u.account_type = 'private'
    AND (
        u.fullName LIKE ? OR
        u.email LIKE ? OR
        u.phoneNumber LIKE ?
      ) ORDER BY u.id DESC
    `,
    [likeSearch, likeSearch, likeSearch]
  );
};

export const getAllCompanyUsers = async (search = '', is_activated) => {
  const likeSearch = `%${search}%`;
  const params = [likeSearch, likeSearch, likeSearch];
 
  let activatedClause = '';
  if (is_activated !== undefined && is_activated !== '') {
    activatedClause = `AND u.is_activated = ?`;
    params.push(Number(is_activated));
  }
 
  return db.query(
    `
    SELECT *
    FROM tbl_users u
    WHERE u.account_type = 'company'
    AND (
        u.fullName LIKE ? OR
        u.email LIKE ? OR
        u.phoneNumber LIKE ?
    )
    ${activatedClause}
    ORDER BY u.id DESC
    `,
    params
  );
};

export const getAllBuyers = async (search = '') => {
  const likeSearch = `%${search}%`;

  return db.query(
    `
    SELECT u.*, r.role
    FROM tbl_users u
    JOIN tbl_roles r ON u.id = r.user_id
    WHERE r.role = 'buyer'
      AND (
        u.fullName LIKE ? OR
        u.email LIKE ? OR
        u.phoneNumber LIKE ?
      ) ORDER BY u.id DESC
    `,
    [likeSearch, likeSearch, likeSearch]
  );
};

export const getUserById = async (id) => {
  return db.query(
    `SELECT * FROM tbl_users u
      WHERE u.id = ?
    `,
    [id]
  );
};

export const getBuyerById = async (id, role = 'buyer') => {
  return db.query(
    `SELECT u.*, r.role FROM tbl_users u LEFT JOIN tbl_roles r ON u.id = r.user_id WHERE u.id = ? LIMIT 1`,
    [id]
  );
};

export const getSellerById = async (id, role = 'seller') => {
  return db.query(
    `SELECT 
       r.id AS roleId,
       r.seller_type AS sellerType,
       u.fullName AS sellerName, 
       u.email AS email, 
       u.phoneNumber AS phoneNumber, 
       u.profileImage AS profileImage,
       u.companyName AS companyName,
       u.companyAddress AS companyAddress,
       u.vat AS vat,
       r.is_active AS isActive,
       r.isBlocked AS isBlocked,
       r.role AS role
     FROM tbl_users u
     LEFT JOIN tbl_roles r ON u.id = r.user_id
     WHERE u.id = ?
     ORDER BY r.id DESC
     LIMIT 1`,
    [id]
  );
};

export const getSellerCarListings = async (sellerId) => {
  return db.query(
    `SELECT 
       c.id AS carId,
       c.carModel,
       c.brandName,
       c.totalPrice,
       c.createdAt,
       CASE 
         WHEN c.is_active = 1 THEN 'active'
         ELSE 'expired'
       END AS status
     FROM tbl_cars c
     WHERE c.user_id = ?
     ORDER BY c.createdAt DESC`,
    [sellerId]
  );
};

export const getPendingCompanies = async (search = '') => {
  let query = `
    SELECT
      id,
      fullName,
      companyName,
      email,
      phoneNumber,
      whatsappNumber,
      companyAddress,
      city,
      pincode,
      uid AS commercial_register_number,
      account_type,
      isVerified,
      is_activated,
      createdAt
    FROM tbl_users
    WHERE account_type = 'company'
      AND is_activated = 0
  `;

  const params = [];

  if (search) {
    query += `
      AND (
        fullName LIKE ?
        OR companyName LIKE ?
        OR email LIKE ?
        OR phoneNumber LIKE ?
      )
    `;
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch, likeSearch);
  }

  query += ` ORDER BY id DESC`;

  return db.query(query, params);
};

export const getCompanyByIdForApproval = async (id) => {
  return db.query(
    `
    SELECT
      id,
      fullName,
      companyName,
      email,
      account_type,
      isVerified,
      is_activated
    FROM tbl_users
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );
};

export const updateCompanyActivationStatus = async (id, status) => {
  return db.query(
    `
    UPDATE tbl_users
    SET is_activated = ?
    WHERE id = ? AND account_type = 'company'
    `,
    [status, id]
  );
};

export const getRoleStatusQuery = (user_id) => {
  return db.query(`SELECT isBlocked FROM tbl_roles WHERE user_id = ?`, [user_id]);
};

export const blockRoleQuery = async (user_id, role, isBlocked) => {
  const targetStatus = Number(typeof isBlocked !== 'undefined' ? isBlocked : role) === 1 ? 1 : 0;
  const existing = await db.query(`SELECT id FROM tbl_roles WHERE user_id = ?`, [user_id]);
  if (existing && existing.length > 0) {
    return db.query(`UPDATE tbl_roles SET isBlocked = ? WHERE user_id = ?`, [targetStatus, user_id]);
  } else {
    const userRows = await db.query(`SELECT isSeller FROM tbl_users WHERE id = ?`, [user_id]);
    const validRole = (userRows && userRows.length > 0 && Number(userRows[0].isSeller) === 1) ? 'seller' : 'buyer';
    return db.query(
      `INSERT INTO tbl_roles (user_id, role, is_active, isBlocked) VALUES (?, ?, 1, ?)`,
      [user_id, validRole, targetStatus]
    );
  }
};

export const fetchAdminSideUsersById = async (id) => {
  return db.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
};
