import {
  createStoryModel,
  getActiveStoriesRawModel,
  getStoryByIdModel,
  getStoryMetaByIdModel,
  markStoryViewedModel,
  getStoryViewersModel,
  getUserActiveStoriesModel,
  deleteStoryModel
} from '../../models/user.model.js';
import { handleSuccess, handleError } from '../../utils/responseHandler.js';
import { variableTypes } from '../../utils/constant.js';
import { getMessage } from '../../utils/user_helper.js';
import { baseurl } from '../../config/path.js';
import db from '../../config/db.js';


/**
 * Helper to extract media URL from file upload or body payload
 */
const resolveMediaUrl = (req) => {
  if (req.file) {
    return `${baseurl}/profile/${req.file.filename}`;
  }
  if (req.files) {
    const singleFile = req.files.image?.[0] || req.files.storyImage?.[0] || req.files.media?.[0] || req.files.file?.[0];
    if (singleFile) {
      return `${baseurl}/profile/${singleFile.filename}`;
    }
  }
  return req.body.media_url || req.body.imageUrl || req.body.image_url || null;
};

/**
 * Create a new story
 * POST /api/stories
 */
export const createStory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const language = req.language || req.user?.language || 'en';

    if (!userId) {
      return handleError(res, 401, getMessage(language, variableTypes.NO_TOKEN_PROVIDED));
    }

    const mediaUrl = resolveMediaUrl(req);
    if (!mediaUrl) {
      return handleError(res, 400, getMessage(language, 'Story image is required'));
    }

    const caption = req.body.caption ? String(req.body.caption).trim() : null;

    const result = await createStoryModel({
      user_id: userId,
      media_url: mediaUrl,
      caption
    });

    const storyId = result.insertId;
    const createdStory = await getStoryByIdModel(storyId, userId);

    return handleSuccess(
      res,
      201,
      getMessage(language, 'Story created successfully'),
      createdStory
    );
  } catch (error) {
    console.error('Error in createStory:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Fetch all active stories, grouped by user with seen/unseen status
 * GET /api/stories
 */
export const getActiveStories = async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;
    const language = req.language || req.user?.language || 'en';

    const rawRows = await getActiveStoriesRawModel(currentUserId);

    // Group stories by user
    const usersMap = new Map();

    for (const row of rawRows) {
      const uId = row.user_id;

      // Exclude logged-in user's own stories (available via /api/stories/my-stories)
      if (currentUserId && Number(uId) === Number(currentUserId)) {
        continue;
      }

      if (!usersMap.has(uId)) {
        usersMap.set(uId, {
          user_id: uId,
          user_name: row.user_name || 'User',
          profile_image: row.user_profile_image || null,
          company_name: row.user_company_name || null,
          is_my_story: false,
          all_seen: true, // Will flip to false if any unseen story is found
          total_stories: 0,
          latest_story_time: row.created_at,
          stories: []
        });
      }

      const userGroup = usersMap.get(uId);
      const isSeen = Boolean(row.is_seen);

      // If not seen yet, all_seen is false
      if (!isSeen) {
        userGroup.all_seen = false;
      }

      userGroup.total_stories += 1;
      userGroup.latest_story_time = row.created_at;

      userGroup.stories.push({
        id: row.story_id,
        media_url: row.media_url,
        caption: row.caption,
        created_at: row.created_at,
        expires_at: row.expires_at,
        views_count: Number(row.views_count) || 0,
        is_seen: isSeen
      });
    }

    const groupedList = Array.from(usersMap.values());

    // Sort:
    // 1. Unseen stories (all_seen === false) first, sorted newest to oldest
    // 2. Fully seen stories (all_seen === true) last, sorted newest to oldest
    groupedList.sort((a, b) => {
      if (!a.all_seen && b.all_seen) return -1;
      if (a.all_seen && !b.all_seen) return 1;

      return new Date(b.latest_story_time) - new Date(a.latest_story_time);
    });


    return handleSuccess(
      res,
      200,
      getMessage(language, 'Stories fetched successfully'),
      groupedList
    );
  } catch (error) {
    console.error('Error in getActiveStories:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Mark a story as viewed
 * POST /api/stories/:id/views
 */
export const markStoryViewed = async (req, res) => {
  try {
    const viewerId = req.user?.id;
    const storyId = req.params.id;
    const language = req.language || req.user?.language || 'en';

    if (!viewerId) {
      return handleError(res, 401, getMessage(language, variableTypes.NO_TOKEN_PROVIDED));
    }

    // Check if story exists and is active / unexpired
    const story = await getStoryByIdModel(storyId);
    if (!story) {
      return handleError(res, 404, getMessage(language, 'Story not found or expired'));
    }

    // Story owner viewing their own story should NOT be recorded or counted
    if (Number(story.user_id) === Number(viewerId)) {
      const [countRow] = await db.query(
        `SELECT COUNT(DISTINCT sv.viewer_id) AS views_count 
         FROM tbl_story_views sv 
         INNER JOIN tbl_users u ON u.id = sv.viewer_id AND (u.is_deleted = 0 OR u.is_deleted IS NULL)
         INNER JOIN tbl_stories s ON s.id = sv.story_id
         WHERE sv.story_id = ? AND sv.viewer_id != s.user_id`,
        [storyId]
      );

      return handleSuccess(
        res,
        200,
        getMessage(language, 'Story viewed'),
        {
          story_id: Number(storyId),
          viewer_id: viewerId,
          is_new_view: false,
          views_count: Number(countRow?.views_count) || 0
        }
      );
    }

    const result = await markStoryViewedModel({
      story_id: storyId,
      viewer_id: viewerId
    });

    const isNewView = result.affectedRows > 0;

    const [countRow] = await db.query(
      `SELECT COUNT(DISTINCT sv.viewer_id) AS views_count 
       FROM tbl_story_views sv 
       INNER JOIN tbl_users u ON u.id = sv.viewer_id AND (u.is_deleted = 0 OR u.is_deleted IS NULL)
       INNER JOIN tbl_stories s ON s.id = sv.story_id
       WHERE sv.story_id = ? AND sv.viewer_id != s.user_id`,
      [storyId]
    );

    const viewsCount = Number(countRow?.views_count) || 0;

    return handleSuccess(
      res,
      200,
      getMessage(language, 'Story marked as viewed'),
      {
        story_id: Number(storyId),
        viewer_id: viewerId,
        is_new_view: isNewView,
        views_count: viewsCount
      }
    );
  } catch (error) {
    console.error('Error in markStoryViewed:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Fetch active stories created by the logged-in user with their viewers list
 * GET /api/stories/my-stories
 */
export const getMyStories = async (req, res) => {
  try {
    const userId = req.user?.id;
    const language = req.language || req.user?.language || 'en';

    if (!userId) {
      return handleError(res, 401, getMessage(language, variableTypes.NO_TOKEN_PROVIDED));
    }

    const activeStories = await getUserActiveStoriesModel(userId);

    // Fetch viewers for each active story (owner's own views excluded)
    const storiesWithViewers = await Promise.all(
      activeStories.map(async (story) => {
        const viewers = await getStoryViewersModel(story.id);
        const cleanViewers = viewers
          .filter((v) => Number(v.viewer_id) !== Number(userId))
          .map((v) => ({
            viewer_id: v.viewer_id,
            user_name: v.user_name || 'User',
            profile_image: v.profile_image || null,
            company_name: v.company_name || null,
            viewed_at: v.viewed_at
          }));

        return {
          id: story.id,
          media_url: story.media_url,
          caption: story.caption,
          created_at: story.created_at,
          expires_at: story.expires_at,
          views_count: cleanViewers.length, // Strictly synchronized with the actual viewers list!
          viewers: cleanViewers
        };
      })
    );

    return handleSuccess(
      res,
      200,
      getMessage(language, 'My stories fetched successfully'),
      storiesWithViewers
    );
  } catch (error) {
    console.error('Error in getMyStories:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Fetch a single story by ID
 * GET /api/stories/:id
 */
export const getStoryById = async (req, res) => {
  try {
    const storyId = req.params.id;
    const currentUserId = req.user?.id || null;
    const language = req.language || req.user?.language || 'en';

    const story = await getStoryByIdModel(storyId, currentUserId);
    if (!story) {
      return handleError(res, 404, getMessage(language, 'Story not found or expired'));
    }

    const responseData = {
      id: story.id,
      user_id: story.user_id,
      user_name: story.user_name || 'User',
      user_profile_image: story.user_profile_image || null,
      company_name: story.company_name || null,
      media_url: story.media_url,
      caption: story.caption,
      created_at: story.created_at,
      expires_at: story.expires_at,
      views_count: Number(story.views_count) || 0,
      is_seen: Boolean(story.is_seen),
      is_my_story: Boolean(currentUserId && currentUserId === story.user_id)
    };

    // If current logged-in user is the story owner, include the viewers list (excluding owner)
    if (responseData.is_my_story) {
      const viewers = await getStoryViewersModel(storyId);
      const cleanViewers = viewers
        .filter((v) => Number(v.viewer_id) !== Number(story.user_id))
        .map((v) => ({
          viewer_id: v.viewer_id,
          user_name: v.user_name || 'User',
          profile_image: v.profile_image || null,
          company_name: v.company_name || null,
          viewed_at: v.viewed_at
        }));

      responseData.views_count = cleanViewers.length; // Strictly synchronized!
      responseData.viewers = cleanViewers;
    }

    return handleSuccess(
      res,
      200,
      getMessage(language, 'Story details fetched successfully'),
      responseData
    );

  } catch (error) {
    console.error('Error in getStoryById:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Delete a story
 * DELETE /api/stories/:id
 */
export const deleteStory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const storyId = req.params.id;
    const language = req.language || req.user?.language || 'en';

    if (!userId) {
      return handleError(res, 401, getMessage(language, variableTypes.NO_TOKEN_PROVIDED));
    }

    const story = await getStoryMetaByIdModel(storyId);
    if (!story || story.is_active === 0) {
      return handleError(res, 404, getMessage(language, 'Story not found'));
    }

    if (story.user_id !== userId) {
      return handleError(res, 403, getMessage(language, 'You are not authorized to delete this story'));
    }

    await deleteStoryModel(storyId, userId);

    return handleSuccess(
      res,
      200,
      getMessage(language, 'Story deleted successfully')
    );
  } catch (error) {
    console.error('Error in deleteStory:', error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};
