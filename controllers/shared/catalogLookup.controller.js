import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getVehicleCatalogByVinModel, getVehicleCatalogByTypeApprovalModel, getVersionEquipmentDetailsModel } from '../../models/user.model.js';
import { parseVehicleCatalogLookupRows } from './versionsList.controller.js';
import { variableTypes } from '../../utils/constant.js';
import { getMessage } from '../../utils/user_helper.js';

export const getVehicleCatalogByVin = async (req, res) => {
    try {
        const vin_number = req.query.vin_number || req.query.vin || req.query.serial_number;
        const lang = req.query.lang || "en";

        if (!vin_number) {
            return res.status(400).json({
                success: false,
                message: getMessage(lang, variableTypes.VIN_NUMBER_REQUIRED)
            });
        }

        const result = await getVehicleCatalogByVinModel({
            vin_number,
            manufacture_month: req.query.manufacture_month || req.query.registration_month,
            manufacture_year: req.query.manufacture_year || req.query.registration_year,
            lang
        });

        if (!result.length) {
            return res.status(200).json({
                success: false,
                message: getMessage(lang, variableTypes.NO_VEHICLE_FOUND_FOR_VIN_NUMBER)
            });
        }

        return res.status(200).json({
            success: true,
            message: getMessage(lang, variableTypes.VEHICLE_FETCHED_SUCCESSFULLY),
            data: parseVehicleCatalogLookupRows(result)[0]
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

export const getVehicleCatalogByTypeApproval = async (req, res) => {
    try {
        const type_approval = req.query.type_approval || req.query.typeApproval;
        const lang = req.query.lang || "en";

        if (!type_approval) {
            return res.status(400).json({
                success: false,
                message: getMessage(lang, variableTypes.TYPE_APPROVAL_REQUIRED)
            });
        }

        const result = await getVehicleCatalogByTypeApprovalModel({
            type_approval,
            manufacture_month: req.query.manufacture_month || req.query.registration_month,
            manufacture_year: req.query.manufacture_year || req.query.registration_year,
            lang
        });

        if (!result.length) {
            return res.status(200).json({
                success: false,
                message: getMessage(lang, variableTypes.NO_VEHICLE_FOUND_FOR_TYPE_APPROVAL_NUMBER)
            });
        }

        return res.status(200).json({
            success: true,
            message: getMessage(lang, variableTypes.VEHICLE_FETCHED_SUCCESSFULLY),
            data: parseVehicleCatalogLookupRows(result)[0]
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

export const getVersionEquipmentDetails = async (req, res) => {
    try {
        const { fzkey } = req.query;
        if (!fzkey) {
            return handleError(res, 400, "fzkey is required");
        }
        const result = await getVersionEquipmentDetailsModel(fzkey);
        if (!result.length) {
            return res.status(404).json({
                success: false,
                message: "No equipment details found"
            });
        }
        // parse equipment payload
        let parsedEquipment = [];
        try {
            parsedEquipment = JSON.parse(result[0].equipment_payload || '{}');
        } catch (err) {
            parsedEquipment = [];
        }
        return res.status(200).json({
            success: true,
            message: "Equipment details fetched successfully",
            data: {
                version_id: result[0].version_id,
                equipment_payload: parsedEquipment
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

//--------------------------by karan ----------------

// ======================================================
// GET ALL MAKES
// ======================================================
