import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getBrandsFacetListModel, getModelsFacetListModel } from '../../models/facetedFilter.model.js';

export const getBrandsList = async (req, res) => {
    try {
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const result = await getBrandsFacetListModel(normalizedFilters);
        const total_count = result.reduce(
            (sum, item) => sum + (Number(item?.count) || 0),
            0
        );
        return res.status(200).json({
            success: true,
            message: "Brands fetched successfully",
            total_count,
            data: result
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });

    }

};

export const getModelsList = async (req, res) => {
    try {
        const { brand_id } = req.query;
        if (!brand_id) {
            return handleError(res, 400, "brand_id is required");
        }
        const activeFiltersInput = parseFacetedInput(req.query.active_filters ?? req.query.applied_filters);
        const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
        const result = await getModelsFacetListModel(brand_id, normalizedFilters);
        const total_count = result.reduce(
            (sum, item) => sum + (Number(item?.count) || 0),
            0
        );
        return res.status(200).json({
            success: true,
            message: "Models fetched successfully",
            total_count,
            data: result

        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });

    }

};

//     try {

//         if (!model_id) {
//                 success: false,
//                 message: "model_id is required"
//             });
//         }

//             try {
//                 parsedPayload = item.raw_payload
//                     ? JSON.parse(item.raw_payload)
//                     : null;
//             } catch (e) {
//                 console.log("JSON Parse Error:", e.message);
//             }

//                 ...item,
//                 raw_payload: parsedPayload
//             };
//         });

//             success: true,
//             message: "Versions fetched successfully",
//             data: parsedResult
//         });

//     } catch (error) {

//             success: false,
//             message: "Something went wrong"
//         });

//     }
// };
