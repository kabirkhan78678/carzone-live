import { variableTypes } from '../../utils/constant.js';
import {
    getAppFeedbackListModel,
    getAppFeedbackByIdModel,
    deleteAppFeedbackModel,
    getHelpRequestsListModel,
    getHelpRequestByIdModel,
    deleteHelpRequestModel,
    getSupportListModel,
    getSupportByIdModel,
    updateSupportModel,
    deleteSupportModel,
    fetchSupportById
} from '../../models/admin.model.js';
import { handleSuccessNew, handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/* =========================================================================
   APP FEEDBACK (ADMIN)
   ========================================================================= */

export const getAppFeedback = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);

        const {
            search = "",
            account_type = ""
        } = req.query;

        const feedback = await getAppFeedbackListModel({
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
                total: feedback.total,
                page,
                limit,
                totalPages: Math.ceil(feedback.total / limit),
                data: feedback.data
            }
        );

    } catch (error) {
        console.error("getAppFeedback error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getAppFeedbackById = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const { id } = req.params;

        const feedback = await getAppFeedbackByIdModel(id);

        if (!feedback) {
            return handleError(
                res,
                404,
                "Feedback not found"
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            feedback
        );

    } catch (error) {
        console.error("getAppFeedbackById error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const deleteAppFeedback = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const { id } = req.params;

        const feedback = await getAppFeedbackByIdModel(id);

        if (!feedback) {
            return handleError(
                res,
                404,
                "Feedback not found"
            );
        }

        await deleteAppFeedbackModel(id);

        return handleSuccess(
            res,
            200,
            "Feedback deleted successfully",
            null
        );

    } catch (error) {
        console.error("deleteAppFeedback error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

/* =========================================================================
   HELP REQUESTS (ADMIN)
   ========================================================================= */

export const getHelpRequests = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);
        const { search = "" } = req.query;

        const helpData = await getHelpRequestsListModel({
            page,
            limit,
            search
        });

        return handleSuccessNew(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            {
                total: helpData.total,
                page,
                limit,
                totalPages: Math.ceil(helpData.total / limit),
                data: helpData.data
            }
        );

    } catch (error) {
        console.error("getHelpRequests error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getHelpRequestById = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const { id } = req.params;

        const helpRequest = await getHelpRequestByIdModel(id);

        if (!helpRequest) {
            return handleError(
                res,
                404,
                "Help request not found"
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            helpRequest
        );

    } catch (error) {
        console.error("getHelpRequestById error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const deleteHelpRequest = async (req, res) => {
    const lang = req.user?.language || "en";

    try {
        const { id } = req.params;

        const helpRequest = await getHelpRequestByIdModel(id);

        if (!helpRequest) {
            return handleError(
                res,
                404,
                "Help request not found"
            );
        }

        await deleteHelpRequestModel(id);

        return handleSuccess(
            res,
            200,
            "Help request deleted successfully",
            null
        );

    } catch (error) {
        console.error("deleteHelpRequest error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

/* =========================================================================
   SUPPORT TICKETS (ADMIN)
   ========================================================================= */

export const getSupportList = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);
        const {
            search = "",
            status = "",
            account_type = ""
        } = req.query;

        const support = await getSupportListModel({
            page,
            limit,
            search,
            status,
            account_type
        });

        return handleSuccessNew(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            {
                total: support.total,
                page,
                limit,
                totalPages: Math.ceil(
                    support.total / limit
                ),
                data: support.data
            }
        );

    } catch (error) {
        console.error("getSupportList error:", error);
        return handleError(
            res,
            500,
            getMessage(req.user?.language || "en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getSupportById = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const { id } = req.params;
        const support = await getSupportByIdModel(id);
        if (!support) {
            return handleError(
                res,
                404,
                "Support not found"
            );
        }
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            support
        );
    } catch (error) {
        console.error("getSupportById error:", error);
        return handleError(
            res,
            500,
            getMessage(req.user?.language || "en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const updateSupport = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const { id } = req.params;
        const {
            admin_response
        } = req.body;
        const support = await fetchSupportById(id);
        if (!support || !support.length) {
            return handleError(
                res,
                404,
                "Support not found"
            );
        }

        if (!admin_response) {
            return handleError(
                res,
                400,
                "Response is required"
            );
        }

        await updateSupportModel({
            id,
            admin_response
        });

        return handleSuccess(
            res,
            200,
            "Support resolved successfully",
            null
        );
    } catch (error) {
        console.error("updateSupport error:", error);
        return handleError(
            res,
            500,
            getMessage(
                req.user?.language || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

export const deleteSupport = async (req, res) => {
    try {
        const { id } = req.params;
        const support = await fetchSupportById(id);
        if (!support || !support.length) {
            return handleError(
                res,
                404,
                "Support not found"
            );
        }
        await deleteSupportModel(id);
        return handleSuccess(
            res,
            200,
            "Support deleted successfully",
            null
        );
    } catch (error) {
        console.error("deleteSupport error:", error);
        return handleError(
            res,
            500,
            getMessage(
                req.user?.language || "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};
