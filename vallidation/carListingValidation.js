import { body, param } from 'express-validator';

export const listCarValidation = [
  body('brand_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Brand ID must be a numeric value.'),

  body('model_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Model ID must be a numeric value.'),

  body('totalPrice')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Total price must be a numeric value.'),

  body('registration_year')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Registration year must be a numeric value.')
];

export const updateCarValidation = [
  param('carId')
    .notEmpty().withMessage('Car ID is required.')
    .isNumeric().withMessage('Car ID must be a numeric value.'),
  body('totalPrice')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Total price must be a numeric value.')
];

export const deleteCarImageValidation = [
  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('image_url must be a string.'),
  body('url')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('url must be a string.')
];

export const vrnValidation = [
  body('vrn')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('VRN must be a string.'),
  body('licensePlate')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('licensePlate must be a string.')
];

export const carVerticalValidation = [
  // body('car_id')
  //   .notEmpty().withMessage('car_id is required.')
  //   .isNumeric().withMessage('car_id must be a numeric value.')
];

export const leasingCalculateValidation = [
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isNumeric().withMessage('Price must be a numeric value.'),
  body('duration')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Duration must be a numeric value.'),
  body('down_payment')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Down payment must be a numeric value.')
];

export const descriptionAwsRecognitionValidation = [
  body('text')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('text must be a string.')
];