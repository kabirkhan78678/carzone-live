import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { FALLBACK_MAKES } from '../../utils/vehicleMakesData.js';
import { FALLBACK_MODELS } from '../../utils/vehicleModelsFallback.js';
import axios from 'axios';

export const selectBrands = async (req, res) => {
    try {
        const url = "https://www.carqueryapi.com/api/0.3/?cmd=getMakes";
        const response = await axios.get(url, { timeout: 10000 });
        let data = response.data;

        if (typeof data === "string") {
            data = data.replace(/^\?\(|\);?$/g, ""); // clean JSON
            data = JSON.parse(data);
        }

        let makes = data.Makes || [];

        // If API returns empty, use fallback list
        if (makes.length === 0) {
            console.warn("CarQuery returned empty makes. Using fallback list.");
            makes = FALLBACK_MAKES;
        }

        // Optional: sort alphabetically
        makes.sort((a, b) =>
            a.make_display.localeCompare(b.make_display, "en", { sensitivity: "base" })
        );

        res.status(200).json({
            success: true,
            message: "Brands fetched successfully",
            count: makes.length,
            data: makes,
        });
    } catch (error) {
        console.error("Error fetching brands:", error.message);

        // Use fallback even on error
        res.status(200).json({
            success: true,
            message: "CarQuery API failed. Using fallback list of brands.",
            count: FALLBACK_MAKES.length,
            data: FALLBACK_MAKES,
        });
    }
};

//     try {

//             data = data.replace(/^\?\(|\);?$/g, "");
//             data = JSON.parse(data);
//         }

//             success: true,
//             message: "Models fetched successfully",
//             data: models.map(m => ({
//                 modelId: m.model_id,
//                 modelName: m.model_name,
//                 modelYear: m.model_year,
//                 bodyStyle: m.model_body,
//                 transmission: m.model_transmission_type,
//             })),
//         });
//     } catch (error) {
//         console.error("Error fetching models:", error.message);
//             success: false,
//             message: "Failed to fetch models",
//             error: error.message,
//         });
//     }
// };

// Example fallback models per brand

// FALLBACK_MODELS extracted to utils/vehicleModelsFallback.js

export const getModel = async (req, res) => {
    try {
        const brand = req.params.id?.toLowerCase(); // Example: "tata"

        const url = `https://www.carqueryapi.com/api/0.3/?cmd=getModels&make=${brand}`;
        const response = await axios.get(url, { timeout: 10000 });

        let data = response.data;
        if (typeof data === "string") {
            data = data.replace(/^\?\(|\);?$/g, "");
            data = JSON.parse(data);
        }

        let models = data.Models || [];

        // If API returns empty, use fallback
        if (!models || models.length === 0) {
            console.warn(`API returned no models for ${brand}, using fallback.`);
            models = FALLBACK_MODELS[brand] || [];
        } else {
            // Map API data to standard format
            models = models.map(m => ({
                modelId: m.model_id,
                modelName: m.model_name,
                modelYear: m.model_year,
                bodyStyle: m.model_body,
                transmission: m.model_transmission_type,
            }));
        }

        res.status(200).json({
            success: true,
            message: "Models fetched successfully",
            count: models.length,
            data: models,
        });
    } catch (error) {
        console.error("Error fetching models:", error.message);

        // If API fails, fallback
        const fallback = FALLBACK_MODELS[req.params.id?.toLowerCase()] || [];
        res.status(200).json({
            success: true,
            message: "Using fallback models due to API failure",
            count: fallback.length,
            data: fallback,
        });
    }
};
