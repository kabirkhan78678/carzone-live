import { body, query } from 'express-validator';

export const editProfileValidation = [
  body('fullName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Full name must be a string.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),

  body('companyName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Company name must be a string.'),

  body('companyAddress')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Company address must be a string.'),

  body('city')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('City must be a string.'),

  body('postalCode')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Postal code must be a string.'),

  body('businessPhone')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Business phone must be a string.'),

  body('mobilePhone')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Mobile phone must be a string.'),

  body('whatsappNumber')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('WhatsApp number must be a string.')
];

export const getUserProfileViewValidation = [
  // query('seller_id')
  //   .notEmpty().withMessage('seller_id is required')
  //   .isNumeric().withMessage('seller_id must be a numeric value')
];

export const changeModeValidation = [
  body('mode')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['buyer', 'seller', 'user']).withMessage('Mode must be buyer or seller'),
  body('account_type')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['private', 'company']).withMessage('Account type must be private or company')
];

export const changeNotificationStatusValidation = [
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([0, 1, '0', '1', true, false]).withMessage('Status must be 0, 1, true, or false'),
  body('isNotification')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([0, 1, '0', '1', true, false]).withMessage('isNotification must be 0, 1, true, or false')
];

export const changeLanguageValidation = [
  body('language')
    .optional({ nullable: true })
    .customSanitizer(val => typeof val === 'string' ? val.toLowerCase() : val)
    .isIn(['en', 'fr', 'de', 'it']).withMessage('Unsupported language.'),
  body('lang')
    .optional({ nullable: true })
    .customSanitizer(val => typeof val === 'string' ? val.toLowerCase() : val)
    .isIn(['en', 'fr', 'de', 'it']).withMessage('Unsupported language.'),
  body().custom((value, { req }) => {
    const lang = req.body?.language || req.body?.lang || req.query?.language || req.query?.lang;
    if (!lang) {
      throw new Error('Language is required.');
    }
    const cleanLang = String(lang).toLowerCase();
    if (!['en', 'fr', 'de', 'it'].includes(cleanLang)) {
      throw new Error('Unsupported language. Supported languages are: en, de, fr, it.');
    }
    return true;
  })
];

export const updateBuyerToSellerValidation = [
  body('account_type')
    .notEmpty().withMessage('Account type is required.')
    .isIn(['private', 'company']).withMessage("Account type must be 'private' or 'company'.")
];

export const addLatLongValidation = [
  body('latitude')
    .notEmpty().withMessage('Latitude is required.')
    .isNumeric().withMessage('Latitude must be a valid number.'),
  body('longitude')
    .notEmpty().withMessage('Longitude is required.')
    .isNumeric().withMessage('Longitude must be a valid number.')
];

export const deleteAccountValidation = [
  body('password')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Password must be a string.')
];