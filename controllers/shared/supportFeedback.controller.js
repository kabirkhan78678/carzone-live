import { checkSellerFeedbackModel, submitAppFeedbackModel, submitHelpRequestModel, createSupportModel, getMySupportTicketsModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const submitAppFeedback = async (req, res) => {
    try {
        const seller_id = req.user.id;
        const { rating, message } = req.body;

        /* -------- VALIDATION -------- */
        if (!rating || rating < 1 || rating > 5) {
            return handleError(res, 400, "Rating must be between 1 and 5");
        }

        /* -------- CHECK DUPLICATE -------- */
        const alreadyGiven = await checkSellerFeedbackModel(seller_id);
        if (alreadyGiven.length) {
            return handleError(
                res,
                409,
                "Feedback already submitted"
            );
        }

        /* -------- SAVE FEEDBACK -------- */
        await submitAppFeedbackModel({
            seller_id,
            rating,
            message
        });

        return handleSuccess(
            res,
            201,
            "Thank you for your feedback!",
            null
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const submitHelpRequest = async (req, res) => {
    try {
        const user_id = req.user?.id || null;
        const full_name = req.body.full_name || req.body.fullName || req.user?.fullName;
        const email = req.body.email || req.user?.email;
        const description = req.body.description || req.body.message || req.body.subject;

        /* -------- VALIDATION -------- */
        if (!full_name || !email || !description) {
            return handleError(
                res,
                400,
                "Full name, email and description are required"
            );
        }

        /* -------- SAVE HELP REQUEST -------- */
        await submitHelpRequestModel({
            user_id,
            full_name,
            email,
            description
        });

        return handleSuccess(
            res,
            201,
            "Your request has been submitted successfully",
            null
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
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

export const getMySupportTickets = async (
    req,
    res
) => {
    try {
        const lang = req.user.language;
        const user_id = req.user.id;
        const tickets =
            await getMySupportTicketsModel(
                user_id
            );
        return handleSuccess(
            res,
            200,
            getMessage(
                lang,
                variableTypes.DATA_FOUND_SUCCESSFULLY
            ),
            tickets
        );

    } catch (error) {
        console.error(error);
        return handleError(
            res,
            500,
            getMessage(
                req.user.language,
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );

    }

};
