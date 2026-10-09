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
import { getUserById } from '../../models/notification.model.js';
import { sendNotificationToUser } from '../../services/notification.service.js';
import { sendEmail } from '../../utils/emailService.js';

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

        // Trigger in-app notification, push notification, and email asynchronously
        const supportTicket = Array.isArray(support) ? support[0] : support;
        const targetUserId = supportTicket?.user_id || supportTicket?.userId;
        if (targetUserId) {
            (async () => {
                try {
                    const user = await getUserById(targetUserId);
                    if (user) {
                        // 1. Send In-App & Firebase Push Notification
                        await sendNotificationToUser(targetUserId, {
                            titleKey: 'SUPPORT_TICKET_RESOLVED',
                            bodyKey: 'SUPPORT_TICKET_RESOLVED_BODY',
                            category: 'transactional',
                            params: {
                                ticketId: id,
                                response: admin_response
                            },
                            data: {
                                type: 'support_resolved',
                                category: 'transactional',
                                ticketId: String(id),
                                status: 'resolved'
                            }
                        });

                        // 2. Send Branded Resolution Email
                        if (user.email) {
                            const userName = user.fullName || 'User';
                            const ticketId = id;
                            const userIssue = supportTicket.issue || 'N/A';
                            const resolution = admin_response;

                            const emailSubject = `[CarZone Support] Your ticket #${ticketId} has been resolved`;
                            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Resolved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CarZone</h1>
              <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 14px;">Customer Help &amp; Support</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <!-- Status Badge -->
              <div style="text-align: center; margin-bottom: 25px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 600; font-size: 13px; padding: 6px 16px; border-radius: 20px; border: 1px solid #a7f3d0;">
                  &#10004; Ticket Resolved
                </span>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                Hello ${userName},
              </h2>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Great news! Your support ticket has been reviewed and resolved by our administration team.
              </p>

              <!-- Ticket Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Ticket ID</span>
                    <div style="color: #111827; font-size: 15px; font-weight: 600; margin-top: 4px;">#${ticketId}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Your Reported Issue</span>
                    <div style="color: #374151; font-size: 14px; margin-top: 4px; line-height: 1.5;">${userIssue}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; background-color: #f0fdf4; border-bottom: none; border-radius: 0 0 8px 8px;">
                    <span style="color: #047857; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Admin Response / Solution</span>
                    <div style="color: #065f46; font-size: 15px; font-weight: 500; margin-top: 6px; line-height: 1.6; white-space: pre-wrap;">${resolution}</div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                If your issue has not been fully resolved or if you have any follow-up questions, feel free to submit a new inquiry via the CarZone app.
              </p>

              <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #111827;">CarZone Support Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; 2026 CarZone. All rights reserved.<br>
                This is an automated notification regarding your CarZone support ticket.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
                            `;

                            const userEmail = user.email;

                            await sendEmail({
                                to: userEmail,
                                subject: emailSubject,
                                html: emailHtml
                            });
                        }
                    }
                } catch (notifyErr) {
                    console.error("Error sending support resolution notification/email:", notifyErr);
                }
            })();
        }

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
