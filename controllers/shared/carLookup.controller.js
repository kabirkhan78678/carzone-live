import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import axios from 'axios';
import db from '../../config/db.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { fetchVehicleByVRN } from '../../services/vehicleVrn.service.js';

export const getCarVinByIdModel = async (carId) => {
    const rows = await db.query(`
    SELECT id, vin_number
    FROM tbl_cars
    WHERE id = ?
  `, [carId]);

    return rows[0];
};

//     try {

//         if (!car || !car.vrn) {
//                 message: "VRN not found for this car",
//             });
//         }

//             success: true,
//             data: report,
//         });

//     } catch (error) {
//         console.error(error);
//     }
// };

// code by raj

export const findVehicleByVRN = async (req, res) => {
    try {
        const { vrn, month, year } = req.body;

        const vehicleData = await fetchVehicleByVRN({ vrn, month, year });

        return handleSuccess(
            res,
            "Vehicle details fetched successfully",
            vehicleData
        );
    } catch (error) {
        return handleError(
            res,
            error.statusCode || 500,
            error.message || "Unable to fetch vehicle details"
        );
    }
};

// code by raj carvertical
// carvertical(on hold waiting for api )

export const getCarVerticalReport = async (req, res) => {
    try {
        const { car_id, vin: manualVin } = req.body;

        if (!car_id) {
            return handleError(res, 400, "car_id is required");
        }

        let vin = null;

        //  CURRENT MODE (Manual VIN)
        vin = manualVin;

        // 🚀 FUTURE MODE (DB VIN FETCH)
        // Uncomment when VIN stored in DB
        /*
        const rows = await db.query(
            `SELECT vin_number FROM tbl_cars WHERE id = ? LIMIT 1`,
            [car_id]
        );
        if (!rows || rows.length === 0) {
            return handleError(res, 404, getMessage("en", variableTypes.CAR_NOT_FOUND));
        }
        vin = rows[0].vin_number;
        */
        if (!vin) {
            return res.status(400).json({
                message: "VIN number required for vehicle report"
            });
        }

        //  REAL CARVERTICAL API CALL
        const response = await axios.post(
            process.env.CARVERTICAL_API_URL,
            { vin },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CARVERTICAL_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return res.json({
            success: true,
            report: response.data
        });

    } catch (error) {
        console.error("CarVertical Error:", error.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch vehicle report",
            error: error.response?.data || error.message
        });
    }
};

//     try{

//             res ,
//             "vehivle details fetched successfully ",
//             vehicledata
//         )
//     } catch (error){
//             res ,
//             error.statusCode | 500 ,
//             error.message | "unable to fetch vehicle detials"
//         );
//     }

// }

// code by Raj
