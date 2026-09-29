import { sendNotificationToUser } from '../../services/notification.service.js';
import { getPhysicalVisitByIdModel } from '../../models/admin.model.js';
import { fetchCarsByCarId, checkDuplicatePhysicalVisitModel, createPhysicalVisitModel, getPhysicalVisitsBySellerModel, getSellerPhysicalVisitByIdModel } from '../../models/user.model.js';
import { formatScheduleRequestItem, formatScheduleRequestDetail } from './sellerCarsList.controller.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { normalizeMySQLDate } from '../../utils/DateConvertor.js';

const normalizeTime = (timeStr) => {
    if (!timeStr) return timeStr;
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return timeStr;
    let [_, hours, mins, modifier] = match;
    let h = parseInt(hours, 10);
    if (modifier) {
        if (modifier.toUpperCase() === 'PM' && h < 12) h += 12;
        if (modifier.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${mins}:00`;
};

export const ScheduleVisit = async (req, res) => {
    try {
        const car_id = req.body.car_id;
        const full_name = (req.body.full_name || req.body.fullName || req.user?.fullName || '').trim();
        const email = (req.body.email || req.user?.email || '').trim();
        const phone_number = (req.body.phone_number || req.body.phoneNumber || req.user?.phoneNumber || '+41791234567').trim();
        const raw_visit_date = req.body.visit_date || req.body.preferred_date;
        const raw_visit_time = req.body.visit_time || req.body.preferred_time;
        const visit_date = normalizeMySQLDate(raw_visit_date);
        const visit_time = normalizeTime(raw_visit_time);
        const message = req.body.message || req.body.buyer_notes || null;

        const user_id = req.user?.id || null;
        const lang = req.user?.language || "en";

        if (!car_id || !full_name || !email || !phone_number || !visit_date || !visit_time) {
            return handleError(
                res,
                400,
                "car_id, full_name, email, phone_number, visit_date and visit_time are required",
                lang
            );
        }

        const carData = await fetchCarsByCarId(car_id);

        if (!carData.length) {
            return handleError(res, 404, "Car not found", lang);
        }

        const seller_id = carData[0].user_id;

        if (user_id && Number(seller_id) === Number(user_id)) {
            return handleError(
                res,
                400,
                "You cannot schedule a visit for your own listing",
                lang
            );
        }

        if (Number(carData[0].isPhysicalVisitAllowed) === 0) {
            return handleError(
                res,
                403,
                "Physical visit is not available for this listing",
                lang
            );
        }

        const existingVisit = await checkDuplicatePhysicalVisitModel({
            car_id,
            user_id,
            email,
            visit_date,
            visit_time
        });

        if (existingVisit.length) {
            return handleError(
                res,
                409,
                "You already have a visit scheduled for this time",
                lang
            );
        }

        const createResult = await createPhysicalVisitModel({
            car_id,
            seller_id,
            user_id,
            full_name,
            email,
            phone_number,
            visit_date,
            visit_time,
            message
        });

        const [createdVisit] = await getPhysicalVisitByIdModel(
            createResult.insertId
        );

        // =====================================================
        // SEND NOTIFICATIONS
        // =====================================================

        try {
            /*
             * Buyer Notification
             */
            if (user_id) {
                await sendNotificationToUser(user_id, {
                    titleKey: "VISIT_REQUEST_SUBMITTED",
                    bodyKey: "VISIT_REQUEST_SUBMITTED_BODY",
                    category: "appointments",

                    params: {
                        car: carData[0].title || "the car",
                        date: visit_date,
                        time: visit_time
                    },

                    data: {
                        type: "physical_visit",
                        notification_type: "physical_visit",
                        id: String(createResult.insertId),

                        action: "visit_request_created",
                        visit_id: String(createResult.insertId),
                        car_id: String(car_id),

                        sendFrom: seller_id,
                        sendTo: user_id
                    }
                });
            }

            /*
             * Seller Notification
             */
            if (seller_id) {
                await sendNotificationToUser(seller_id, {
                    titleKey: "NEW_VISIT_REQUEST",
                    bodyKey: "NEW_VISIT_REQUEST_BODY",
                    category: "appointments",

                    params: {
                        name: full_name,
                        date: visit_date,
                        time: visit_time,
                        car: [carData[0].selectYear, carData[0].brandName, carData[0].carModel].filter(Boolean).join(' ') || carData[0].title || "your vehicle"
                    },

                    data: {
                        type: "physical_visit",
                        notification_type: "physical_visit",
                        id: String(createResult.insertId),

                        action: "new_visit_request",
                        visit_id: String(createResult.insertId),
                        car_id: String(car_id),
                        buyer_id: user_id ? String(user_id) : "",

                        sendFrom: user_id,
                        sendTo: seller_id
                    }
                });
            }
        } catch (notificationError) {
            // Notification failure should NOT fail the visit creation
            console.error(
                "Physical visit notification error:",
                notificationError
            );
        }

        return handleSuccess(
            res,
            201,
           getMessage(lang, variableTypes.Physical_visit_request_submitted_successfully),
            createdVisit
                ? formatScheduleRequestDetail(createdVisit)
                : { id: createResult.insertId },
            lang
        );

    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error",
            req.user?.language || "en"
        );
    }
};

export const getScheduleVisit = async (req, res) => {
    try {
        const seller_id = req.user.id;
        const lang = req.user?.language || "en";
        const visits = await getPhysicalVisitsBySellerModel(seller_id, {});

        return handleSuccess(
            res,
            200,
            "Physical visits fetched successfully",
            visits.map(formatScheduleRequestItem),
            lang
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error", req.user?.language || "en");
    }
};

export const getScheduleRequestDetail = async (req, res) => {
    try {
        const owner_id = req.user.id;
        const lang = req.user?.language || "en";
        const visit_id = Number(req.params.id);

        if (!visit_id) {
            return handleError(res, 400, "Valid request id is required", lang);
        }

        const [visit] = await getSellerPhysicalVisitByIdModel(owner_id, visit_id);

        if (!visit) {
            return handleError(res, 404, "Schedule request not found", lang);
        }

        return handleSuccess(
            res,
            200,
            "Schedule request fetched successfully",
            formatScheduleRequestDetail(visit),
            lang
        );
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error", req.user?.language || "en");
    }
};
