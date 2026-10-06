import {
    checkSellerFeedbackModel,
    submitAppFeedbackModel,
    updateAppFeedbackModel,
    getMyFeedbackModel,
    submitHelpRequestModel,
    createSupportModel,
    getMySupportTicketsModel
} from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const submitAppFeedback = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const seller_id = req.user.id;
        const rawRating = req.body.rating !== undefined ? req.body.rating : (req.body.star !== undefined ? req.body.star : req.body.stars);
        const rating = Number(rawRating);
        const message = req.body.experience !== undefined ? req.body.experience : (req.body.message !== undefined ? req.body.message : (req.body.feedback !== undefined ? req.body.feedback : null));

        /* -------- VALIDATION -------- */
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            return handleError(res, 400, "Rating must be between 1 and 5");
        }

        const cleanMessage = (typeof message === 'string' && message.trim().length > 0) ? message.trim() : null;

        /* -------- CHECK EXISTING FEEDBACK -------- */
        const alreadyGiven = await checkSellerFeedbackModel(seller_id);
        if (alreadyGiven && alreadyGiven.length > 0) {
            await updateAppFeedbackModel({
                seller_id,
                rating,
                message: cleanMessage
            });

            return handleSuccess(
                res,
                200,
                "Feedback updated successfully!",
                {
                    rating,
                    message: cleanMessage
                }
            );
        }

        /* -------- SAVE FEEDBACK -------- */
        await submitAppFeedbackModel({
            seller_id,
            rating,
            message: cleanMessage
        });

        return handleSuccess(
            res,
            201,
            "Thank you for your feedback!",
            {
                rating,
                message: cleanMessage
            }
        );

    } catch (error) {
        console.error("submitAppFeedback error:", error);
        return handleError(res, 500, getMessage(req.user?.language || "en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getMyAppFeedback = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const seller_id = req.user.id;

        const feedback = await getMyFeedbackModel(seller_id);

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            feedback
        );
    } catch (error) {
        console.error("getMyAppFeedback error:", error);
        return handleError(res, 500, getMessage(req.user?.language || "en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const submitHelpRequest = async (req, res) => {
    try {
        const lang = req.user?.language || "en";
        const user_id = req.user?.id || null;
        const full_name = (req.body.full_name || req.body.fullName || req.user?.fullName || '').trim();
        const email = (req.body.email || req.user?.email || '').trim();
        const description = (req.body.describe || req.body.description || req.body.message || req.body.subject || '').trim();

        /* -------- VALIDATION -------- */
        if (!full_name || !email || !description) {
            return handleError(
                res,
                400,
                "Full name, email and description are required"
            );
        }

        /* -------- SAVE HELP REQUEST -------- */
        const result = await submitHelpRequestModel({
            user_id,
            full_name,
            email,
            description
        });

        return handleSuccess(
            res,
            201,
            "Your request has been submitted successfully",
            {
                id: result.insertId,
                full_name,
                email,
                description
            }
        );

    } catch (error) {
        console.error("submitHelpRequest error:", error);
        return handleError(res, 500, getMessage(req.user?.language || "en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

// older but updated code by raj removed full name and email
export const addHelpSupport = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user.language;
        const { issue } = req.body;

        if (!issue || !issue.trim()) {
            return handleError(
                res,
                400,
                "Issue is required"
            );
        }

        await createSupportModel({
            user_id,
            issue
        });

        return handleSuccess(
            res,
            201,
            getMessage(lang, variableTypes.DATA_ADDED_SUCCESSFULLY),
            null
        );

    } catch (error) {
        console.error(error);
        return handleError(
            res,
            500,
            getMessage(req.user.language, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const getMySupportTickets = async (req, res) => {
    try {
        const lang = req.user.language;
        const user_id = req.user.id;
        const tickets = await getMySupportTicketsModel(user_id);
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY),
            tickets
        );

    } catch (error) {
        console.error(error);
        return handleError(
            res,
            500,
            getMessage(req.user.language, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};
