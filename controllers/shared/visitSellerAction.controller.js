import { updatePhysicalVisitActionModel, getSellerPhysicalVisitByIdModel, getSellerPhysicalVisitsCountModel, getSellerPhysicalVisitsModel, getMySentPhysicalVisitsModel, reschedulePhysicalVisitModel } from '../../models/user.model.js';
import { getPhysicalVisitByIdModel } from '../../models/admin.model.js';
import { formatScheduleRequestItem, formatScheduleRequestDetail } from './sellerCarsList.controller.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { normalizeMySQLDate } from '../../utils/DateConvertor.js';
import { notifyAppointmentEvent } from '../../services/notificationDispatchers.js';

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

export const sellerPhysicalVisitAction = async (req, res) => {
    try {
        const seller_id = req.user.id;
        const visit_id = req.params.id;
        const lang = req.user?.language || "en";

        const {
            action,
            rescheduled_date,
            rescheduled_time
        } = req.body;

        const normalizedAction = String(action || "").trim().toLowerCase();
        const allowedActions = ['approve', 'confirm', 'reject', 'reschedule'];
        if (!allowedActions.includes(normalizedAction)) {
            return handleError(res, 400, "Invalid action", lang);
        }

        const visit = await getPhysicalVisitByIdModel(visit_id);
        if (!visit.length || (Number(visit[0].seller_id) !== Number(seller_id) && Number(visit[0].listing_owner_id) !== Number(seller_id))) {
            return handleError(res, 403, "Unauthorized access", lang);
        }

        let status = visit[0].status;

        let updateData = {
            rescheduled_date: null,
            rescheduled_time: null
        };

        if (normalizedAction === 'approve' || normalizedAction === 'confirm') {
            status = 'confirmed';
        }

        if (normalizedAction === 'reject') {
            status = 'rejected';
        }

        if (normalizedAction === 'reschedule') {
            if (!rescheduled_date || !rescheduled_time) {
                return handleError(
                    res,
                    400,
                    "Rescheduled date and time are required",
                    lang
                );
            }

            status = 'confirmed';
            updateData.rescheduled_date = normalizeMySQLDate(rescheduled_date);
            updateData.rescheduled_time = normalizeTime(rescheduled_time);
        }

        await updatePhysicalVisitActionModel(
            visit_id,
            seller_id,
            status,
            updateData
        );

        // Notify Buyer about appointment decision
        const carName = `${visit[0].brandName || ''} ${visit[0].carModel || ''}`.trim() || 'the vehicle';
        const notifEvent = normalizedAction === 'reschedule' ? 'rescheduled' : (status === 'confirmed' ? 'confirmed' : 'rejected');
        await notifyAppointmentEvent({
            visitId: visit_id,
            carId: visit[0].car_id,
            buyerId: visit[0].user_id,
            sellerId: seller_id,
            event: notifEvent,
            carName,
            date: updateData.rescheduled_date || visit[0].visit_date,
            time: updateData.rescheduled_time || visit[0].visit_time,
            sellerName: req.user.fullName || 'The Seller'
        });

        const [updatedVisit] = await getSellerPhysicalVisitByIdModel(seller_id, visit_id);

        return handleSuccess(
            res,
            200,
            `Physical visit ${status} successfully`,
            updatedVisit ? formatScheduleRequestDetail(updatedVisit) : { id: Number(visit_id), status },
            lang
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error", req.user?.language || "en");
    }
};

export const getSellerPhysicalVisits = async (req, res) => {
    try {
        const seller_id = req.user.id;
        const lang = req.user?.language || "en";
        const {
            status,
            search = "",
            page = 1,
            limit = 20
        } = req.query;

        const normalizedStatus = String(status || "").trim().toLowerCase();
        const selectedStatus = normalizedStatus && normalizedStatus !== "all" ? normalizedStatus : null;
        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.max(Number(limit) || 20, 1);
        const offset = (pageNumber - 1) * limitNumber;

        const [countRow] = await getSellerPhysicalVisitsCountModel(seller_id, {
            status: selectedStatus,
            search
        });

        const visits = await getSellerPhysicalVisitsModel(
            seller_id,
            selectedStatus,
            search,
            limitNumber,
            offset
        );

        return handleSuccess(res, 200, "Physical visits fetched", {
            total: Number(countRow?.total || 0),
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(Number(countRow?.total || 0) / limitNumber) || 0,
            filters: {
                status: selectedStatus || "all",
                search: search || ""
            },
            data: visits.map(formatScheduleRequestItem)
        }, lang);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error", req.user?.language || "en");
    }
};

export const getMySentPhysicalVisits = async (req, res) => {
    try {
        const user_id = req.user.id;
        const lang = req.user?.language || "en";

        const { id, status, search = "" } = req.query;

        const visits = await getMySentPhysicalVisitsModel(
            user_id,
            {
                id,
                status,
                search
            }
        );

        if (id && visits.length === 0) {
            return handleError(
                res,
                404,
                "Visit request not found",
                lang
            );
        }

        return handleSuccess(
            res,
            200,
            "My visit requests fetched successfully",
            id
                ? formatMySentVisitRequest(visits[0])
                : visits.map(formatMySentVisitRequest),
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

// ==============================
// FORMATTER — updated fields
// ==============================

export const formatMySentVisitRequest = (item) => ({
    id: item.id,
    status: item.status,
    buyer_side_status: item.buyer_side_status,
    requested_on: item.created_at,
    preferred_date: item.visit_date,
    preferred_time: item.visit_time,
    message: item.message,

    seller: {
        user_id: item.seller_id,
        full_name: item.seller_name,
        email: item.seller_email,
        phone_number: item.seller_phone,
        profile_photo: item.seller_profile_image
    },

    vehicle: {
        id: item.car_id,
        title: `${item.brandName} ${item.carModel}`,
        brandName: item.brandName,
        carModel: item.carModel,
        registration_year: item.registration_year,
        mileage: item.carMileage,
        price: item.selling_price,
        image: item.car_image
    },

    audit: {
        created_at: item.created_at,
        updated_at: item.updated_at,
        original_visit_date: item.visit_date,
        original_visit_time: item.visit_time,
        rescheduled_date: item.rescheduled_date,
        rescheduled_time: item.rescheduled_time
    }
});

export const reschedulePhysicalVisit = async (req, res) => {
    try {
        const seller_id = req.user.id;
        const visit_id = Number(req.params.id);
        const lang = req.user?.language || "en";

        const {
            preferred_date,
            preferred_time,
            seller_note
        } = req.body;

        if (!preferred_date || !preferred_time) {
            return handleError(
                res,
                400,
                "Preferred date and time are required",
                lang
            );
        }

        const visit = await getPhysicalVisitByIdModel(visit_id);

        if (!visit.length) {
            return handleError(
                res,
                404,
                "Visit request not found",
                lang
            );
        }

        //         res,
        //         403,
        //         "Unauthorized access",
        //         lang
        //     );
        // }

        await reschedulePhysicalVisitModel({
            visit_id,
            seller_id,
            preferred_date: normalizeMySQLDate(preferred_date),
            preferred_time: normalizeTime(preferred_time),
            seller_note
        });

        // Notify Buyer about reschedule
        const carName = `${visit[0].brandName || ''} ${visit[0].carModel || ''}`.trim() || 'the vehicle';
        await notifyAppointmentEvent({
            visitId: visit_id,
            carId: visit[0].car_id,
            buyerId: visit[0].user_id,
            sellerId: seller_id,
            event: 'rescheduled',
            carName,
            date: normalizeMySQLDate(preferred_date),
            time: normalizeTime(preferred_time),
            sellerName: req.user.fullName || 'The Seller',
            reason: seller_note
        });

        const [updatedVisit] =
            await getSellerPhysicalVisitByIdModel(
                seller_id,
                visit_id
            );

        return handleSuccess(
            res,
            200,
            "Visit request rescheduled successfully",
            updatedVisit,
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
