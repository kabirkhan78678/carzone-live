import { query } from 'express-validator';

export const filtersValidation = [
  query('lang')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['en', 'fr', 'de', 'it']).withMessage('lang must be en, fr, de, or it')
];

export const yearRangeAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value')
];

export const kilometersRangeAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value')
];

export const priceRangeAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value')
];

export const leasingRangeAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value')
];

export const enginePowerAnalyticsValidation = [
  query('min_power')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min_power must be a numeric value'),
  query('max_power')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max_power must be a numeric value')
];

export const cubicCapacityAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value')
];

export const rangeAnalyticsValidation = [
  query('min')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('min must be a numeric value'),
  query('max')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('max must be a numeric value'),
  query('lang')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['en', 'fr', 'de', 'it']).withMessage('lang must be en, fr, de, or it')
];