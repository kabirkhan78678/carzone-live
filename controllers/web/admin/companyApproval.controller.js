import { getCompanyByIdForApproval, updateCompanyActivationStatus, getRoleStatusQuery, blockRoleQuery, getUserById, getPendingCompanies as getPendingCompaniesModel } from '../../models/admin.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { sendEmail } from '../../utils/emailService.js';

export const getPendingCompanies = async (req, res) => {
  try {
    const search = req.query.search || '';
    const companies = await getPendingCompaniesModel(search);

    return handleSuccess(
      res,
      200,
      "Pending companies fetched successfully.",
      companies
    );
  } catch (error) {
    console.error("Error fetching pending companies:", error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || Number.isNaN(Number(id))) {
      return handleError(res, 400, "Valid company id is required.");
    }

    const rows = await getCompanyByIdForApproval(id);
    const company = rows[0];

    if (!company) {
      return handleError(res, 404, "Company not found.");
    }

    if (company.account_type !== 'company') {
      return handleError(res, 400, "This user is not a company account.");
    }

    if (Number(company.is_activated) === 1) {
      return handleError(res, 400, "Company is already approved.");
    }

    if (Number(company.isVerified) !== 1) {
      return handleError(res, 400, "Company email is not verified yet.");
    }

    const result = await updateCompanyActivationStatus(id, 1);

    if (!result.affectedRows) {
      return handleError(res, 400, "Failed to approve company.");
    }

    return handleSuccess(res, 200, "Company approved successfully.");
  } catch (error) {
    console.error("Error approving company:", error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, html } = req.body;

    if (!id || Number.isNaN(Number(id))) {
      return handleError(res, 400, "Valid company id is required.");
    }

    if (!subject || !html) {
      return handleError(res, 400, "Email subject and content are required.");
    }

    const rows = await getCompanyByIdForApproval(id);
    const company = rows[0];

    if (!company) {
      return handleError(res, 404, "Company not found.");
    }

    if (company.account_type !== "company") {
      return handleError(res, 400, "This user is not a company account.");
    }

    if (Number(company.is_activated) === 2) {
      return handleError(res, 400, "Company is already rejected.");
    }

    const result = await updateCompanyActivationStatus(id, 2);

    if (!result.affectedRows) {
      return handleError(res, 400, "Failed to reject company.");
    }

    // Send rejection email using frontend-provided content
    if (company.email) {
      try {
        await sendEmail({
          to: company.email,
          subject,
          html
        });
      } catch (emailErr) {
        console.warn('Rejection email sending failed:', emailErr.message);
      }
    }

    return handleSuccess(res, 200, "Company rejected successfully.");
  } catch (error) {
    console.error("Error rejecting company:", error);
    return handleError(
      res,
      500,
      getMessage("en", variableTypes.INTERNAL_SERVER_ERROR)
    );
  }
};

export const blockedRole = async (req, res) => {
  const { user_id, isBlocked } = req.body;
  try {
    if (!user_id || typeof isBlocked === "undefined") {
      return handleError(res, 400, "user_id and isBlocked are required.");
    }
    const users = await getUserById(user_id);
    if (!users || users.length === 0) {
      return handleError(res, 404, getMessage('en', variableTypes.USER_NOT_FOUND));
    }
    const targetStatus = Number(isBlocked) === 1 ? 1 : 0;
    const existing = await getRoleStatusQuery(user_id);
    if (existing && existing.length > 0) {
      const allMatch = existing.every(item => Number(item.isBlocked) === targetStatus);
      if (allMatch) {
        return res.status(200).json({
          success: true,
          message: `User is already ${targetStatus === 1 ? "blocked" : "unblocked"}.`
        });
      }
    }
    await blockRoleQuery(user_id, undefined, targetStatus);
    return res.status(200).json({
      success: true,
      message: `User ${targetStatus === 1 ? "blocked" : "unblocked"} successfully.`
    });
  } catch (err) {
    console.error("Error in blockedRole:", err);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};
