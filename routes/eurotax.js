import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { eurotaxValuationValidation, handleValidationErrors } from '../vallidation/index.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import { getMessage } from '../utils/user_helper.js';
import { variableTypes } from '../utils/constant.js';

dotenv.config();

const router = express.Router();

router.post('/valuation', eurotaxValuationValidation, handleValidationErrors, async (req, res) => {
  const { vin, mileage } = req.body;
  const lang = req.user?.language || 'en';

  try {
    const eurotaxRes = await axios.post(
      'https://api.eurotax.com/valuation',
      {
        vin: vin,
        mileage: mileage,
        countryCode: 'DE',
        currency: 'EUR'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.EUROTAX_API_KEY}`
        }
      }
    );
    return handleSuccess(
      res,
      200,
      getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
      eurotaxRes.data,
      lang
    );
  } catch (error) {
    console.error('Eurotax API error:', error.response?.data || error.message);
    return handleError(
      res,
      500,
      error.response?.data?.message || getMessage(lang, variableTypes.EUROTAX_API_FAILED),
      lang
    );
  }
});

export default router;