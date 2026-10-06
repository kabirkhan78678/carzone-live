import express from 'express';
import controller from '../controllers/index.js';
import { authenticateAdmin } from '../middleware/adminAuth.js';
import { uploadProfile } from '../middleware/upload.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  handleValidationErrors,
  idParamValidation,
  sellerIdParamValidation,
  adminLoginValidation,
  adminForgotPasswordValidation,
  adminResetPasswordValidation,
  adminUpdateProfileValidation,
  adminChangePasswordValidation,
  adminBlockedRoleValidation,
  adminUpdateSlotRequestStatusValidation,
  adminChangeMfkCarStatusValidation,
  adminApproveRejectCompanyValidation,
  adminEmblemValidation,
  adminUpdateEmblemValidation,
  adminQualitySealValidation,
  adminUpdateQualitySealValidation,
  adminUpdateSupportValidation,
  adminUpdateReportStatusValidation
} from '../vallidation/index.js';

const fieldsConfig = [
  { name: 'profileImage', maxCount: 1 },
  { name: 'videoThumbnail', maxCount: 1 },
  { name: 'carReel', maxCount: 1 },
  { name: 'carImages', maxCount: 10 },
  { name: 'document', maxCount: 5 },
  { name: 'image', maxCount: 1 }
];

const app = express();

app.post('/loginAdmin', authRateLimiter, adminLoginValidation, handleValidationErrors, controller.adminController.loginAdmin);
app.post('/forgot-password', authRateLimiter, adminForgotPasswordValidation, handleValidationErrors, controller.adminController.forgot_password);
app.get('/reset-password', controller.adminController.render_forgot_password_page);
app.get('/success-reset', controller.adminController.render_success_reset);
app.post('/reset-password', authRateLimiter, adminResetPasswordValidation, handleValidationErrors, controller.adminController.reset_password);
app.get('/getAdminProfile', authenticateAdmin, controller.adminController.getProfile);
app.post('/updateProfile', authenticateAdmin, uploadProfile.fields(fieldsConfig), adminUpdateProfileValidation, handleValidationErrors, controller.adminController.updateProfile);
app.post('/changePassword', authenticateAdmin, adminChangePasswordValidation, handleValidationErrors, controller.adminController.changePasswordd);
app.get('/listallCar', authenticateAdmin, controller.adminController.listAllcars);
app.get('/fetchCarById', authenticateAdmin, controller.adminController.fetchCarById);
app.get('/getSellerAndBuyer', authenticateAdmin, controller.adminController.getAllSellersAndBuyers);
app.get('/getAllPrivateAccounts', authenticateAdmin, controller.adminController.getAllPrivateAccounts);
app.get('/getAllCompanyAccounts', authenticateAdmin, controller.adminController.getAllCompanyAccounts);
app.get('/fetchUserById', authenticateAdmin, controller.adminController.fetchUserById);
app.get('/getSingleBuyer', authenticateAdmin, controller.adminController.getSingleBuyer);
app.get('/getSingleSeller', authenticateAdmin, controller.adminController.getSingleSeller);
app.post('/blocked', authenticateAdmin, adminBlockedRoleValidation, handleValidationErrors, controller.adminController.blockedRole);
app.get('/getdashboard', authenticateAdmin, controller.adminController.getDashboardCounts);
app.get('/getAllPurchases', authenticateAdmin, controller.adminController.getAllUsersWithPurchaseHistory);
app.get('/fetchAllPlans', authenticateAdmin, controller.adminController.fetchAllPlans);
app.get('/getPendingSlotRequests', authenticateAdmin, controller.adminController.getPendingSlotRequests);
app.get('/getAllSlotRequests', authenticateAdmin, controller.adminController.getAllSlotRequests);
app.get('/getSlotRequestsById/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getSlotRequestById);
app.put('/updateSlotRequestStatus/:id', authenticateAdmin, adminUpdateSlotRequestStatusValidation, handleValidationErrors, controller.adminController.updateSlotRequestStatus);
app.put('/changeMfkCarStatus', authenticateAdmin, adminChangeMfkCarStatusValidation, handleValidationErrors, controller.adminController.changeMfkCarStatus);
app.get('/getTransaction-slot-summary', authenticateAdmin, controller.adminController.getAdminUsersSummary);
app.get('/getSlotDetail/:sellerId', authenticateAdmin, sellerIdParamValidation, handleValidationErrors, controller.adminController.fetchSellerSlotDetails);
app.get('/pendingCompanies', authenticateAdmin, controller.adminController.getPendingCompanies);
app.post('/approveCompany/:id', authenticateAdmin, adminApproveRejectCompanyValidation, handleValidationErrors, controller.adminController.approveCompany);
app.post('/rejectCompany/:id', authenticateAdmin, adminApproveRejectCompanyValidation, handleValidationErrors, controller.adminController.rejectCompany);
app.get('/reported-cars', authenticateAdmin, controller.adminController.getReportedCars);
app.get('/get-App-Feedback', authenticateAdmin, controller.adminController.getAppFeedback);
app.get('/app-feedback', authenticateAdmin, controller.adminController.getAppFeedback);
app.get('/app-feedback/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getAppFeedbackById);
app.delete('/app-feedback/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteAppFeedback);
app.get('/help-requests', authenticateAdmin, controller.adminController.getHelpRequests);
app.get('/help-requests/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getHelpRequestById);
app.delete('/help-requests/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteHelpRequest);
app.post('/emblem', authenticateAdmin, uploadProfile.fields(fieldsConfig), adminEmblemValidation, handleValidationErrors, controller.adminController.createEmblem);
app.get('/emblems', authenticateAdmin, controller.adminController.getEmblems);
app.get('/emblem/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getEmblemById);
app.put('/emblem/:id', authenticateAdmin, uploadProfile.fields(fieldsConfig), adminUpdateEmblemValidation, handleValidationErrors, controller.adminController.updateEmblem);
app.delete('/emblem/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteEmblem);
app.post('/quality-seal', authenticateAdmin, uploadProfile.fields(fieldsConfig), adminQualitySealValidation, handleValidationErrors, controller.adminController.createQualitySeal);
app.get('/quality-seals', authenticateAdmin, controller.adminController.getQualitySeals);
app.get('/quality-seal/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getQualitySealById);
app.put('/quality-seal/:id', authenticateAdmin, uploadProfile.fields(fieldsConfig), adminUpdateQualitySealValidation, handleValidationErrors, controller.adminController.updateQualitySeal);
app.delete('/quality-seal/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteQualitySeal);
app.get('/help-support', authenticateAdmin, controller.adminController.getSupportList);
app.get('/help-support/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getSupportById);
app.put('/help-support/:id', authenticateAdmin, adminUpdateSupportValidation, handleValidationErrors, controller.adminController.updateSupport);
app.delete('/help-support/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteSupport);
app.get('/getAllPlan', authenticateAdmin, controller.userController.getAllPlan);
app.get('/reported-car/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getReportedCarById);
app.delete('/reported-car/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.deleteReportedCar);
app.get('/slots-sold-by-package', authenticateAdmin, controller.adminController.getRevenueAndSlotSales);
app.get('/schedule-visits', authenticateAdmin, controller.adminController.getAllScheduleVisits);
app.get('/schedule-visits/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.getScheduleVisitById);
app.put('/report-car/:id/status', authenticateAdmin, adminUpdateReportStatusValidation, handleValidationErrors, controller.adminController.updateReportedCarStatus);
app.post('/rejectCar/:id', authenticateAdmin, idParamValidation, handleValidationErrors, controller.adminController.rejectCarListing);
app.post('/system-notification', authenticateAdmin, controller.adminController.sendSystemAnnouncement);

export default app;