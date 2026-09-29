import db from '../../config/db.js';

export const fetchallCars = async (search = '', isActive = '', createdAt = '') => {
  let query = `
    SELECT * FROM tbl_cars
  `;
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push(`(brandName LIKE ? OR carModel LIKE ?)`);
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch);
  }

  if (isActive !== '') {
    conditions.push(`is_active = ?`);
    params.push(isActive);
  }
  if (createdAt) {
    conditions.push(`DATE(createdAt) = ?`);
    params.push(createdAt);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ` ORDER BY id DESC`;

  return db.query(query, params);
};

export const fetchCarImagesByCarId = async () => {
  return db.query("SELECT carId, images FROM tbl_cars_images");
};

export const getFullCarById = async (id) => {
  const query = `
    SELECT 
      c.*, 
      u.fullName AS sellerName,
      u.email AS sellerEmail,
      u.phoneNumber AS sellerPhone,
      u.profileImage AS sellerProfileImage,
      u.location AS sellerLocation,
      r.seller_type,
      CASE 
        WHEN r.seller_type = 'business' THEN u.companyName
        ELSE NULL
      END AS companyName,
      GROUP_CONCAT(ci.images) AS carImages
    FROM tbl_cars c
    JOIN tbl_users u ON c.user_id = u.id
    LEFT JOIN tbl_roles r ON u.id = r.user_id
    LEFT JOIN tbl_cars_images ci ON ci.carId = c.id
    WHERE c.id = ?
    GROUP BY 
      c.id,
      u.fullName,
      u.email,
      u.phoneNumber,
      u.profileImage,
      u.location,
      r.seller_type,
      u.companyName
  `;

  const rows = await db.query(query, [id]);
  if (!rows || rows.length === 0) return null;
  const car = rows[0];
  car.carImages = car.carImages ? car.carImages.split(',') : [];
  return car;
};
