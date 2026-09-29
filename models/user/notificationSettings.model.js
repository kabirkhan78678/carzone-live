import db from '../../config/db.js';

export const DEFAULT_NOTIFICATION_SETTINGS = {
  new_matching_vehicles: 1,
  price_changes: 1,
  favorited_vehicle_updates: 1,
  marketing_promotional: 1,
  chat_messages: 1,
  vehicle_inquiries: 1,
  appointments: 1,
  listing_updates: 1
};

export const MANDATORY_NOTIFICATION_TYPES = new Set([
  'account_security',
  'plan_expired',
  'listing_rejected',
  'security',
  'transactional',
  'system_mandatory'
]);

/**
 * Fetch a user's notification preferences with fallback to defaults
 */
export const getUserNotificationSettings = async (userId) => {
  try {
    const rows = await db.query(
      `SELECT 
         new_matching_vehicles,
         price_changes,
         favorited_vehicle_updates,
         marketing_promotional,
         chat_messages,
         vehicle_inquiries,
         appointments,
         listing_updates
       FROM tbl_user_notification_settings
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows && rows.length > 0) {
      return {
        new_matching_vehicles: Boolean(rows[0].new_matching_vehicles),
        price_changes: Boolean(rows[0].price_changes),
        favorited_vehicle_updates: Boolean(rows[0].favorited_vehicle_updates),
        marketing_promotional: Boolean(rows[0].marketing_promotional),
        chat_messages: Boolean(rows[0].chat_messages),
        vehicle_inquiries: Boolean(rows[0].vehicle_inquiries),
        appointments: Boolean(rows[0].appointments),
        listing_updates: Boolean(rows[0].listing_updates)
      };
    }

    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  } catch (error) {
    console.error('Error fetching user notification settings:', error);
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
};

/**
 * Upsert a user's notification preferences
 */
export const updateUserNotificationSettings = async (userId, settings = {}) => {
  const current = await getUserNotificationSettings(userId);
  const updated = {
    new_matching_vehicles: settings.new_matching_vehicles !== undefined ? (settings.new_matching_vehicles ? 1 : 0) : (current.new_matching_vehicles ? 1 : 0),
    price_changes: settings.price_changes !== undefined ? (settings.price_changes ? 1 : 0) : (current.price_changes ? 1 : 0),
    favorited_vehicle_updates: settings.favorited_vehicle_updates !== undefined ? (settings.favorited_vehicle_updates ? 1 : 0) : (current.favorited_vehicle_updates ? 1 : 0),
    marketing_promotional: settings.marketing_promotional !== undefined ? (settings.marketing_promotional ? 1 : 0) : (current.marketing_promotional ? 1 : 0),
    chat_messages: settings.chat_messages !== undefined ? (settings.chat_messages ? 1 : 0) : (current.chat_messages ? 1 : 0),
    vehicle_inquiries: settings.vehicle_inquiries !== undefined ? (settings.vehicle_inquiries ? 1 : 0) : (current.vehicle_inquiries ? 1 : 0),
    appointments: settings.appointments !== undefined ? (settings.appointments ? 1 : 0) : (current.appointments ? 1 : 0),
    listing_updates: settings.listing_updates !== undefined ? (settings.listing_updates ? 1 : 0) : (current.listing_updates ? 1 : 0)
  };

  const sql = `
    INSERT INTO tbl_user_notification_settings (
      user_id,
      new_matching_vehicles,
      price_changes,
      favorited_vehicle_updates,
      marketing_promotional,
      chat_messages,
      vehicle_inquiries,
      appointments,
      listing_updates
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      new_matching_vehicles = VALUES(new_matching_vehicles),
      price_changes = VALUES(price_changes),
      favorited_vehicle_updates = VALUES(favorited_vehicle_updates),
      marketing_promotional = VALUES(marketing_promotional),
      chat_messages = VALUES(chat_messages),
      vehicle_inquiries = VALUES(vehicle_inquiries),
      appointments = VALUES(appointments),
      listing_updates = VALUES(listing_updates),
      updated_at = CURRENT_TIMESTAMP
  `;

  await db.query(sql, [
    userId,
    updated.new_matching_vehicles,
    updated.price_changes,
    updated.favorited_vehicle_updates,
    updated.marketing_promotional,
    updated.chat_messages,
    updated.vehicle_inquiries,
    updated.appointments,
    updated.listing_updates
  ]);

  return getUserNotificationSettings(userId);
};

/**
 * Check if a user can receive a notification of a given category
 */
export const canUserReceiveNotification = async (userId, category = 'general') => {
  // 1. Mandatory security and transactional notifications can never be disabled
  if (MANDATORY_NOTIFICATION_TYPES.has(category)) {
    return true;
  }

  // 2. Check master switch in tbl_users
  try {
    const userRows = await db.query(
      `SELECT isNotification FROM tbl_users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (userRows && userRows.length > 0 && userRows[0].isNotification === 0) {
      return false;
    }
  } catch (err) {
    console.error('Error checking user isNotification master switch:', err);
  }

  // 3. Check category specific setting
  const settings = await getUserNotificationSettings(userId);
  if (settings[category] !== undefined) {
    return Boolean(settings[category]);
  }

  return true;
};
