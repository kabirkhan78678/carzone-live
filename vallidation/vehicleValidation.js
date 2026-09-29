import { param, query, body } from 'express-validator';

export const getModelValidation = [
  param('id')
    .notEmpty().withMessage('Brand ID/Name is required.')
    .isString().withMessage('Brand ID/Name must be a string or number.')
];

export const getVariantValidation = [
  param('brandId')
    .notEmpty().withMessage('Brand ID/Name is required.')
    .isString().withMessage('Brand ID/Name must be a string or number.')
];

export const getEngineValidation = [
  param('make')
    .notEmpty().withMessage('Make is required.')
    .isString().withMessage('Make must be a string.'),
  param('model')
    .notEmpty().withMessage('Model is required.')
    .isString().withMessage('Model must be a string.')
];

export const modelsByMakeValidation = [
  param('brand_id')
    .notEmpty().withMessage('brand_id is required.')
    .isNumeric().withMessage('brand_id must be a numeric value.')
];

export const versionsListValidation = [
  query('model_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('model_id must be a numeric value.')
];

export const vehicleByVinValidation = [
  param('vin')
    .notEmpty().withMessage('VIN is required.')
    .isString().withMessage('VIN must be a string.')
];

export const vehicleByModelValidation = [
  param('brand')
    .notEmpty().withMessage('Brand is required.'),
  param('model')
    .notEmpty().withMessage('Model is required.'),
  param('year')
    .notEmpty().withMessage('Year is required.')
];

export const vehicleSearchValidation = [
  query('brand')
    .notEmpty().withMessage('Brand query parameter is required.')
];

export const eurotaxValuationValidation = [
  body('vin')
    .notEmpty().withMessage('VIN is required.')
    .isString().withMessage('VIN must be a string.'),
  body('mileage')
    .notEmpty().withMessage('Mileage is required.')
    .isNumeric().withMessage('Mileage must be a numeric value.')
];

export const catalogVinValidation = [
  query('vin_number')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('vin_number must be a string.'),
  query('vin')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('vin must be a string.')
];

export const catalogTypeApprovalValidation = [
  query('type_approval')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('type_approval must be a string.')
];

export const versionEquipmentValidation = [
  query('fzkey')
    .notEmpty().withMessage('fzkey is required.')
    .isString().withMessage('fzkey must be a string.')
];