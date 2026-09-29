import { variableTypes } from '../../utils/constant.js';
import {
    getReportedCarsModel,
    getReportedCarByIdModel,
    deleteReportedCarModel,
    updateReportedCarStatusModel
} from '../../models/admin.model.js';
import { handleSuccessNew, handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const getReportedCars = async (req, res) => {
    const { language } = "en";
    const lang = language;

    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);

        const {
            search = "",
            account_type = ""
        } = req.query;

        const reports = await getReportedCarsModel({
            page,
            limit,
            search,
            account_type
        });

        return handleSuccessNew(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            {
                total: reports.total,
                page,
                limit,
                totalPages: Math.ceil(reports.total / limit),
                data: reports.data
            }
        );

    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getReportedCarById = async (req, res) => {
    try {
        const lang = "en";
        const { id } = req.params;

        const report = await getReportedCarByIdModel(id);

        if (!report || Object.keys(report).length === 0) {
            return handleError(
                res,
                404,
                "Report not found"
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            report
        );

    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            getMessage("en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const deleteReportedCar = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await getReportedCarByIdModel(id);

        if (!report) {
            return handleError(
                res,
                404,
                "Report not found"
            );
        }

        await deleteReportedCarModel(id);

        return handleSuccess(
            res,
            200,
            "Report deleted successfully",
            null
        );

    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};

export const updateReportedCarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const report = await getReportedCarByIdModel(id);

        if (!report) {
            return handleError(
                res,
                404,
                "Report not found."
            );
        }

        await updateReportedCarStatusModel(id, status);

        return handleSuccess(
            res,
            200,
            "Report status updated successfully."
        );

    } catch (err) {
        console.error(err);
        return handleError(
            res,
            500,
            "Internal server error",
            req.user?.language || "en"
        );
    }
};
