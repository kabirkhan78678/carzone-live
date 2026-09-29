import { body, query, param } from 'express-validator';

export const scheduleVisitValidation = [
  body('seller_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('seller_id must be a numeric value'),

  body('car_id')
    .notEmpty().withMessage('car_id is required')
    .isNumeric().withMessage('car_id must be a numeric value'),

  // body('preferred_date')
  //   .notEmpty().withMessage('preferred_date is required')
  //   .matches(/^\d{2}-\d{2}-\d{4}$/).withMessage('preferred_date must be in DD-MM-YYYY format'),

  // body('preferred_time')
  //   .notEmpty().withMessage('preferred_time is required')
  //   .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i).withMessage('preferred_time must be in hh:mm AM/PM format'),

  body('buyer_notes')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('buyer_notes must be a string')
];

export const scheduleRequestListValidation = [
  query('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['pending', 'approved', 'rescheduled', 'rejected', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),

  query('page')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('limit must be a positive integer')
];

export const scheduleRequestIdValidation = [
  query('id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('id must be a numeric value'),
  param('id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('id must be a numeric value')
];

export const scheduleRequestActionValidation = [
  param('id')
    .notEmpty().withMessage('Request ID is required')
    .isNumeric().withMessage('Request ID must be a numeric value'),

  body('action')
    .notEmpty().withMessage('action is required')
    .isIn(['approve', 'reject', 'reschedule', 'confirm', 'cancelled', 'completed'])
    .withMessage('action must be valid action'),

  // body('preferred_date')
  //   .if(body('action').equals('reschedule'))
  //   .notEmpty().withMessage('preferred_date is required when action is reschedule')
  //   .matches(/^\d{2}-\d{2}-\d{4}$/).withMessage('preferred_date must be in DD-MM-YYYY format'),

  // body('preferred_time')
  //   .if(body('action').equals('reschedule'))
  //   .notEmpty().withMessage('preferred_time is required when action is reschedule')
  //   .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i).withMessage('preferred_time must be in hh:mm AM/PM format'),

  body('seller_note')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('seller_note must be a string')
];

export const rescheduleRequestActionValidation = [
  param('id')
    .notEmpty().withMessage('Request ID is required')
    .isNumeric().withMessage('Request ID must be a numeric value'),

  // body('preferred_date')
  //   .notEmpty().withMessage('preferred_date is required')
  //   .matches(/^\d{2}-\d{2}-\d{4}$/).withMessage('preferred_date must be in DD-MM-YYYY format'),

  // body('preferred_time')
  //   .notEmpty().withMessage('preferred_time is required')
  //   .matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i).withMessage('preferred_time must be in hh:mm AM/PM format'),

  body('seller_note')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('seller_note must be a string')
];

export const getFreeDemoVallidations = [
  body('fullName').notEmpty().withMessage('Full Name is required').isString().withMessage('Full Name must be a string'),
  body('phoneNumber').notEmpty().withMessage('Phone Number is required'),
  body('businessEmail').notEmpty().withMessage('Business Email is required').isEmail().withMessage('Must be a valid email address'),
  body('companyName').notEmpty().withMessage('Company Name is required').isString().withMessage('Company Name must be a string'),
  body('companySize').notEmpty().withMessage('Company Size is required'),
  body('jobTitle').notEmpty().withMessage('Job Title is required')
];

export const tellAboutUsVallidations = [
  body('yourRole').notEmpty().withMessage('Your Role is required'),
  body('softwareDelivered').notEmpty().withMessage('Software Delivered is required'),
  body('spend').notEmpty().withMessage('Spend is required'),
  body('softwareCategories').notEmpty().withMessage('Software Categories are required')
];

// export const scheduledDateAndTimeVallidations = [
//   body('scheduledTime').notEmpty().withMessage('Scheduled Time is required'),
//   body('scheduledDate').notEmpty().withMessage('Scheduled Date is required')
// ];

export const billingFormValidation = [
  body('customer_type').notEmpty().withMessage('Customer type is required').isIn(['individual', 'company']).withMessage('Invalid customer type'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email address'),
  body('phone').notEmpty().withMessage('Phone Number is required')
];

export const createPostValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required')
];

export const supportVallidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Must be a valid email address'),
  body('message').notEmpty().withMessage('Message is required')
];