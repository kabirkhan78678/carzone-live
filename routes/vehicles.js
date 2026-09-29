import express from 'express';
import carApiService from '../services/carApiService.js';
import {
    handleValidationErrors,
    vehicleByVinValidation,
    vehicleByModelValidation,
    vehicleSearchValidation
} from '../vallidation/index.js';
import { handleError, handleSuccess } from '../utils/responseHandler.js';
import { getMessage } from '../utils/user_helper.js';
import { variableTypes } from '../utils/constant.js';

const router = express.Router();

// Get all brands
router.get('/brands', async (req, res) => {
    const lang = req.user?.language || 'en';
    try {
        const result = await carApiService.getAllBrands();
        if (result.success) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY), result.data || result, lang);
        } else {
            return handleError(res, 400, result.message || getMessage(lang, variableTypes.FAILED_TO_FETCH_BRANDS), lang);
        }
    } catch (error) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR), lang);
    }
});

// Get models by brand
router.get('/models/:brand', async (req, res) => {
    const lang = req.user?.language || 'en';
    try {
        const { brand } = req.params;
        const { year } = req.query;

        const result = await carApiService.getModelsByBrand(brand, year);
        if (result.success) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY), result.data || result, lang);
        } else {
            return handleError(res, 400, result.message || getMessage(lang, variableTypes.FAILED_TO_FETCH_MODELS), lang);
        }
    } catch (error) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR), lang);
    }
});

// Get vehicle by VIN
router.get('/vin/:vin', vehicleByVinValidation, handleValidationErrors, async (req, res) => {
    const lang = req.user?.language || 'en';
    try {
        const { vin } = req.params;
        const result = await carApiService.getVehicleByVIN(vin);

        if (result.success) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY), result.data || result, lang);
        } else {
            return handleError(res, 400, result.message || getMessage(lang, variableTypes.FAILED_TO_FETCH_VEHICLE_BY_VIN), lang);
        }
    } catch (error) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR), lang);
    }
});

router.get('/details/:brand/:model/:year', vehicleByModelValidation, handleValidationErrors, async (req, res) => {
    const lang = req.user?.language || 'en';
    try {
        const { brand, model, year } = req.params;
        const result = await carApiService.getVehicleByModel(brand, model, year);

        if (result.success) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY), result.data || result, lang);
        } else {
            return handleError(res, 400, result.message || getMessage(lang, variableTypes.FAILED_TO_FETCH_VEHICLE_DETAILS), lang);
        }
    } catch (error) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR), lang);
    }
});

// Search available models by brand and year
router.get('/search', vehicleSearchValidation, handleValidationErrors, async (req, res) => {
    const lang = req.user?.language || 'en';
    try {
        const { brand, year } = req.query;
        const result = await carApiService.getModels(brand, year || '2020');

        if (result.success) {
            return handleSuccess(res, 200, getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY), result.data || result, lang);
        } else {
            return handleError(res, 400, result.message || getMessage(lang, variableTypes.SEARCH_FAILED), lang);
        }
    } catch (error) {
        return handleError(res, 500, getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR), lang);
    }
});

export default router;