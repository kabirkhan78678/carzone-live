import db from '../../config/db.js';

export const isUsersExistsOrNot = async (email) => {
    return db.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
};

export const deleteEmail = async (email) => {
    return db.query('DELETE FROM tbl_users WHERE email = ?', [email]);
};

export const deleteRoleByUserId = async (userId) => {
    return db.query('DELETE FROM tbl_roles WHERE user_id = ?', [userId]);
};

export const userRegistration = async (data) => {
    return db.query("INSERT INTO tbl_users SET ?", [data]);
};

export const updateUserForgotPasswordOtp = async (code, email) => {
    const query = "UPDATE tbl_users SET forgotPasswordOtp = ? WHERE email = ?";
    return db.query(query, [code, email]);
};

export const fetchUsersById = async (id) => {
    return db.query("SELECT * FROM tbl_users WHERE id = ?", [id]);
};

export const fetchUsersByEmail = async (email) => {
    console.log('email', email);
    return db.query("SELECT * FROM tbl_users WHERE email = ?", [email]);
};

export const insertUserRole = async ({ user_id, role, seller_type, is_active }) => {
    const finalSellerType = seller_type;
    const query = `
        INSERT INTO tbl_roles (user_id, role, seller_type, is_active)
        VALUES (?, ?, ?, ?)`;
    return db.query(query, [user_id, role, finalSellerType, is_active]);
};

export const changePassword = async (password, id) => {
    const query = "UPDATE tbl_users SET password = ? WHERE id = ?";
    return db.query(query, [password, id]);
};

let tblUsersColumnsCache = null;
let tblUsersColumnsCacheTime = 0;

export const getTblUsersColumns = async () => {
    const now = Date.now();
    if (tblUsersColumnsCache && (now - tblUsersColumnsCacheTime < 300000)) {
        return tblUsersColumnsCache;
    }
    try {
        const rows = await db.query('DESCRIBE tbl_users');
        if (Array.isArray(rows)) {
            tblUsersColumnsCache = new Set(rows.map(r => r.Field));
            tblUsersColumnsCacheTime = now;
            return tblUsersColumnsCache;
        }
    } catch (err) {
        console.error('Error fetching tbl_users columns:', err);
    }
    return null;
};

export const updateUsersProfile = async (updatedFields, id) => {
    const validColumns = await getTblUsersColumns();
    const filteredFields = {};

    for (const [key, value] of Object.entries(updatedFields)) {
        if (!validColumns || validColumns.has(key)) {
            filteredFields[key] = value;
        } else {
            console.warn(`[updateUsersProfile] Skipping column '${key}' as it does not exist in tbl_users.`);
        }
    }

    const keys = Object.keys(filteredFields);
    if (keys.length === 0) {
        return { affectedRows: 0 };
    }

    const values = Object.values(filteredFields);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    values.push(id);
    const query = `UPDATE tbl_users SET ${setClause} WHERE id = ?`;

    try {
        return await db.query(query, values);
    } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.warn('[updateUsersProfile] ER_BAD_FIELD_ERROR detected. Refreshing columns cache and retrying...');
            tblUsersColumnsCache = null;
            const freshCols = await getTblUsersColumns();
            if (freshCols) {
                const retryFields = {};
                for (const [key, value] of Object.entries(updatedFields)) {
                    if (freshCols.has(key)) {
                        retryFields[key] = value;
                    }
                }
                const retryKeys = Object.keys(retryFields);
                if (retryKeys.length > 0) {
                    const retryValues = Object.values(retryFields);
                    const retrySetClause = retryKeys.map((key) => `${key} = ?`).join(", ");
                    retryValues.push(id);
                    return await db.query(`UPDATE tbl_users SET ${retrySetClause} WHERE id = ?`, retryValues);
                }
            }
        }
        throw error;
    }
};

export const updateSellerTypeProfile = async (updatedFields, id) => {
    console.log(updatedFields);
    const keys = Object.keys(updatedFields);
    const values = Object.values(updatedFields);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");
    values.push(id);
    const query = `UPDATE tbl_roles SET ${setClause} WHERE user_id = ? and role='seller'`;
    return db.query(query, values);
};

export const updateUserOtp = async (code, email) => {
    const query = "UPDATE tbl_users SET code = ? WHERE email = ?";
    return db.query(query, [code, email]);
};

export const updateUserPassword = async (password, email) => {
    const query = "UPDATE tbl_users SET password = ? WHERE email = ?";
    return db.query(query, [password, email]);
};

export const updateUsersByOtp = async (id) => {
    return db.query(
        `Update tbl_users set isVerified = 1 where id = ?`,
        [id]
    );
};

export const updateOrInsertUserRole = async ({ user_id, role, seller_type, is_active }) => {
    seller_type = seller_type || null;

    const [rows] = await db.query("SELECT * FROM tbl_roles WHERE user_id = ?", [user_id]);

    if (Array.isArray(rows) && rows.length > 0) {
        // Update role
        const query = `
            UPDATE tbl_roles
            SET role = ?, seller_type = ?, is_active = ?
            WHERE user_id = ?
        `;
        return db.query(query, [role, seller_type, is_active, user_id]);
    } else {
        // Insert role
        const query = `
            INSERT INTO tbl_roles (user_id, role, seller_type, is_active)
            VALUES (?, ?, ?, ?)
        `;
        return db.query(query, [user_id, role, seller_type, is_active]);
    }
};

export const insertSellerRole = async (data) => {
    return db.query("INSERT INTO tbl_roles SET ?", [data]);
};

export const checkIfUserIsSeller = async (user_id) => {
    const [rows] = await db.query('SELECT * FROM tbl_roles WHERE user_id = ?', [user_id]);
    return rows;
};

//   --------------------------------------------karan patel ----------------------------------------------//

export const fetchRoleByUsersId = async (id, role) => {
    if (role) {
        return db.query('SELECT * FROM tbl_roles WHERE user_id = ? AND role = ?', [id, role]);
    }
    return db.query('SELECT * FROM tbl_roles WHERE user_id = ?', [id]);
};

export const fetchUserRoleData = async (id) => {
    return db.query("SELECT * FROM tbl_roles WHERE user_id = ?", [id]);
};

export const updateUserRole = async (seller_type, user_id, role) => {
    await db.query(`UPDATE tbl_roles SET seller_type = ? WHERE user_id = ? AND role = ?`, [seller_type, user_id, role]);
};

export const createUserByEmail = (email, fullName, isSeller) => {
    console.log('email>>>>>>>>>>>>>>>', email);
    return db.query(
        `INSERT INTO tbl_users (email, fullName, isSeller) VALUES (?, ?, ?)`,
        [email, fullName, isSeller]
    );
};
