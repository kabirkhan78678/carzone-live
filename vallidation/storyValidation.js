import { param, body } from 'express-validator';

export const storyIdParamValidation = [
  param('id')
    .notEmpty().withMessage('Story ID is required.')
    .isNumeric().withMessage('Story ID must be a numeric value.')
];

export const createStoryValidation = [
  body('caption')
    .optional({ nullable: true })
    .isString().withMessage('Caption must be a string.')
    .isLength({ max: 500 }).withMessage('Caption cannot exceed 500 characters.'),
  body('media_url')
    .optional({ nullable: true })
    .isString().withMessage('media_url must be a string.'),
  body('imageUrl')
    .optional({ nullable: true })
    .isString().withMessage('imageUrl must be a string.')
];
