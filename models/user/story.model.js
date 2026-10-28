import db from '../../config/db.js';

/**
 * Insert a new story into tbl_stories
 */
export const createStoryModel = async ({ user_id, media_url, caption = null }) => {
  const sql = `
    INSERT INTO tbl_stories (user_id, media_url, caption, is_active, created_at, expires_at)
    VALUES (?, ?, ?, 1, NOW(), NOW() + INTERVAL 24 HOUR)
  `;
  const result = await db.query(sql, [user_id, media_url, caption]);
  return result;
};

/**
 * Fetch all active stories (< 24h old, is_active = 1) along with user info & seen status
 * @param {number|null} currentUserId - ID of the logged-in user
 */
export const getActiveStoriesRawModel = async (currentUserId = null, excludeOwn = true) => {
  const currentUserIdParam = currentUserId ? Number(currentUserId) : 0;

  const params = [currentUserIdParam, currentUserIdParam];
  let excludeClause = '';
  if (excludeOwn && currentUserIdParam > 0) {
    excludeClause = ' AND s.user_id != ? ';
    params.push(currentUserIdParam);
  }

  const sql = `
    SELECT 
      s.id AS story_id,
      s.user_id,
      s.media_url,
      s.caption,
      s.created_at,
      s.expires_at,
      u.fullName AS user_name,
      u.profileImage AS user_profile_image,
      u.companyName AS user_company_name,
      (
        SELECT COUNT(DISTINCT sv.viewer_id) 
        FROM tbl_story_views sv 
        INNER JOIN tbl_users vu ON vu.id = sv.viewer_id AND (vu.is_deleted = 0 OR vu.is_deleted IS NULL)
        WHERE sv.story_id = s.id AND sv.viewer_id != s.user_id
      ) AS views_count,
      CASE 
        WHEN ? > 0 AND EXISTS (
          SELECT 1 FROM tbl_story_views sv 
          WHERE sv.story_id = s.id AND sv.viewer_id = ? AND sv.viewer_id != s.user_id
        ) THEN 1 
        ELSE 0 
      END AS is_seen
    FROM tbl_stories s

    INNER JOIN tbl_users u ON u.id = s.user_id AND (u.is_deleted = 0 OR u.is_deleted IS NULL)
    WHERE s.is_active = 1 
      AND s.expires_at > NOW()
      ${excludeClause}
    ORDER BY s.created_at ASC
  `;

  return db.query(sql, params);
};


/**
 * Fetch a single story by ID (checks active and not expired)
 */
export const getStoryByIdModel = async (storyId, currentUserId = null) => {
  const currentUserIdParam = currentUserId ? Number(currentUserId) : 0;

  const sql = `
    SELECT 
      s.id,
      s.user_id,
      s.media_url,
      s.caption,
      s.is_active,
      s.created_at,
      s.expires_at,
      u.fullName AS user_name,
      u.profileImage AS user_profile_image,
      u.companyName AS user_company_name,
      (
        SELECT COUNT(DISTINCT sv.viewer_id) 
        FROM tbl_story_views sv 
        INNER JOIN tbl_users vu ON vu.id = sv.viewer_id AND (vu.is_deleted = 0 OR vu.is_deleted IS NULL)
        WHERE sv.story_id = s.id AND sv.viewer_id != s.user_id
      ) AS views_count,
      CASE 
        WHEN ? > 0 AND EXISTS (
          SELECT 1 FROM tbl_story_views sv 
          WHERE sv.story_id = s.id AND sv.viewer_id = ? AND sv.viewer_id != s.user_id
        ) THEN 1 
        ELSE 0 
      END AS is_seen
    FROM tbl_stories s
    INNER JOIN tbl_users u ON u.id = s.user_id
    WHERE s.id = ? AND s.is_active = 1 AND s.expires_at > NOW()
    LIMIT 1
  `;

  const rows = await db.query(sql, [currentUserIdParam, currentUserIdParam, storyId]);
  return rows[0] || null;
};

/**
 * Fetch raw story metadata regardless of expiration (for ownership checks during delete)
 */
export const getStoryMetaByIdModel = async (storyId) => {
  const sql = `
    SELECT id, user_id, is_active, created_at, expires_at 
    FROM tbl_stories 
    WHERE id = ? 
    LIMIT 1
  `;
  const rows = await db.query(sql, [storyId]);
  return rows[0] || null;
};

/**
 * Mark a story as viewed by viewerId (duplicate prevention and owner-view exclusion)
 */
export const markStoryViewedModel = async ({ story_id, viewer_id }) => {
  const sql = `
    INSERT IGNORE INTO tbl_story_views (story_id, viewer_id, viewed_at)
    SELECT ?, ?, NOW()
    FROM tbl_stories
    WHERE id = ? AND user_id != ?
  `;
  return db.query(sql, [story_id, viewer_id, story_id, viewer_id]);
};

/**
 * Fetch viewers list for a specific story (excludes the story owner)
 */
export const getStoryViewersModel = async (storyId) => {
  const sql = `
    SELECT 
      sv.viewer_id,
      u.fullName AS user_name,
      u.profileImage AS profile_image,
      u.companyName AS company_name,
      MAX(sv.viewed_at) AS viewed_at
    FROM tbl_story_views sv
    INNER JOIN tbl_users u ON u.id = sv.viewer_id AND (u.is_deleted = 0 OR u.is_deleted IS NULL)
    INNER JOIN tbl_stories s ON s.id = sv.story_id
    WHERE sv.story_id = ? AND sv.viewer_id != s.user_id
    GROUP BY sv.viewer_id, u.fullName, u.profileImage, u.companyName
    ORDER BY viewed_at DESC
  `;
  return db.query(sql, [storyId]);
};

/**
 * Fetch all active stories for a specific user with their viewers (excludes owner's own views)
 */
export const getUserActiveStoriesModel = async (userId) => {
  const sql = `
    SELECT 
      s.id,
      s.user_id,
      s.media_url,
      s.caption,
      s.created_at,
      s.expires_at,
      (
        SELECT COUNT(DISTINCT sv.viewer_id) 
        FROM tbl_story_views sv 
        INNER JOIN tbl_users vu ON vu.id = sv.viewer_id AND (vu.is_deleted = 0 OR vu.is_deleted IS NULL)
        WHERE sv.story_id = s.id AND sv.viewer_id != s.user_id
      ) AS views_count
    FROM tbl_stories s
    WHERE s.user_id = ? 
      AND s.is_active = 1 
      AND s.expires_at > NOW()
    ORDER BY s.created_at DESC
  `;
  return db.query(sql, [userId]);
};



/**
 * Delete / deactivate a story (ownership protected)
 */
export const deleteStoryModel = async (storyId, userId) => {
  const sql = `
    UPDATE tbl_stories 
    SET is_active = 0 
    WHERE id = ? AND user_id = ?
  `;
  return db.query(sql, [storyId, userId]);
};
