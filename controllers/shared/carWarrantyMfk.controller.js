import { getCarByIdmfk, getMfkWarrantyCountsModel, getWarrantyDetailsService, getMfkStatusListModel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { calculateMfk, buildMfkMessage, INDICATOR_MAP } from '../../utils/mfkHelper.js';
import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';

export const getMfkStatus = async (
    req,
    res
) => {

    try {
        const { car_id } = req.params;
        const lang = req.user?.language || "en";
        const car = await getCarByIdmfk(car_id);

        console.log("car", car);

        if (!car) {

            return handleError(
                res,
                404,
                getMessage(
                    lang,
                    variableTypes.CAR_NOT_FOUND
                )
            );
        }

        const mfkInfo = calculateMfk({
            first_registration_date:
                car.first_registration_date,

            last_mfk_date:
                car.last_mfk_date,

            override_status:
                car.mfk_status_override
        });

        const text = buildMfkMessage({
            status:
                mfkInfo.status,

            last_mfk_date:
                car.last_mfk_date,

            next_mfk_due:
                mfkInfo.next_mfk_due,

            lang
        });

        return handleSuccess(
            res,
            200,
            getMessage(
                lang,
                variableTypes.SUCCESS
            ),
            {
                title: getMessage(
                    lang,
                    variableTypes.MFK_TITLE
                ),

                status:
                    mfkInfo.status,

                indicator:
                    INDICATOR_MAP[
                    mfkInfo.status
                    ],

                text,

                last_mfk_date:
                    car.last_mfk_date,

                next_mfk_due:
                    mfkInfo.next_mfk_due
            }
        );

    } catch (error) {
        console.error(
            "MFK ERROR =>",
            error
        );
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

export const getMfkWarrantyCounts = async (req, res) => {

    try {

        const activeFiltersInput =
            parseFacetedInput(
                req.query.active_filters ??
                req.query.applied_filters
            );

        const normalizedFilters =
            normalizeFacetedFilters(
                activeFiltersInput
            );

            console.log(normalizedFilters,"888888888")

        const data =
            await getMfkWarrantyCountsModel(
                normalizedFilters
            );

        return handleSuccess(
            res,
            200,
            "MFK and warranty counts fetched successfully",
            data
        );

    } catch (error) {

        console.error(
            "GET MFK WARRANTY COUNTS ERROR =>",
            error
        );

        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};

export const getWarrantyDetails = async (
    req,
    res
) => {
    try {
        const { carId } = req.params;

        if (!carId) {
            return res.status(400).json({
                success: false,
                message: "Car Id is required",
            });
        }

        const data =
            await getWarrantyDetailsService(
                carId
            );

        return res.status(200).json({
            success: true,
            message:
                "Warranty details fetched successfully",
            data,
        });
    } catch (error) {
        console.error(
            "WARRANTY ERROR =>",
            error
        );

        if (
            error.message === "CAR_NOT_FOUND"
        ) {
            return res.status(404).json({
                success: false,
                message: "Car not found",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Something went wrong",
        });
    }
};

export const getMfkStatusList = async (req, res) => {
    try {
        const lang = req.query?.language || "en";

        const data = await getMfkStatusListModel(lang);

        return handleSuccess(
            res,
            200,
            getMessage(lang,"MFKstatuslistfetchedsuccessfully"),
            data || [],
            lang
        );
    } catch (error) {
        console.error("getMfkStatusList error:", error);

        return handleError(
            res,
            500,
            getMessage(lang, variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};
