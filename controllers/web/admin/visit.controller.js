import { variableTypes } from '../../utils/constant.js';
import {
    getAllPhysicalVisitsModel,
    getAllPhysicalVisitsCountModel,
    getPhysicalVisitByIdModel
} from '../../models/admin.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const formatAdminScheduleVisit = (item) => ({
    id: item.id,
    seller: {
        id: item.seller_id,
        name: item.seller_name,
        city: item.seller_city,
        email: item.seller_email,
        phone: item.seller_phone
    },
    buyer: {
        id: item.buyer_id,
        name: item.buyer_name,
        email: item.buyer_email,
        phone: item.buyer_phone,
        city: item.buyer_city
    },
    vehicle: {
        id: item.car_id,
        name: `${item.brandName} ${item.carModel}`,
        year: item.selectYear,
        image: item.car_image
    },
    visit_date: item.visit_date,
    visit_time: item.visit_time,
    status: item.status,
    created_at: item.created_at
});

export const formatAdminScheduleVisitDetails = (item) => ({
    id: item.id,
    status: item.status,
    buyer: {
        id: item.buyer_id,
        name: item.buyer_name,
        email: item.buyer_email,
        phone: item.buyer_phone,
        profile_image: item.buyer_profile,
        address: item.buyer_address,
        city: item.buyer_city
    },
    seller: {
        id: item.seller_id,
        name: item.seller_name,
        email: item.seller_email,
        phone: item.seller_phone,
        profile_image: item.seller_profile,
        address: item.seller_address,
        city: item.seller_city
    },
    visit: {
        date: item.visit_date,
        time: item.visit_time,
        address: item.address,
        message: item.message
    },
    car: {
        id: item.car_id,
        title: `${item.brandName} ${item.carModel}`,
        image: item.car_image,
        price: item.selling_price,
        registration_year: item.registration_year,
        mileage: item.carMileage,
        transmission: item.transmission,
        engine_type: item.engineType,
        fuel_type: item.fuel_type,
        body_type: item.body_type
    }
});

export const getAllScheduleVisits = async (req, res) => {
    try {
        const lang = req.user?.language || "en";

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { status = null, search = null } = req.query;

        const [visits, total] = await Promise.all([
            getAllPhysicalVisitsModel({
                status,
                search,
                limit,
                offset
            }),
            getAllPhysicalVisitsCountModel({
                status,
                search
            })
        ]);

        return res.status(200).json({
            success: true,
            status: 200,
            language: lang,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            data: visits.map(formatAdminScheduleVisit)
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            status: 500,
            language: req.user?.language || "en",
            message: "Internal Server Error"
        });
    }
};

export const getScheduleVisitById = async (req, res) => {
    try {
        const lang = req.user?.language || "en";

        const visitId = Number(req.params.id);

        const visit = await getPhysicalVisitByIdModel(visitId);

        if (!visit || !visit.length) {
            return handleError(
                res,
                404,
                "Physical visit not found",
                lang
            );
        }

        return handleSuccess(
            res,
            200,
            "Physical visit fetched successfully",
            formatAdminScheduleVisitDetails(visit[0]),
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
