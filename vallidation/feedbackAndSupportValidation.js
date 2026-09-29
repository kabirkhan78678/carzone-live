import { body } from 'express-validator';

export const submitAppFeedbackValidation = [
  body('rating')
    .notEmpty().withMessage('Rating is required.')
    .isNumeric().withMessage('Rating must be a numeric value.'),

  body('feedback')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Feedback must be a string.'),

  body('message')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Message must be a string.')
];

export const submitHelpRequestValidation = [
  body('subject')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Subject must be a string.'),

  body('message')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Message must be a string.')
];

export const addHelpSupportValidation = [
  body('issue')
    .notEmpty().withMessage('Issue is required.')
    .isString().withMessage('Issue must be a string.')
];