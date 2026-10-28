import express from 'express';
import {
  createStory,
  getActiveStories,
  markStoryViewed,
  getMyStories,
  getStoryById,
  deleteStory
} from '../controllers/user_controller.js';
import { authenticateUser, optionalAuthenticateUser } from '../middleware/userAuth.js';
import { uploadProfile } from '../middleware/upload.js';
import {
  handleValidationErrors,
  storyIdParamValidation,
  createStoryValidation
} from '../vallidation/index.js';

const router = express.Router();

const storyUploadConfig = uploadProfile.fields([
  { name: 'image', maxCount: 1 },
  { name: 'storyImage', maxCount: 1 },
  { name: 'media', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

/**
 * @route   GET /stories
 * @desc    Fetch active stories grouped by user with seen/unseen status
 * @access  Optional Auth / Public (returns is_seen for logged-in user)
 */
router.get('/', optionalAuthenticateUser, getActiveStories);

/**
 * @route   POST /stories
 * @desc    Create a new story (image upload or image URL)
 * @access  Authenticated
 */
router.post(
  '/',
  authenticateUser,
  storyUploadConfig,
  createStoryValidation,
  handleValidationErrors,
  createStory
);

/**
 * @route   GET /stories/my-stories
 * @desc    Fetch logged-in user's active stories with viewers list
 * @access  Authenticated
 */
router.get('/my-stories', authenticateUser, getMyStories);

/**
 * @route   GET /stories/:id
 * @desc    Fetch single story details
 * @access  Optional Auth
 */
router.get(
  '/:id',
  optionalAuthenticateUser,
  storyIdParamValidation,
  handleValidationErrors,
  getStoryById
);

/**
 * @route   POST /stories/:id/views
 * @desc    Mark a story as viewed by logged-in user
 * @access  Authenticated
 */
router.post(
  '/:id/views',
  authenticateUser,
  storyIdParamValidation,
  handleValidationErrors,
  markStoryViewed
);

/**
 * @route   DELETE /stories/:id
 * @desc    Delete logged-in user's story
 * @access  Authenticated
 */
router.delete(
  '/:id',
  authenticateUser,
  storyIdParamValidation,
  handleValidationErrors,
  deleteStory
);

export default router;
