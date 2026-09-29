import { body, param } from 'express-validator';

export const updateNotificationSettingsValidation = [
  body('new_matching_vehicles')
    .optional()
    .isBoolean().withMessage('new_matching_vehicles must be a boolean (true/false, 1/0).'),
  body('price_changes')
    .optional()
    .isBoolean().withMessage('price_changes must be a boolean (true/false, 1/0).'),
  body('favorited_vehicle_updates')
    .optional()
    .isBoolean().withMessage('favorited_vehicle_updates must be a boolean (true/false, 1/0).'),
  body('marketing_promotional')
    .optional()
    .isBoolean().withMessage('marketing_promotional must be a boolean (true/false, 1/0).'),
  body('chat_messages')
    .optional()
    .isBoolean().withMessage('chat_messages must be a boolean (true/false, 1/0).'),
  body('vehicle_inquiries')
    .optional()
    .isBoolean().withMessage('vehicle_inquiries must be a boolean (true/false, 1/0).'),
  body('appointments')
    .optional()
    .isBoolean().withMessage('appointments must be a boolean (true/false, 1/0).'),
  body('listing_updates')
    .optional()
    .isBoolean().withMessage('listing_updates must be a boolean (true/false, 1/0).')
];

export const createSavedSearchValidation = [
  body('search_name')
    .optional({ nullable: true })
    .isString().withMessage('search_name must be a string.'),
  body('brand_id')
    .optional({ nullable: true })
    .isNumeric().withMessage('brand_id must be numeric.'),
  body('car_model_id')
    .optional({ nullable: true })
    .isNumeric().withMessage('car_model_id must be numeric.'),
  body('min_price')
    .optional({ nullable: true })
    .isNumeric().withMessage('min_price must be numeric.'),
  body('max_price')
    .optional({ nullable: true })
    .isNumeric().withMessage('max_price must be numeric.'),
  body('min_year')
    .optional({ nullable: true })
    .isNumeric().withMessage('min_year must be numeric.'),
  body('max_year')
    .optional({ nullable: true })
    .isNumeric().withMessage('max_year must be numeric.'),
  body('max_mileage')
    .optional({ nullable: true })
    .isNumeric().withMessage('max_mileage must be numeric.')
];

export const deleteSavedSearchValidation = [
  param('id')
    .notEmpty().withMessage('id parameter is required.')
    .isNumeric().withMessage('id must be numeric.')
];
