import { body } from 'express-validator';

export const submitAppFeedbackValidation = [
  body('rating')
    .custom((value, { req }) => {
      const rating = value !== undefined ? value : (req.body.star !== undefined ? req.body.star : req.body.stars);
      if (rating === undefined || rating === null || rating === '') {
        throw new Error('Rating is required.');
      }
      const num = Number(rating);
      if (isNaN(num) || num < 1 || num > 5) {
        throw new Error('Rating must be a numeric value between 1 and 5.');
      }
      return true;
    }),

  body('experience')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Experience must be a string.'),

  body('feedback')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Feedback must be a string.'),

  body('message')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Message must be a string.')
];

export const submitHelpRequestValidation = [
  body('full_name')
    .custom((value, { req }) => {
      const name = value !== undefined ? value : req.body.fullName;
      if (!name || typeof name !== 'string' || !name.trim()) {
        throw new Error('Full name is required.');
      }
      if (name.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters.');
      }
      return true;
    }),

  body('email')
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('describe')
    .custom((value, { req }) => {
      const desc = value !== undefined ? value : (req.body.description !== undefined ? req.body.description : req.body.message);
      if (!desc || typeof desc !== 'string' || !desc.trim()) {
        throw new Error('Description is required.');
      }
      if (desc.trim().length < 5) {
        throw new Error('Description must be at least 5 characters.');
      }
      return true;
    })
];

export const addHelpSupportValidation = [
  body('issue')
    .notEmpty().withMessage('Issue is required.')
    .isString().withMessage('Issue must be a string.')
];