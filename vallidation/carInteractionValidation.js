import { body, query, param } from 'express-validator';

export const addToWishlistValidation = [
  body('car_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('car_id must be a numeric value.'),
  body('carId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('carId must be a numeric value.')
];

export const removeWishlistValidation = [
  body('car_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('car_id must be a numeric value.'),
  body('carId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('carId must be a numeric value.'),
  query('car_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('car_id must be a numeric value.'),
  query('carId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('carId must be a numeric value.')
];

export const carInquiryValidation = [
  // body('car_id')
  //   .notEmpty().withMessage('car_id is required.')
  //   .isNumeric().withMessage('car_id must be a numeric value.'),
  body('message')
    .notEmpty().withMessage('Message is required.')
    .isString().withMessage('Message must be a string.')
];

export const saveCarReelsValidation = [
  body('reel_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('reel_id must be a numeric value.'),
  body('car_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('car_id must be a numeric value.')
];

export const deleteReelValidation = [
  query('reel_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('reel_id must be a numeric value.'),
  query('reelType')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('reelType must be a string.')
];

export const removeSavedCarReelsValidation = [
  body('carId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('carId must be a numeric value.')
];

export const recentlyViewedValidation = [
  // body('car_id')
  //   .notEmpty().withMessage('car_id is required.')
  //   .isNumeric().withMessage('car_id must be a numeric value.')
];

export const notificationIdValidation = [
  body('id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('ID must be a numeric value.'),
  body('notification_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Notification ID must be a numeric value.'),
  body('notificationId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Notification ID must be a numeric value.')
];

export const chatNotificationValidation = [
  body('user_id')
    .notEmpty().withMessage('user_id is required.'),
  body('body')
    .notEmpty().withMessage('Message body is required.')
];

export const reportCarValidation = [
  body('car_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('car_id must be a numeric value'),

  body('comments')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('comments must be a string')
];

export const reportReasonsValidation = [
  query('lang')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['en', 'fr', 'de', 'it']).withMessage('lang must be en, fr, de, or it')
];