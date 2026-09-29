import { body, param } from 'express-validator';

export const purchaseSlotPlanValidation = [
  body('plan_id')
    .notEmpty().withMessage('plan_id is required.')
    .isNumeric().withMessage('plan_id must be a numeric value.')
];

export const requestSlotValidation = [
  body('requested_slots')
    .custom((value, { req }) => {
      const slots = value !== undefined ? value : req.body.requestedSlots;
      if (slots === undefined || slots === null || slots === '') {
        throw new Error('requested_slots is required.');
      }
      const num = Number(slots);
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error('requested_slots must be a positive integer.');
      }
      return true;
    }),
  body('subscription_preference')
    .custom((value, { req }) => {
      const pref = value !== undefined ? value : (req.body.subscriptionPreference || req.body.duration_type || req.body.durationType);
      if (!pref || typeof pref !== 'string') {
        throw new Error('subscription_preference is required.');
      }
      const normalized = pref.trim().toUpperCase();
      if (!['MONTHLY', 'ANNUAL', 'YEARLY'].includes(normalized)) {
        throw new Error('subscription_preference must be MONTHLY or ANNUAL.');
      }
      return true;
    }),
  body('message')
    .optional({ nullable: true })
    .isString().withMessage('message must be a string.'),
  body('description')
    .optional({ nullable: true })
    .isString().withMessage('description must be a string.')
];

export const renewPlanValidation = [
  body('user_plan_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('user_plan_id must be a numeric value.'),
  body('plan_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('plan_id must be a numeric value.')
];

export const renewSummaryValidation = [
  param('user_plan_id')
    .notEmpty().withMessage('user_plan_id is required.')
    .isNumeric().withMessage('user_plan_id must be a numeric value.')
];