import db from '../../config/db.js';

export const fetchAllUsersWithPurchases = async () => {
  const query = `
    SELECT 
        u.*,
        p.id AS purchase_id,
        p.plan_id,
        p.payment_status,
        p.purchase_date AS created_at,
        1 AS is_active,
        p.purchase_date AS start_date,
        DATE_ADD(p.purchase_date, INTERVAL 30 DAY) AS end_date,
        pl.name AS plan_name,
        pl.slot_count,
        pl.price
    FROM tbl_purchases p
    INNER JOIN tbl_users u ON u.id = p.user_id
    LEFT JOIN tbl_plans pl ON p.plan_id = pl.id
    ORDER BY p.id DESC
  `;

  const rows = await db.query(query);
  return rows;
};

export const getAllPlans = async () => {
  const query = `SELECT * FROM tbl_plans ORDER BY id DESC`;
  const rows = await db.query(query);
  return rows;
};

export const fetchSlotRequestsByStatus = async (status) => {
  const rows = await db.query(
    `SELECT 
       sr.*,
       sr.duration_type AS subscription_preference,
       u.fullName,
       u.phoneNumber,
       u.email,
       u.profileImage,
       COALESCE((
         SELECT up.total_slots 
         FROM tbl_user_plans up 
         WHERE up.user_id = sr.user_id AND up.is_active = 1 
         ORDER BY up.end_date DESC 
         LIMIT 1
       ), 0) AS current_slot_capacity,
       COALESCE((
         SELECT COUNT(*) 
         FROM tbl_cars c 
         WHERE c.user_id = sr.user_id 
           AND c.is_deleted = 0 
           AND c.is_active = 1 
           AND c.listing_status = 'published'
       ), 0) AS active_vehicle_count
     FROM slot_requests sr
     LEFT JOIN tbl_users u ON sr.user_id = u.id
     WHERE sr.status = ? 
     ORDER BY sr.created_at DESC`,
    [status]
  );
  if (!rows || rows.length === 0) return [];
  return rows.map(r => {
    const currentCap = Number(r.current_slot_capacity || 0);
    const activeCars = Number(r.active_vehicle_count || 0);
    const available = Math.max(0, currentCap - activeCars);
    return {
      ...r,
      current_slot_capacity: currentCap,
      active_vehicle_count: activeCars,
      available_slots: available,
      subscription_preference: r.subscription_preference || r.duration_type || 'MONTHLY'
    };
  });
};

export const getUserFcmToken = async (userId) => {
  const [rows] = await db.query(
    'SELECT fcmToken FROM tbl_users WHERE id = ? AND fcmToken IS NOT NULL',
    [userId]
  );
  return rows?.length ? rows[0].fcmToken : null;
};

export const fetchSlotRequestById = (id) => {
  return db.query(
    `SELECT * FROM slot_requests WHERE id = ?`,
    [id]
  );
};

export const insertPlan = async (data) => {
  const durationType = data.duration_type ? String(data.duration_type).toLowerCase() : 'monthly';
  return db.query(
    `INSERT INTO tbl_plans (name, price, slot_count, plan_type, duration_type, is_public, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.name, data.price, data.slot_count, data.plan_type, durationType, data.is_public, data.user_id]
  );
};

export const changeSlotRequestStatus = async (id, status, adminMessage, approvedPrice = null, planId = null) => {
  const query = `
        UPDATE slot_requests
        SET status = ?,
            admin_message = ?,
            approved_price = ?,
            plan_id = ?,
            updated_at = NOW()
        WHERE id = ?
    `;
  await db.query(query, [status, adminMessage, approvedPrice, planId, id]);
};

export const fetchSlotRequestsById = async (id) => {
  const rows = await db.query(
    `
    SELECT 
      sr.*,
      sr.duration_type AS subscription_preference,
      u.id AS user_id,
      u.fullName,
      u.phoneNumber,
      u.email,
      u.profileImage,
      COALESCE((
        SELECT up.total_slots 
        FROM tbl_user_plans up 
        WHERE up.user_id = sr.user_id AND up.is_active = 1 
        ORDER BY up.end_date DESC 
        LIMIT 1
      ), 0) AS current_slot_capacity,
      COALESCE((
        SELECT COUNT(*) 
        FROM tbl_cars c 
        WHERE c.user_id = sr.user_id 
          AND c.is_deleted = 0 
          AND c.is_active = 1 
          AND c.listing_status = 'published'
      ), 0) AS active_vehicle_count
    FROM slot_requests sr
    JOIN tbl_users u ON sr.user_id = u.id
    WHERE sr.id = ?
    `,
    [id]
  );

  if (!rows || rows.length === 0) return [];

  return rows.map(r => {
    const currentCap = Number(r.current_slot_capacity || 0);
    const activeCars = Number(r.active_vehicle_count || 0);
    const available = Math.max(0, currentCap - activeCars);
    return {
      ...r,
      current_slot_capacity: currentCap,
      active_vehicle_count: activeCars,
      available_slots: available,
      subscription_preference: r.subscription_preference || r.duration_type || 'MONTHLY'
    };
  });
};

export const getSellerSlotDetails = async (sellerId) => {
  const summaryQuery = `
    SELECT 
      p.user_id AS seller_id,
      u.fullName AS seller_name,
      COALESCE(SUM(p.purchased_slots), 0) AS total_slots_purchased,
      COALESCE(SUM(CASE WHEN p.plan_type = 'main' THEN p.purchased_slots ELSE 0 END), 0) AS main_slots,
      (
        SELECT COUNT(*) 
        FROM tbl_cars c 
        WHERE c.user_id = p.user_id
      ) AS total_listings
    FROM tbl_purchases p
    LEFT JOIN tbl_users u ON u.id = p.user_id
    WHERE p.user_id = ?
    GROUP BY p.user_id, u.fullName
  `;

  const summaryRows = await db.query(summaryQuery, [sellerId]);

  const listingsQuery = `
    SELECT 
      c.id AS car_id,
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
    ORDER BY c.createdAt DESC
  `;

  const listingRows = await db.query(listingsQuery, [sellerId]);

  return {
    summary: summaryRows[0] || null,
    listings: listingRows,
  };
};
