import { filterCars, searchCarAccordingToModelAndModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const filterCarList = async (req, res) => {
    try {
        const { id: user_id, language = "en" } = req.user;
        const { search } = req.query;

        const cars = await filterCars({ user_id, search });

        return handleSuccess(res, 200, getMessage(language, variableTypes.DATA_FETCHED_SUCCESSFULLY), cars);
    } catch (error) {
        console.error("Filter car error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const filterCarOnBrandNameOrCarModel = async (req, res) => {
    try {
        // Accept both comma-separated or repeated params
        const brandNames = req.query.brandName
            ? req.query.brandName.split(',')
            : [];
        const carModels = req.query.carModel
            ? req.query.carModel.split(',')
            : [];

        const result = await searchCarAccordingToModelAndModel({ brandNames, carModels });
        return handleSuccess(res, 200,
            getMessage('en', variableTypes.DATA_FETCHED_SUCCESSFULLY),
            result
        );
    } catch (error) {
        return handleError(res, 500, getMessage('en', 'Something went wrong'), error);
    }
};
