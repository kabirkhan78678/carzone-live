import db from '../../config/db.js';

export const updateAdminProfile = async (firstName, lastName, profileImg, id) => {
  return await db.query('UPDATE tbl_admin SET firstName = ?,lastName = ?, profileImage = ? WHERE id = ?', [firstName, lastName, profileImg, id])
}

export const modelLoginAdmin = async (email) => {
  return await db.query("SELECT * FROM tbl_admin WHERE email = ?", [email]);
};

export const isAdminExistsOrNot = async (email) => {
  return db.query("SELECT * FROM tbl_admin WHERE email = ?", [email]);
};

export const updateAdminForgotPasswordOtp = async (code, email) => {
  const query = "UPDATE tbl_users SET forgotPasswordOtp = ? WHERE email = ?";
  return db.query(query, [code, email]);
};

export const fetchAdminid = async (id) => {
  return db.query("SELECT * FROM tbl_admin WHERE id = ?", [id]);
};

export const fetchAdminById = async (id) => {
  return db.query(
    "SELECT id, firstName, lastName, email, password, forgot_password_token, forgot_password_token_expiry, reset_password_token, reset_password_token_expiry, phoneNumber, profileImage, status, created_at, updated_at FROM tbl_admin WHERE id = ?",
    [id]
  );
};

export const modelForget = async (token, expiry, email) => {
  await db.query(
    "UPDATE tbl_admin SET forgot_password_token = ?, forgot_password_token_expiry = ? WHERE email = ?",
    [token, expiry, email]
  );
};

//     LEFT JOIN tbl_cars_images ci ON ci.carId = tbl_cars.id
//     ORDER BY tbl_cars.id DESC LIMIT 3`);
// };

export const get_admin_data_by = async (token) => {
  return await db.query(`SELECT * FROM tbl_admin WHERE reset_password_token = ?`, [token]);
};

export const get_admin_data_by_email = async (email) => {
  return await db.query(`SELECT * FROM tbl_admin WHERE email = ?`, [email]);
};

export const update_admin_data = async (
  reset_password_token,
  reset_password_token_expiry,
  email
) => {
  try {
    return await db.query(
      "UPDATE tbl_admin SET reset_password_token = ?, reset_password_token_expiry = ? WHERE email = ?",
      [reset_password_token, reset_password_token_expiry, email]
    );
  } catch (error) {
    console.error("Database Error:", error.message);
    throw new Error("Failed to update admin data");
  }
};

export const update_admin_data_by = async (
  hashedPassword,
  newPassword,
  admin_id
) => {
  try {
    return await db.query(
      `UPDATE tbl_admin SET password = ?, show_password = ?, reset_password_token = NULL, reset_password_token_expiry = NULL WHERE id = ?`,
      [hashedPassword, newPassword, admin_id]
    );
  } catch (error) {
    console.error("Database Error:", error.message);
    throw new Error("Failed to update admin data.");
  }
};

export const updateAdminPassword = async (hashedPassword, adminId) => {
  return db.query(`UPDATE tbl_admin SET password = ? WHERE id = ?`, [hashedPassword, adminId])
}

//     SELECT 
//       c.*, 
//       u.fullName AS sellerName,
//       u.email AS sellerEmail,
//       u.phoneNumber AS sellerPhone,
//       u.profileImage AS sellerProfileImage,
//       u.location AS sellerLocation,
//       r.seller_type,
//       CASE 
//         WHEN r.seller_type = 'business' THEN u.companyName
//         ELSE NULL
//       END AS companyName
//     FROM tbl_cars c
//     JOIN tbl_users u ON c.user_id = u.id
//     JOIN tbl_roles r ON u.id = r.user_id
//     WHERE c.id = ?
//   `;
// };
