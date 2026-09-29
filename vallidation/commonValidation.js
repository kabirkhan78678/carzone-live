import { param, query, validationResult } from 'express-validator';
import { vallidationErrorHandle } from '../utils/responseHandler.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return vallidationErrorHandle(res, errors);
  }
  next();
};

export const idParamValidation = [
  param('id')
    .notEmpty().withMessage('ID is required.')
    .isNumeric().withMessage('ID must be a numeric value.')
];

export const carIdParamValidation = [
  param('carId')
    .notEmpty().withMessage('Car ID is required.')
    .isNumeric().withMessage('Car ID must be a numeric value.')
];

export const carIdParamAltValidation = [
  param('car_id')
    .notEmpty().withMessage('Car ID is required.')
    .isNumeric().withMessage('Car ID must be a numeric value.')
];

export const brandIdParamValidation = [
  param('brandId')
    .notEmpty().withMessage('Brand ID is required.')
    .isNumeric().withMessage('Brand ID must be a numeric value.')
];

export const brandIdParamAltValidation = [
  param('brand_id')
    .notEmpty().withMessage('Brand ID is required.')
    .isNumeric().withMessage('Brand ID must be a numeric value.')
];

export const sellerIdParamValidation = [
  param('sellerId')
    .notEmpty().withMessage('Seller ID is required.')
    .isNumeric().withMessage('Seller ID must be a numeric value.')
];

export const userIdParamValidation = [
  param('userId')
    .notEmpty().withMessage('User ID is required.')
    .isNumeric().withMessage('User ID must be a numeric value.')
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer.')
];