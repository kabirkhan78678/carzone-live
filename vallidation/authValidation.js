import { body } from 'express-validator';

export const userSignUp = [
  body('account_type')
    .notEmpty().withMessage('Account type is required.')
    .isIn(['private', 'company']).withMessage("Account type must be 'private' or 'company'."),

  body('email')
    .notEmpty().withMessage('Email cannot be empty.')
    .isEmail().withMessage('Invalid email address.'),

  body('language')
    .notEmpty().withMessage('Language is required.')
    .isIn(['en', 'fr', 'de', 'it']).withMessage('Unsupported language.'),

  body('password')
    .notEmpty().withMessage('Password cannot be empty.')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters.'),

  body('fullName')
    .if(body('account_type').equals('private'))
    .notEmpty().withMessage('Full name is required for private accounts.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),

  body('confirm_password')
    .if(body('account_type').equals('private'))
    .notEmpty().withMessage('Confirm password is required for private accounts.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password and confirm password do not match.');
      }
      return true;
    }),

  body('companyName')
    .if(body('account_type').equals('company'))
    .notEmpty().withMessage('Company name is required.'),

  body('commercialRegisterNumber')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Commercial register number must be a string.'),

  body('companyAddress')
    .if(body('account_type').equals('company'))
    .notEmpty().withMessage('Company address is required.')
    .isString().withMessage('Company address must be a string.'),

  body('city')
    .if(body('account_type').equals('company'))
    .notEmpty().withMessage('City is required.'),

  body('postalCode')
    .if(body('account_type').equals('company'))
    .notEmpty().withMessage('Postal code is required.'),

  body('businessPhone')
    .if(body('account_type').equals('company'))
    .notEmpty().withMessage('Business phone number is required.'),

  body('mobilePhone')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Mobile phone number must be a string.'),

  body('whatsappNumber')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('WhatsApp number must be a string.')
];

export const userSignIn = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be valid'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 4 }).withMessage('Password should be at least 4 characters long'),

  body('language')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['en', 'fr', 'de', 'it']).withMessage('Unsupported language.')
];

export const emailVallidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
];

export const otpVerifiedValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  body('otp')
    .notEmpty().withMessage('OTP is required')
];

export const passwordVallidate = [
  body('password')
    .notEmpty().withMessage('Password Must Be Required')
    .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long'),
  body('confirm_password')
    .notEmpty().withMessage('Confirm Password Must Be Required')
    .isLength({ min: 8 }).withMessage('Password Should Be At Least 8 Characters Long')
];

export const passwordChange = [
  body('old_password')
    .notEmpty().withMessage('Old Password Must Be Required')
    .isLength({ min: 4 }).withMessage('Password Should Be At Least 4 Characters Long'),

  body('new_password')
    .notEmpty().withMessage('New Password Is Required')
    .isLength({ min: 4 }).withMessage('Password Should Be At Least 4 Characters Long'),

  body('confirm_password')
    .notEmpty().withMessage('Confirm Password Is Required')
    .isLength({ min: 4 }).withMessage('Password Should Be At Least 4 Characters Long')
];

export const resetPasswordValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  body('newPassword')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4 }).withMessage('Password Should Be At Least 4 Characters Long'),
  body('password')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 4 }).withMessage('Password Should Be At Least 4 Characters Long')
];

export const socialLoginValidation = [
  body('provider')
    .notEmpty().withMessage('Provider is required')
    .isIn(['google', 'apple', 'facebook']).withMessage('Invalid provider'),

  body('provider_id')
    .notEmpty().withMessage('Provider ID is required'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Must be a valid email address'),

  body('fullName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Full Name must be a string')
];