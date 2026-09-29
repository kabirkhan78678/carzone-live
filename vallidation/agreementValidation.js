import { body, param } from 'express-validator';
import Joi from 'joi';

// =========================================================================
// 1. EXPRESS-VALIDATOR RULES (Standard Route Middleware)
// =========================================================================

/**
 * Validation middleware for creating a Purchase Agreement from vehicle listing.
 * Route: POST /vehicles/:vehicleId/purchase-agreement
 */
export const createPurchaseAgreementValidation = [
  param('vehicleId')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric().withMessage('Vehicle ID must be a numeric value.'),

  // Seller Information
  body('seller_fullName')
    .optional({ nullable: true })
    .isString().withMessage('seller_fullName must be a string.'),

  body('seller_company_name')
    .optional({ nullable: true })
    .isString().withMessage('seller_company_name must be a string.'),

  body('seller_dateOfBirth')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('seller_dateOfBirth must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('seller_dateOfBirth must be a valid date.');
      }
      return true;
    }),

  body('seller_fullAddress')
    .optional({ nullable: true })
    .isString().withMessage('seller_fullAddress must be a string.'),

  body('seller_phoneNumber')
    .optional({ nullable: true })
    .isString().withMessage('seller_phoneNumber must be a string.'),

  body('seller_countryCode')
    .optional({ nullable: true })
    .isString().withMessage('seller_countryCode must be a string.'),

  body('seller_pincode')
    .optional({ nullable: true })
    .isString().withMessage('seller_pincode must be a string.'),

  body('seller_city')
    .optional({ nullable: true })
    .isString().withMessage('seller_city must be a string.'),

  body('seller_contact_person')
    .optional({ nullable: true })
    .isString().withMessage('seller_contact_person must be a string.'),

  body('seller_is_legal_owner')
    .optional({ nullable: true })
    .isBoolean().withMessage('seller_is_legal_owner must be a boolean (true/false or 1/0).'),

  // Buyer Information (Boundary mapping: accepts frontend payload keys fullName, dateOfBirth, fullAddress, phoneNumber, countryCode, pincode, city or canonical keys full_name, date_of_birth, address, phone)
  body('fullName')
    .optional({ nullable: true })
    .isString().withMessage('fullName must be a string.'),

  body('full_name')
    .optional({ nullable: true })
    .isString().withMessage('full_name must be a string.'),

  body('dateOfBirth')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('dateOfBirth must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('dateOfBirth must be a valid date.');
      }
      return true;
    }),

  body('date_of_birth')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('date_of_birth must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('date_of_birth must be a valid date.');
      }
      return true;
    }),

  body('fullAddress')
    .optional({ nullable: true })
    .isString().withMessage('fullAddress must be a string.'),

  body('address')
    .optional({ nullable: true })
    .isString().withMessage('address must be a string.'),

  body('phoneNumber')
    .optional({ nullable: true })
    .isString().withMessage('phoneNumber must be a string.'),

  body('phone')
    .optional({ nullable: true })
    .isString().withMessage('phone must be a string.'),

  body('countryCode')
    .optional({ nullable: true })
    .isString().withMessage('countryCode must be a string.'),

  body('pincode')
    .optional({ nullable: true })
    .isString().withMessage('pincode must be a string.'),

  body('city')
    .optional({ nullable: true })
    .isString().withMessage('city must be a string.'),

  // Vehicle Snapshot (Canonical & Frontend Keys - ALL OPTIONAL)
  body('make')
    .optional({ nullable: true })
    .isString().withMessage('make must be a string.'),

  body('brandName')
    .optional({ nullable: true })
    .isString().withMessage('brandName must be a string.'),

  body('model')
    .optional({ nullable: true })
    .isString().withMessage('model must be a string.'),

  body('carModel')
    .optional({ nullable: true })
    .isString().withMessage('carModel must be a string.'),

  body('body_type')
    .optional({ nullable: true })
    .isString().withMessage('body_type must be a string.'),

  body('color')
    .optional({ nullable: true })
    .isString().withMessage('color must be a string.'),

  body('exterior_color_custom')
    .optional({ nullable: true })
    .isString().withMessage('exterior_color_custom must be a string.'),

  body('engine_displacement')
    .optional({ nullable: true })
    .isString().withMessage('engine_displacement must be a string.'),

  body('cubic_capacity')
    .optional({ nullable: true })
    .custom((val) => {
      if (val !== null && val !== undefined && val !== '' && isNaN(Number(String(val).replace(/[^0-9]/g, '')))) {
        throw new Error('cubic_capacity must be a numeric value.');
      }
      return true;
    }),

  body('power')
    .optional({ nullable: true })
    .isString().withMessage('power must be a string.'),

  body('powerOutput')
    .optional({ nullable: true })
    .isString().withMessage('powerOutput must be a string.'),

  body('transmission')
    .optional({ nullable: true })
    .isString().withMessage('transmission must be a string.'),

  body('vin')
    .optional({ nullable: true })
    .isString().withMessage('vin must be a string.'),

  body('vin_number')
    .optional({ nullable: true })
    .isString().withMessage('vin_number must be a string.'),

  body('stammnummer')
    .optional({ nullable: true })
    .isString().withMessage('stammnummer must be a string.'),

  body('registration_master_number')
    .optional({ nullable: true })
    .isString().withMessage('registration_master_number must be a string.'),

  body('type_approval_number')
    .optional({ nullable: true })
    .isString().withMessage('type_approval_number must be a string.'),

  body('type_approval')
    .optional({ nullable: true })
    .isString().withMessage('type_approval must be a string.'),

  body('first_registration_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})[-./](\d{2})[-./](\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})[-./](\d{2})[-./](\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('first_registration_date must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('first_registration_date must be a valid date.');
      }
      return true;
    }),

  body('firstRegistrationDate')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})[-./](\d{2})[-./](\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})[-./](\d{2})[-./](\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('firstRegistrationDate must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('firstRegistrationDate must be a valid date.');
      }
      return true;
    }),

  body('mileage')
    .optional({ nullable: true })
    .custom((val) => {
      if (val !== null && val !== undefined && val !== '' && isNaN(Number(String(val).replace(/[^0-9]/g, '')))) {
        throw new Error('mileage must be a numeric value.');
      }
      return true;
    }),

  body('carMileage')
    .optional({ nullable: true })
    .custom((val) => {
      if (val !== null && val !== undefined && val !== '' && isNaN(Number(String(val).replace(/[^0-9]/g, '')))) {
        throw new Error('carMileage must be a numeric value.');
      }
      return true;
    }),

  body('last_mfk_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('last_mfk_date must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('last_mfk_date must be a valid date.');
      }
      return true;
    }),

  // Purchase & Condition Checklist
  body('purchase_price')
    .optional({ nullable: true })
    .isNumeric().withMessage('purchase_price must be a numeric value.')
    .custom((val) => {
      if (val !== null && val !== undefined && Number(val) < 0) {
        throw new Error('purchase_price cannot be negative.');
      }
      return true;
    }),

  body('second_key_available')
    .optional({ nullable: true })
    .isBoolean().withMessage('second_key_available must be a boolean.'),

  body('accident_free')
    .optional({ nullable: true })
    .isBoolean().withMessage('accident_free must be a boolean.'),

  body('vehicle_remarks')
    .optional({ nullable: true })
    .isString().withMessage('vehicle_remarks must be a string.'),

  body('defects_known')
    .optional({ nullable: true })
    .isBoolean().withMessage('defects_known must be a boolean.'),

  body('defect_remarks')
    .optional({ nullable: true })
    .isString().withMessage('defect_remarks must be a string.'),

  body('service_book_available')
    .optional({ nullable: true })
    .isBoolean().withMessage('service_book_available must be a boolean.'),

  body('service_book_remarks')
    .optional({ nullable: true })
    .isString().withMessage('service_book_remarks must be a string.'),

  // Warranty / Liability
  body('warranty_type')
    .optional({ nullable: true })
    .isIn(['EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER'])
    .withMessage("warranty_type must be one of 'EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER'."),

  body('warranty_other_text')
    .optional({ nullable: true })
    .isString().withMessage('warranty_other_text must be a string.')
    .custom((value, { req }) => {
      if (value && req.body.warranty_type !== 'OTHER') {
        throw new Error("warranty_other_text is only permitted when warranty_type is 'OTHER'.");
      }
      return true;
    }),

  // Payment Terms
  body('payment_type')
    .optional({ nullable: true })
    .isString().withMessage('payment_type must be a string.'),

  body('payment_other_text')
    .optional({ nullable: true })
    .isString().withMessage('payment_other_text must be a string.'),

  // Vehicle Handover
  body('handover_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (!val) return true;
      const str = String(val).trim();
      const ddMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      const yyyyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!ddMatch && !yyyyMatch) {
        throw new Error('handover_date must be a valid date (DD-MM-YYYY or YYYY-MM-DD).');
      }
      const day = Number(ddMatch ? ddMatch[1] : yyyyMatch[3]);
      const month = Number(ddMatch ? ddMatch[2] : yyyyMatch[2]);
      const year = Number(ddMatch ? ddMatch[3] : yyyyMatch[1]);
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        throw new Error('handover_date must be a valid date.');
      }
      return true;
    }),

  body('handover_location')
    .optional({ nullable: true })
    .isString().withMessage('handover_location must be a string.')
];

/**
 * Validation middleware for Purchase Agreement ID parameter.
 */
export const agreementIdValidation = [
  param('id')
    .notEmpty().withMessage('Agreement ID is required.')
    .isNumeric().withMessage('Agreement ID must be a numeric value.')
];

/**
 * Validation middleware for updating an existing Purchase Agreement draft.
 * Route: PUT /purchase-agreements/:id
 */
export const updatePurchaseAgreementValidation = [
  ...agreementIdValidation,
  ...createPurchaseAgreementValidation
];

/**
 * Alias for backward compatibility with route imports.
 */
export const createAgreementValidation = createPurchaseAgreementValidation;
export const addPurchaseAgreementValidation = createPurchaseAgreementValidation;
export const updateAgreementValidation = updatePurchaseAgreementValidation;
export const deleteAgreementValidation = agreementIdValidation;
export const deletePurchaseAgreementValidation = agreementIdValidation;
export const counterAgreementValidation = agreementIdValidation;
export const signAgreementValidation = agreementIdValidation;
export const cancelAgreementValidation = agreementIdValidation;
export const rejectAgreementValidation = agreementIdValidation;

// =========================================================================
// 2. JOI SCHEMAS (Modular Object Validation)
// =========================================================================

/**
 * Joi Schema for creating a Purchase Agreement snapshot.
 */
export const createPurchaseAgreementJoiSchema = Joi.object({
  // Seller Information
  seller_fullName: Joi.string().allow('', null).optional(),
  seller_company_name: Joi.string().allow('', null).optional(),
  seller_dateOfBirth: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),
  seller_fullAddress: Joi.string().allow('', null).optional(),
  seller_phoneNumber: Joi.string().allow('', null).optional(),
  seller_countryCode: Joi.string().allow('', null).optional(),
  seller_pincode: Joi.string().allow('', null).optional(),
  seller_city: Joi.string().allow('', null).optional(),
  seller_contact_person: Joi.string().allow('', null).optional(),
  seller_is_legal_owner: Joi.boolean().allow(null).optional(),

  // Buyer Information (Boundary mapping: accepts frontend payload keys or canonical keys)
  fullName: Joi.string().allow('', null).optional(),
  full_name: Joi.string().allow('', null).optional(),
  dateOfBirth: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),
  date_of_birth: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),
  fullAddress: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  phoneNumber: Joi.string().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  countryCode: Joi.string().allow('', null).optional(),
  pincode: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),

  // Vehicle Snapshot (Canonical & Frontend Keys - All fields optional)
  make: Joi.string().allow('', null).optional(),
  brandName: Joi.string().allow('', null).optional(),
  model: Joi.string().allow('', null).optional(),
  carModel: Joi.string().allow('', null).optional(),
  body_type: Joi.string().allow('', null).optional(),
  color: Joi.string().allow('', null).optional(),
  exterior_color_custom: Joi.string().allow('', null).optional(),
  engine_displacement: Joi.string().allow('', null).optional(),
  cubic_capacity: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).allow(null).optional(),
  power: Joi.string().allow('', null).optional(),
  powerOutput: Joi.string().allow('', null).optional(),
  transmission: Joi.string().allow('', null).optional(),
  vin: Joi.string().allow('', null).optional(),
  vin_number: Joi.string().allow('', null).optional(),
  stammnummer: Joi.string().allow('', null).optional(),
  registration_master_number: Joi.string().allow('', null).optional(),
  type_approval_number: Joi.string().allow('', null).optional(),
  type_approval: Joi.string().allow('', null).optional(),
  first_registration_date: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),
  mileage: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).allow(null).optional(),
  carMileage: Joi.alternatives().try(Joi.number().min(0), Joi.string().allow('')).allow(null).optional(),
  last_mfk_date: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),

  // Purchase & Condition Checklist
  purchase_price: Joi.number().min(0).allow(null).optional(),
  second_key_available: Joi.boolean().allow(null).optional(),
  accident_free: Joi.boolean().allow(null).optional(),
  vehicle_remarks: Joi.string().allow('', null).optional(),
  defects_known: Joi.boolean().allow(null).optional(),
  defect_remarks: Joi.string().allow('', null).optional(),
  service_book_available: Joi.boolean().allow(null).optional(),
  service_book_remarks: Joi.string().allow('', null).optional(),

  // Warranty / Liability
  warranty_type: Joi.string().valid('EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER').allow('', null).optional(),
  warranty_other_text: Joi.string().allow('', null).optional(),

  // Payment Terms
  payment_type: Joi.string().allow('', null).optional(),
  payment_other_text: Joi.string().allow('', null).optional(),

  // Vehicle Handover
  handover_date: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, '').optional(),
  handover_location: Joi.string().allow('', null).optional()
}).unknown(false);

/**
 * Joi Schema for updating an existing Purchase Agreement draft.
 */
export const updatePurchaseAgreementJoiSchema = createPurchaseAgreementJoiSchema;