import db from '../../config/db.js';

export const fetchLatest3Cars = async () => {
  return db.query(`
    SELECT c.*, ci.images AS carImages
    FROM tbl_cars c
    LEFT JOIN (
        SELECT carId, MIN(images) AS images
        FROM tbl_cars_images
        GROUP BY carId
    ) ci ON ci.carId = c.id
    ORDER BY c.id DESC
    LIMIT 4
  `);
};

export const getDashboardCountsQuery = async () => {
  const countsSql = `
    SELECT 
      (SELECT COUNT(*) FROM tbl_roles WHERE role = 'buyer') AS totalBuyers,
      (SELECT COUNT(*) FROM tbl_roles WHERE role = 'seller') AS totalSellers,
      (SELECT COUNT(*) FROM tbl_cars WHERE is_active = 1) AS totalActiveCars
  `;
  const [countsResult] = await db.query(countsSql);
  return {
    ...countsResult,
  };
};

export const fetchLatest3Sellers = async () => {
  const query = `
    SELECT 
      u.profileImage AS profile,
      u.fullName AS sellerName,
      u.phoneNumber AS phoneNo,
      u.*,
      r.seller_type,
      (SELECT COUNT(*) FROM tbl_cars WHERE user_id = u.id) AS totalListings
    FROM tbl_roles r
    JOIN tbl_users u ON r.user_id = u.id
    WHERE r.role = 'seller'
    ORDER BY r.id DESC
  `;
  return db.query(query);
};

export const getUsersSummary = async () => {
  const query = `
    SELECT 
      p.*,
      u.fullName AS username
    FROM tbl_purchases p
    LEFT JOIN tbl_users u 
      ON u.id = p.user_id
    ORDER BY p.id;
  `;
  return await db.query(query);
};

export const getDashboardModel = async (year) => {

    // Card 1 - Total Revenue
    const totalRevenueSql = `
        SELECT
            COALESCE(SUM(prorated_price), 0) AS totalRevenue
        FROM tbl_purchases
        WHERE payment_status = 'paid';
    `;

    // Card 2 - Total Slot Packages Sold
    const totalSlotsSql = `
        SELECT
            COALESCE(SUM(purchased_slots), 0) AS totalSlotPackagesSold
        FROM tbl_purchases
        WHERE payment_status = 'paid';
    `;

    // Card 3 - This Month Revenue
    const thisMonthRevenueSql = `
        SELECT
            COALESCE(SUM(prorated_price), 0) AS thisMonthRevenue
        FROM tbl_purchases
        WHERE payment_status = 'paid'
        AND MONTH(purchase_date) = MONTH(CURDATE())
        AND YEAR(purchase_date) = YEAR(CURDATE());
    `;

    // Revenue Overview (Selected Year)
    const revenueOverviewSql = `
        SELECT
            COALESCE(SUM(prorated_price), 0) AS totalRevenue
        FROM tbl_purchases
        WHERE payment_status = 'paid'
        AND YEAR(purchase_date) = ?;
    `;

    // Monthly Revenue (Returns all 12 months)
    const monthlyRevenueSql = `
        SELECT
            m.month,
            m.month_name,
            COALESCE(SUM(tp.prorated_price), 0) AS revenue
        FROM
        (
            SELECT 1 AS month,'Jan' AS month_name
            UNION ALL SELECT 2,'Feb'
            UNION ALL SELECT 3,'Mar'
            UNION ALL SELECT 4,'Apr'
            UNION ALL SELECT 5,'May'
            UNION ALL SELECT 6,'Jun'
            UNION ALL SELECT 7,'Jul'
            UNION ALL SELECT 8,'Aug'
            UNION ALL SELECT 9,'Sep'
            UNION ALL SELECT 10,'Oct'
            UNION ALL SELECT 11,'Nov'
            UNION ALL SELECT 12,'Dec'
        ) m
        LEFT JOIN tbl_purchases tp
            ON MONTH(tp.purchase_date) = m.month
            AND YEAR(tp.purchase_date) = ?
            AND tp.payment_status = 'paid'
        GROUP BY m.month, m.month_name
        ORDER BY m.month;
    `;

    // Individual Listings
    const individualListingsSql = `
        SELECT
            COUNT(*) AS individualListingsSold
        FROM tbl_purchases tp
        INNER JOIN tbl_users u
            ON tp.user_id = u.id
        WHERE tp.payment_status = 'paid'
        AND u.account_type = 'private';
    `;

    // Slots Sold By Package
    const slotsSoldSql = `
        SELECT
            CONCAT(purchased_slots,' Slot Package') AS title,
            COUNT(*) AS sales,
            SUM(prorated_price) AS revenue
        FROM tbl_purchases
        WHERE payment_status = 'paid'
        AND YEAR(purchase_date) = ?
        GROUP BY purchased_slots
        ORDER BY purchased_slots;
    `;

    // Plan Distribution
    const planDistributionSql = `
        SELECT
            p.duration_type,
            COUNT(*) AS active_subscribers
        FROM (
            SELECT tp.user_id, tp.plan_id
            FROM tbl_purchases tp
            INNER JOIN (
                SELECT user_id, MAX(id) AS latest_purchase_id
                FROM tbl_purchases
                GROUP BY user_id
            ) latest
                ON tp.id = latest.latest_purchase_id
        ) lp
        INNER JOIN tbl_user_plans up
            ON lp.user_id = up.user_id
        INNER JOIN tbl_plans p
            ON lp.plan_id = p.id
        WHERE up.is_active = 1
        GROUP BY p.duration_type;
    `;

    // Execute Queries
    const totalRevenue = await db.query(totalRevenueSql);
    const totalSlots = await db.query(totalSlotsSql);
    const thisMonthRevenue = await db.query(thisMonthRevenueSql);
    const revenueOverview = await db.query(revenueOverviewSql, [year]);
    const monthlyRevenue = await db.query(monthlyRevenueSql, [year]);
    const slotsSold = await db.query(slotsSoldSql, [year]);
    const planDistribution = await db.query(planDistributionSql);
    const individualListings = await db.query(individualListingsSql);

    return {
        cards: {
            totalRevenue: Number(totalRevenue[0].totalRevenue),
            totalSlotPackagesSold: Number(totalSlots[0].totalSlotPackagesSold),
            thisMonthRevenue: Number(thisMonthRevenue[0].thisMonthRevenue),
            individualListingsSold: Number(individualListings[0].individualListingsSold)
        },

        revenueOverview: {
            year: Number(year),
            totalRevenue: Number(revenueOverview[0].totalRevenue),
            monthlyRevenue
        },

        slotsSold,

        planDistribution
    };
};
