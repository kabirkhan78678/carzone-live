import { body, param, query } from 'express-validator';

export const adminLoginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 4 }).withMessage('Password must be at least 4 characters long.')
];

export const adminForgotPasswordValidation = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.')
];

export const adminResetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
];

export const adminUpdateProfileValidation = [
  body('firstName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('First name must be a string.'),
  body('lastName')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Last name must be a string.')
];

export const adminChangePasswordValidation = [
  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Email must be a valid email address.'),
  body('new_password')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('confirm_password')
    .notEmpty().withMessage('Confirm password is required.')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('New password and confirm password do not match.');
      }
      return true;
    })
];

export const adminBlockedRoleValidation = [
  body('user_id')
    .notEmpty().withMessage('user_id is required.')
    .isNumeric().withMessage('user_id must be a numeric value.'),
  body('isBlocked')
    .custom((value) => {
      if (value === undefined || value === null || value === '') {
        throw new Error('isBlocked is required.');
      }
      if (![0, 1, '0', '1', true, false, 'true', 'false'].includes(value)) {
        throw new Error('isBlocked must be 0, 1, true, or false.');
      }
      return true;
    })
];

export const adminUpdateSlotRequestStatusValidation = [
  param('id')
    .notEmpty().withMessage('Slot request ID is required.')
    .isNumeric().withMessage('Slot request ID must be a numeric value.'),
  body('action')
    .notEmpty().withMessage('action is required.')
    .isIn(['approved', 'rejected', 'cancelled']).withMessage('action must be approved, rejected, or cancelled.'),
  body('adminMessage')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('adminMessage must be a string.')
];

export const adminChangeMfkCarStatusValidation = [
  body('id')
    .notEmpty().withMessage('Car ID is required.')
    .isNumeric().withMessage('Car ID must be a numeric value.'),
  body('status')
    .notEmpty().withMessage('Status is required.')
    .isIn(['pending', 'approved', 'rejected', 'in_review', 'valid', 'due_soon', 'overdue', 'no_data']).withMessage('Invalid MFK status.')
];

export const adminApproveRejectCompanyValidation = [
  param('id')
    .notEmpty().withMessage('Company user ID is required.')
    .isNumeric().withMessage('Company user ID must be a numeric value.')
];

export const adminEmblemValidation = [
  body('emblem_name')
    .notEmpty().withMessage('Emblem name is required.')
    .isString().withMessage('Emblem name must be a string.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string.')
];

export const adminUpdateEmblemValidation = [
  param('id')
    .notEmpty().withMessage('Emblem ID is required.')
    .isNumeric().withMessage('Emblem ID must be a numeric value.')
];

export const adminUpdateSupportValidation = [
  param('id')
    .notEmpty().withMessage('Support ticket ID is required.')
    .isNumeric().withMessage('Support ticket ID must be a numeric value.'),
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Status must be a string.'),
  body('remarks')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Remarks must be a string.')
];

export const adminUpdateReportStatusValidation = [
  param('id')
    .notEmpty().withMessage('Report ID is required.')
    .isNumeric().withMessage('Report ID must be a numeric value.'),
  body('status')
    .notEmpty().withMessage('Status is required.')
];

export const adminQualitySealValidation = [
  body('name')
    .notEmpty().withMessage('Quality seal name is required.')
    .isString().withMessage('Quality seal name must be a string.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string.')
];

export const adminUpdateQualitySealValidation = [
  param('id')
    .notEmpty().withMessage('Quality seal ID is required.')
    .isNumeric().withMessage('Quality seal ID must be a numeric value.'),
  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Quality seal name must be a string.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Description must be a string.')
];