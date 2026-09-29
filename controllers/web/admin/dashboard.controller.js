import { variableTypes } from '../../utils/constant.js';
import { getDashboardCountsQuery, fetchLatest3Cars, fetchLatest3Sellers, getUsersSummary, getDashboardModel } from '../../models/admin.model.js';
import { handleSuccess, handleError, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const getDashboardCounts = async (req, res) => {
  try {
    const result = await getDashboardCountsQuery();
    const cars = await fetchLatest3Cars();
    const sellers = await fetchLatest3Sellers();
    return handleSuccess(res, 200, getMessage('en', variableTypes.DASHBOARD_DATA_FETCHED_SUCCESSFULLY),
      {
        ...result,
        cars: cars.length > 0 ? cars : [],
        sellers: sellers.length > 0 ? sellers : []
      }
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const getAdminUsersSummary = async (req, res) => {
  try {
    const purchases = await getUsersSummary();
    return res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase summary",
    });
  }
};

export const getRevenueAndSlotSales = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await getDashboardModel(year);

    return res.status(200).json({
      success: true,
      status: 200,
      data: result
    });
  } catch (error) {
    console.error("Error fetching revenue and slot sales:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
