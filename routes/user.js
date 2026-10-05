import express from 'express';
import controller from '../controllers/index.js';
import { getUserProfileweb, listCarweb } from '../controllers/web/user_controller.js';
import { getUserProfilemobile, listCarmobile } from '../controllers/mobile/user_controller.js';
import { getAllMakes, deleteAccount, downloadUserDataController } from '../controllers/user_controller.js';
import { authenticateUser } from '../middleware/userAuth.js';
import { uploadProfile } from '../middleware/upload.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter.js';
import {
  handleValidationErrors,
  idParamValidation,
  carIdParamValidation,
  carIdParamAltValidation,
  userIdParamValidation,
  userSignUp,
  userSignIn,
  emailVallidation,
  otpVerifiedValidation,
  passwordChange,
  resetPasswordValidation,
  socialLoginValidation,
  editProfileValidation,
  getUserProfileViewValidation,
  changeModeValidation,
  changeNotificationStatusValidation,
  changeLanguageValidation,
  updateBuyerToSellerValidation,
  addLatLongValidation,
  listCarValidation,
  updateCarValidation,
  deleteCarImageValidation,
  vrnValidation,
  carVerticalValidation,
  leasingCalculateValidation,
  descriptionAwsRecognitionValidation,
  addToWishlistValidation,
  removeWishlistValidation,
  recentlyViewedValidation,
  carInquiryValidation,
  saveCarReelsValidation,
  deleteReelValidation,
  removeSavedCarReelsValidation,
  notificationIdValidation,
  chatNotificationValidation,
  reportCarValidation,
  reportReasonsValidation,
  purchaseSlotPlanValidation,
  requestSlotValidation,
  renewPlanValidation,
  renewSummaryValidation,
  scheduleVisitValidation,
  scheduleRequestListValidation,
  scheduleRequestIdValidation,
  scheduleRequestActionValidation,
  rescheduleRequestActionValidation,
  createPurchaseAgreementValidation,
  createAgreementValidation,
  addPurchaseAgreementValidation,
  updatePurchaseAgreementValidation,
  deletePurchaseAgreementValidation,
  agreementIdValidation,
  submitAppFeedbackValidation,
  submitHelpRequestValidation,
  addHelpSupportValidation,
  filtersValidation,
  yearRangeAnalyticsValidation,
  kilometersRangeAnalyticsValidation,
  priceRangeAnalyticsValidation,
  leasingRangeAnalyticsValidation,
  enginePowerAnalyticsValidation,
  cubicCapacityAnalyticsValidation,
  rangeAnalyticsValidation,
  getModelValidation,
  getVariantValidation,
  getEngineValidation,
  modelsByMakeValidation,
  versionsListValidation,
  catalogVinValidation,
  catalogTypeApprovalValidation,
  versionEquipmentValidation,
  updateNotificationSettingsValidation,
  createSavedSearchValidation,
  deleteSavedSearchValidation
} from '../vallidation/index.js';

const fieldsConfig = [
  { name: 'profileImage', maxCount: 1 },
  { name: 'videoThumbnail', maxCount: 1 },
  { name: 'carReel', maxCount: 1 },
  { name: 'carImages', maxCount: 10 },
  { name: 'document', maxCount: 5 },
  { name: 'reelThumbnails', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'showroomImages', maxCount: 10 },
  { name: 'showroomVideos', maxCount: 2 },
  { name: 'chatAttachment', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'file', maxCount: 1 }
];

const app = express();

// ------------------------------------------ Auth & Profile Module --------------------------------------------------//
app.post('/signUp', authRateLimiter, userSignUp, handleValidationErrors, controller.userController.userSignUp);
app.post('/resendOtp', otpRateLimiter, emailVallidation, handleValidationErrors, controller.userController.resendOtp);
app.post('/otpVerified', authRateLimiter, otpVerifiedValidation, handleValidationErrors, controller.userController.otpVerified);
app.post('/signIn', authRateLimiter, userSignIn, handleValidationErrors, controller.userController.userSignIn);
app.post('/forgotPassword', otpRateLimiter, emailVallidation, handleValidationErrors, controller.userController.forgotPassword);
app.post('/changePassword', authenticateUser, passwordChange, handleValidationErrors, controller.userController.changePasswordd);
app.post('/resetPassword', authRateLimiter, resetPasswordValidation, handleValidationErrors, controller.userController.resetPassword);
app.get('/getUserProfile', authenticateUser, controller.userController.getUserProfile);
app.post('/editProfile', authenticateUser, uploadProfile.any(), editProfileValidation, handleValidationErrors, controller.userController.editProfile);
app.post('/changeMode', authenticateUser, changeModeValidation, handleValidationErrors, controller.userController.changeMode);
app.post('/changeLanguage', authenticateUser, uploadProfile.none(), changeLanguageValidation, handleValidationErrors, controller.userController.changeLanguage);
app.put('/changeLanguage', authenticateUser, uploadProfile.none(), changeLanguageValidation, handleValidationErrors, controller.userController.changeLanguage);
app.patch('/changeLanguage', authenticateUser, uploadProfile.none(), changeLanguageValidation, handleValidationErrors, controller.userController.changeLanguage);
app.post('/updateBuyerToSeller', authenticateUser, updateBuyerToSellerValidation, handleValidationErrors, controller.userController.updateBuyerToSeller);
app.post('/find-vehicle-by-vrn', authenticateUser, vrnValidation, handleValidationErrors, controller.userController.findVehicleByVRN);
app.delete('/deleteAccount', authenticateUser, deleteAccount);
app.post('/deleteAccount', authenticateUser, deleteAccount);
app.delete('/delete-account', authenticateUser, deleteAccount);
app.post('/delete-account', authenticateUser, deleteAccount);
app.post('/downloadUserData', authenticateUser, downloadUserDataController);
app.get('/downloadUserData', authenticateUser, downloadUserDataController);
app.post('/download-user-data', authenticateUser, downloadUserDataController);
app.get('/download-user-data', authenticateUser, downloadUserDataController);

// ------------------------------------------ Seller Module -----------------------------------------------------------//
app.post('/listYourCar', authenticateUser, uploadProfile.fields(fieldsConfig), listCarValidation, handleValidationErrors, controller.userController.listCar);
app.get('/getMyCar', authenticateUser, controller.userController.getMyCar);
app.get('/fetchNotificationByBuyersIds', authenticateUser, controller.userController.fetchNotificationByBuyersIds);
app.get('/latest-draft-car', authenticateUser, controller.userController.getLatestDraftCar);

// ------------------------------------------ Buyer Module ------------------------------------------------------------//
app.get('/fetchOtherSellerCarsList', authenticateUser, controller.userController.fetchOtherSellerCarsList);
app.post('/addToWishlist', authenticateUser, addToWishlistValidation, handleValidationErrors, controller.userController.addToWishlist);
app.get('/fetchUserWishlist', authenticateUser, controller.userController.fetchUserWishlist);
app.delete('/removeCarFromWishlist', authenticateUser, removeWishlistValidation, handleValidationErrors, controller.userController.removeCarFromWishlist);
app.post('/readAllNotifications', authenticateUser, controller.userController.readAllNotifications);
app.post('/readNotificationById', authenticateUser, notificationIdValidation, handleValidationErrors, controller.userController.readNotificationsById);
app.delete('/removeAllNotification', authenticateUser, controller.userController.removeAllNotification);
app.delete('/removeNotificationById', authenticateUser, notificationIdValidation, handleValidationErrors, controller.userController.removeNotificationById);
app.get('/fetchAllCarReels', authenticateUser, controller.userController.fetchAllCarReels);
app.get('/fetchCarReels', authenticateUser, controller.userController.fetchCarReels);
app.get('/fetchAllCarReel', authenticateUser, controller.userController.fetchAllCarReel);
app.post('/saveCarReels', authenticateUser, saveCarReelsValidation, handleValidationErrors, controller.userController.saveCarReels);
app.get('/fetchedSavedCarReels', authenticateUser, controller.userController.fetchedSavedCarReels);
app.delete('/removeSavedCarsReel', authenticateUser, removeSavedCarReelsValidation, handleValidationErrors, controller.userController.removeSavedCarsReel);

app.post('/updateCar/:carId', authenticateUser, uploadProfile.fields(fieldsConfig), updateCarValidation, handleValidationErrors, controller.userController.updateCar);
app.put('/updateCar/:carId', authenticateUser, uploadProfile.fields(fieldsConfig), updateCarValidation, handleValidationErrors, controller.userController.updateCar);
app.post('/car/:carId/toggle-status', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.toggleCarActiveStatus);
app.patch('/car/:carId/toggle-status', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.toggleCarActiveStatus);
app.post('/car/:carId/activate', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.toggleCarActiveStatus);
app.post('/swap-car', authenticateUser, controller.userController.swapCar);
app.post('/swap-active-slot', authenticateUser, controller.userController.swapActiveCarSlot);
app.delete('/deleteCar/:carId', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.deleteCar);
app.post('/deleteCar-image', authenticateUser, deleteCarImageValidation, handleValidationErrors, controller.userController.deleteCarImageByUrl);
app.post('/purchaseSlotPlan', authenticateUser, purchaseSlotPlanValidation, handleValidationErrors, controller.userController.purchaseSlotPlan);
app.get('/getAllPlan', authenticateUser, controller.userController.getAllPlan);
app.get('/getMyPlan', authenticateUser, controller.userController.getMyPlan);
app.get('/choose-listing-plan', authenticateUser, controller.userController.getChooseListingPlan);
app.post('/choose-listing-plan', authenticateUser, controller.userController.getChooseListingPlan);
app.get('/carFilter', authenticateUser, controller.userController.filterCarList);
app.post('/socialLogin', socialLoginValidation, handleValidationErrors, controller.userController.socialLogin);
app.post('/requestSlot', authenticateUser, requestSlotValidation, handleValidationErrors, controller.userController.requestSlot);
app.get('/getAllSlotRequests', authenticateUser, controller.userController.getAllSlotRequests);
app.get('/getMyApprovedSlotRequests', authenticateUser, controller.userController.getMyApprovedSlotRequests);
app.get('/renewal-overview', authenticateUser, controller.userController.getRenewalOverview);
app.get('/getUpgradeDowngradePlans', authenticateUser, controller.userController.getUpgradeDowngradePlans);
app.post('/renewPlan', authenticateUser, renewPlanValidation, handleValidationErrors, controller.userController.renewPlan);
app.get('/renewSummary/:user_plan_id', authenticateUser, renewSummaryValidation, handleValidationErrors, controller.userController.getRenewalSummary);
app.post('/car-inquiry', authenticateUser, carInquiryValidation, handleValidationErrors, controller.userController.sendCarInquiry);

// ------------------------------------------ Vehicle Database --------------------------------------------------------//
app.get('/brand', controller.userController.selectBrands);
app.get('/getModel/:id', getModelValidation, handleValidationErrors, controller.userController.getModel);
app.get('/getVarient/:brandId', getVariantValidation, handleValidationErrors, controller.userController.getVariant);
app.get('/variant/:brandId', getVariantValidation, handleValidationErrors, controller.userController.getVariantByFuel);
app.get('/getEngine/:make/:model', getEngineValidation, handleValidationErrors, controller.userController.getVariantByEngine);
app.get('/sendChatNotificationByChatId', authenticateUser, controller.userController.sendChatNotificationByChatId);
app.get('/filterCarOnBrandNameOrCarModel', authenticateUser, controller.userController.filterCarOnBrandNameOrCarModel);
app.get('/getSlotRequestsById', authenticateUser, controller.userController.getSlotRequestsById);
app.post('/descriptionAwsRecognition', descriptionAwsRecognitionValidation, handleValidationErrors, controller.userController.descriptionAwsRecognition);

// ------------------------------------------ Guest Users & Schedule Visits -------------------------------------------//
app.get('/asGuestUserFetchSellerCarsList', controller.userController.asGuestUserFetchSellerCarsList);
app.get('/asGuestUserGetCar/:id', idParamValidation, handleValidationErrors, controller.userController.asGuestUserGetCar);
app.get('/asGuestUsersfetchAllCarReels', controller.userController.asGuestUsersfetchAllCarReels);
app.get('/fetchOtherCarListByOtherSellerId', authenticateUser, controller.userController.fetchOtherCarListByOtherSellerId);
app.post('/Schedule-visit', authenticateUser, scheduleVisitValidation, handleValidationErrors, controller.userController.ScheduleVisit);
app.get('/get-Schedule-visit', authenticateUser, controller.userController.getScheduleVisit);
app.get('/get-Schedule-visit/:id', authenticateUser, scheduleRequestIdValidation, handleValidationErrors, controller.userController.getScheduleRequestDetail);
app.post('/seller-Schedule-visit-Action/:id', authenticateUser, scheduleRequestActionValidation, handleValidationErrors, controller.userController.sellerPhysicalVisitAction);
app.get('/get-Schedule-visits', authenticateUser, scheduleRequestListValidation, handleValidationErrors, controller.userController.getSellerPhysicalVisits);
app.post('/schedule-requests', authenticateUser, scheduleVisitValidation, handleValidationErrors, controller.userController.ScheduleVisit);
app.get('/schedule-requests', authenticateUser, scheduleRequestListValidation, handleValidationErrors, controller.userController.getSellerPhysicalVisits);
app.get('/schedule-requests/:id', authenticateUser, scheduleRequestIdValidation, handleValidationErrors, controller.userController.getScheduleRequestDetail);
app.post('/schedule-requests/:id/action', authenticateUser, scheduleRequestActionValidation, handleValidationErrors, controller.userController.sellerPhysicalVisitAction);
app.post('/submit-App-Feedback', authenticateUser, submitAppFeedbackValidation, handleValidationErrors, controller.userController.submitAppFeedback);
app.post('/submitHelpRequest', authenticateUser, submitHelpRequestValidation, handleValidationErrors, controller.userController.submitHelpRequest);

// ------------------------------------------ Reports, Filters & Analytics -------------------------------------------//
app.post('/report-cars/:car_id', authenticateUser, reportCarValidation, handleValidationErrors, controller.userController.reportCar);
app.get('/report-reasons', authenticateUser, reportReasonsValidation, handleValidationErrors, controller.userController.getReportReasons);
app.get('/cars/:id/download-pdf', idParamValidation, handleValidationErrors, controller.userController.downloadCarPdf);
app.post('/faceted-filters', filtersValidation, handleValidationErrors, controller.userController.getFacetedFilters);
app.get('/fuel', controller.userController.getFuelTypes);
app.get('/transmission', controller.userController.getTransmissionTypes);
app.get('/drive', controller.userController.getDriveTypes);
app.get('/body-type', controller.userController.getBodyTypes);
app.get('/vichel-state', controller.userController.getVehicleStates);
app.get('/accident-vehicle', controller.userController.getAccidentVehicle);
app.get('/mfk-warrenty', controller.userController.getMfkWarranty);
app.get('/vehicle-conditions', controller.userController.vehicleConditionsDropdown);
app.get('/warranty', controller.userController.warrantyTypesDropdown);
app.get('/colors', controller.userController.colorsDropdown);
app.get('/exterior-colors', controller.userController.getExteriorColors);
app.get('/interior-colors', controller.userController.getInteriorColors);
app.get('/warranty-quality', controller.userController.warrantyQualityDropdown);
app.get('/energy-efficiency', controller.userController.getEnergyEfficiency);
app.get('/listing-age', controller.userController.getListingAge);
app.get('/seat', controller.userController.getSeatRangeCount);
app.get('/door', controller.userController.RangeCountgetDoor);
app.get('/cubic-capacity-range-analytics', cubicCapacityAnalyticsValidation, handleValidationErrors, controller.userController.getCubicCapacityAnalytics);
app.get('/cylinders-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getCylindersAnalytics);
app.get('/battery-capacity-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getBatteryCapacityAnalytics);
app.get('/total-weight-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getTotalWeightAnalytics);
app.get('/empty-weight-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getEmptyWeightAnalytics);
app.get('/towing-capacity-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getTowingCapacityAnalytics);
app.get('/wltp-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getWltpRangeAnalytics);
app.get('/consumption-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getConsumptionAnalytics);
app.get('/co2-emission-range-analytics', rangeAnalyticsValidation, handleValidationErrors, controller.userController.getCo2EmissionAnalytics);
app.get('/seller-type', controller.userController.getSellerTypes);
app.get('/car-types', controller.userController.getCarTypesDropdown);
app.get('/car-type', controller.userController.getCarTypesDropdown);
app.get('/quality-seals', controller.userController.getQualitySealsDropdown);
app.get('/quality-seal', controller.userController.getQualitySealsDropdown);

app.get('/total-Cars', controller.userController.filterCarsController);
app.post('/addRecentlyViewed', authenticateUser, recentlyViewedValidation, handleValidationErrors, controller.userController.addRecentlyViewed);
app.get('/getRecentlyViewedlist', authenticateUser, controller.userController.getRecentlyViewed);
app.get('/google-rating/:userId', authenticateUser, userIdParamValidation, handleValidationErrors, controller.userController.getSellerGoogleRating);
app.post('/leasing-calculate', authenticateUser, leasingCalculateValidation, handleValidationErrors, controller.userController.calculateLeasing);
app.get('/getCar/:id', authenticateUser, idParamValidation, handleValidationErrors, controller.userController.viewCarDetailByCarId);
app.post('/add-lat-long', authenticateUser, addLatLongValidation, handleValidationErrors, controller.userController.addLatLong);
app.get('/year-range-analytics', yearRangeAnalyticsValidation, handleValidationErrors, controller.userController.getYearRangeAnalytics);
app.get('/kilometers-range-analytics', kilometersRangeAnalyticsValidation, handleValidationErrors, controller.userController.getKilometersRangeAnalytics);
app.get('/price-range-analytics', priceRangeAnalyticsValidation, handleValidationErrors, controller.userController.getPriceRangeAnalytics);
app.get('/engine-power-analytics', enginePowerAnalyticsValidation, handleValidationErrors, controller.userController.getEnginePowerAnalytics);
app.get('/leasing-range-analytics', leasingRangeAnalyticsValidation, handleValidationErrors, controller.userController.getLeasingAnalytics);
app.post('/car-vertical', authenticateUser, carVerticalValidation, handleValidationErrors, controller.userController.getCarVerticalReport);

// ------------------------------------------ Web & Mobile Platform Routes -------------------------------------------//
app.get('/web/getUserProfile', authenticateUser, getUserProfileViewValidation, handleValidationErrors, getUserProfileweb);
app.post('/web/listYourCar', authenticateUser, uploadProfile.fields(fieldsConfig), listCarValidation, handleValidationErrors, listCarweb);
app.delete('/web/deleteAccount', authenticateUser, deleteAccount);
app.post('/web/deleteAccount', authenticateUser, deleteAccount);
app.delete('/web/delete-account', authenticateUser, deleteAccount);
app.post('/web/delete-account', authenticateUser, deleteAccount);
app.get('/web/filters', controller.userController.getFilters);
app.get('/web/all-makes', getAllMakes);
app.get('/web/models-by-make/:brand_id', modelsByMakeValidation, handleValidationErrors, controller.userController.getModelsListWeb);

app.get('/mobile/getUserProfile', authenticateUser, getUserProfileViewValidation, handleValidationErrors, getUserProfilemobile);
app.post('/mobile/listYourCar', authenticateUser, uploadProfile.fields(fieldsConfig), listCarValidation, handleValidationErrors, listCarmobile);
app.delete('/mobile/deleteAccount', authenticateUser, deleteAccount);
app.post('/mobile/deleteAccount', authenticateUser, deleteAccount);
app.delete('/mobile/delete-account', authenticateUser, deleteAccount);
app.post('/mobile/delete-account', authenticateUser, deleteAccount);
app.post('/carVerticalReport/:carId', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.getCarVerticalReport);

// ------------------------------------------ Catalog & Reels & Agreements -------------------------------------------//
app.get('/brands-list', controller.userController.getBrandsList);
app.get('/models-list', controller.userController.getModelsList);
app.get('/versions-list', versionsListValidation, handleValidationErrors, controller.userController.getVersionsList);
app.get('/vehicle-by-vin', catalogVinValidation, handleValidationErrors, controller.userController.getVehicleCatalogByVin);
app.get('/vehicle-by-type-approval', catalogTypeApprovalValidation, handleValidationErrors, controller.userController.getVehicleCatalogByTypeApproval);
app.get('/version-equipment-details', versionEquipmentValidation, handleValidationErrors, controller.userController.getVersionEquipmentDetails);

app.post('/uploadProfileReel', authenticateUser, uploadProfile.fields([
  { name: 'profileReel', maxCount: 1 },
  { name: 'profileReelThumbnail', maxCount: 1 }
]), controller.userController.uploadProfileReel);

app.get('/fetchMyReels', authenticateUser, controller.userController.fetchMyReels);
app.get('/fetchReelById', authenticateUser, controller.userController.fetchReelById);
app.delete('/deleteReel', authenticateUser, deleteReelValidation, handleValidationErrors, controller.userController.deleteReel);
app.delete('/removeSavedCarsReel', authenticateUser, removeSavedCarReelsValidation, handleValidationErrors, controller.userController.removeSavedCarReels);
app.get('/my-sent-visit-requests', authenticateUser, controller.userController.getMySentPhysicalVisits);
app.post('/schedule-requests/:id/reschedule', authenticateUser, rescheduleRequestActionValidation, handleValidationErrors, controller.userController.reschedulePhysicalVisit);

app.post('/purchase-agreement', authenticateUser, addPurchaseAgreementValidation, handleValidationErrors, controller.userController.addPurchaseAgreement);

app.post('/help-support', authenticateUser, addHelpSupportValidation, handleValidationErrors, controller.userController.addHelpSupport);
app.get('/help-support/my-tickets', authenticateUser, controller.userController.getMySupportTickets);
app.get('/fetchAllSellers', authenticateUser, controller.userController.getAllSellerProfiles);
app.post('/upload-chat-attachment', authenticateUser, uploadProfile.fields(fieldsConfig), controller.userController.uploadChatAttachment);
app.delete('/delete-chat-attachment/:id', authenticateUser, idParamValidation, handleValidationErrors, controller.userController.deleteChatAttachment);
app.get('/fetchSellerById/:id', idParamValidation, handleValidationErrors, controller.userController.getSellerProfileById);
app.get('/car/mfk/:car_id', authenticateUser, carIdParamAltValidation, handleValidationErrors, controller.userController.getMfkStatus);
app.get('/mfk-warranty', controller.userController.getMfkWarranty);
app.get('/cars/warranty/:carId', authenticateUser, carIdParamValidation, handleValidationErrors, controller.userController.getWarrantyDetails);
app.post('/chat/notification', chatNotificationValidation, handleValidationErrors, controller.userController.sendChatNotificationController);
app.post('/vehicles/:vehicleId/purchase-agreement', authenticateUser, createPurchaseAgreementValidation, handleValidationErrors, controller.userController.createPurchaseAgreement);
app.get('/purchase-agreements/:id', authenticateUser, agreementIdValidation, handleValidationErrors, controller.userController.getPurchaseAgreementThroughId);
app.put('/purchase-agreements/:id', authenticateUser, updatePurchaseAgreementValidation, handleValidationErrors, controller.userController.updatePurchaseAgreement);
app.delete('/purchase-agreements/:id', authenticateUser, deletePurchaseAgreementValidation, handleValidationErrors, controller.userController.deletePurchaseAgreement);
app.get('/purchase-agreements/:id/download-pdf', authenticateUser, agreementIdValidation, handleValidationErrors, controller.userController.downloadPurchaseAgreementPdf);
app.get('/purchase-agreement/warranty-types', controller.userController.getPurchaseAgreementWarrantyTypes);
app.get('/purchase-agreement/template', controller.userController.downloadBlankPurchaseAgreementTemplate);
app.get('/getMfkStatusList', controller.userController.getMfkStatusList);
app.get('/sort-data', controller.userController.getSortList);

app.get('/extras-data', controller.userController.getExtrasList);
app.get('/features-data', controller.userController.getFeaturesList);

// Notification Settings & FCM Routes
app.get('/notification-settings', authenticateUser, controller.userController.getNotificationSettings);
app.put('/notification-settings', authenticateUser, updateNotificationSettingsValidation, handleValidationErrors, controller.userController.updateNotificationSettings);
app.post('/updateFcmToken', authenticateUser, controller.userController.updateFcmTokenController);

// Saved Searches Routes
app.post('/saved-searches', authenticateUser, createSavedSearchValidation, handleValidationErrors, controller.userController.createSavedSearchController);
app.get('/saved-searches', authenticateUser, controller.userController.getSavedSearchesController);
app.delete('/saved-searches/:id', authenticateUser, deleteSavedSearchValidation, handleValidationErrors, controller.userController.deleteSavedSearchController);

export default app;
