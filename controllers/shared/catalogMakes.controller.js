import { getModelsFacetListModelweb } from '../../models/facetedFilter.model.js';
import { getAllMakesModel, getModelsByMakeModel } from '../../models/user.model.js';
import { detectText } from '../../services/rekognitionService.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getMessage, parseFacetedInput, normalizeFacetedFilters } from '../../utils/user_helper.js';

export const descriptionAwsRecognition = async (req, res) => {
    try {
        const lang = 'en';
        const description = req.body.description;
        const textDetection = await detectText(description);
        if (textDetection.inappropriate) {
            return handleError(res, 400, getMessage(lang, "Description contains inappropriate content that violates our policy"));
        }
        return handleSuccess(res, 200, getMessage(lang, "Description is appropriate and meets our policy requirements"));
    } catch (err) {
        console.error("List Car Error:", err);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

// --------------------------------------------as Guest user module -------------------------------------------------//

//     try {
//             data = await Promise.all(data.map(async (item) => {
//                 item.isWishlist = isCarInWishListOrNot.length > 0 ? true : false
//                 item.carImages = carImgObjects.map(img => img.images);
//             }));
//         } else {
//             data = [];
//         }
//         data = data.length > 0 ? data : []
//     } catch (error) {
//     }
// };

//working without total cars 
//     try {
//             brandName,
//             carModel,
//             totalPrice,
//             fuelType,
//             carColor,
//             sittingCapacity,
//             sellerType,
//             search,
//             priceRange,
//             transmission,
//             min_mileage,
//             max_mileage,
//             min_year,
//             max_year,
//             unit,
//             min_hp,
//             max_hp,
//             body_type,
//             consumption,
//             drive_type_id,
//             mfk_warrenty_id,
//             state_id,
//             page,
//             limit
//         } = req.query;

//             userId,
//             brandName,
//             carModel,
//             totalPrice,
//             fuelType,
//             carColor,
//             sittingCapacity,
//             sellerType,
//             search,
//             priceRange,
//             transmission,
//             min_mileage,
//             max_mileage,
//             min_year,
//             max_year,
//             unit,
//             min_hp,
//             max_hp,
//             body_type,
//             consumption,
//             drive_type_id,
//             mfk_warrenty_id,
//             state_id,
//             pageSize,
//             offset,
//             language
//         );

//             data = await Promise.all(
//                 data.map(async (item) => {

//                         sellerType: item.seller_type,
//                         role: item.role,
//                         isBlocked: item.isBlocked,
//                         isActive: item.is_active,
//                         fullName: item.fullName,
//                         email: item.email,
//                         phoneNumber: item.phoneNumber,
//                         whatsappNumber: item.whatsappNumber,
//                         profileImage: item.profileImage,
//                         city: item.city,
//                         pincode: item.pincode,
//                         fullAddress: item.fullAddress,
//                         companyName: item.companyName,
//                         companyAddress: item.companyAddress
//                     };

//                         ...item,
//                         warranty_type_id: item.warranty_type_id_resolved ?? item.warranty_type_text ?? null,
//                         warranty_type_value: item.warranty_type_value ?? null,
//                         warranty_value: item.warranty_value ?? null,
//                         leasing_value: item.leasing_value ?? item.leasingPrice ?? null,
//                         annual_interest_rate: item.annual_interest_rate ?? null,
//                         residual_value: item.residual_value ?? null,
//                         isWishlist: false,
//                         carImages: carImgObjects.map(img => img.images),
//                         sellerDetails
//                     };
//                 })
//             );
//         }

//             data.forEach((item) => {
//                 delete item.warranty_type_id_resolved;
//             });
//         }

//             res,
//             200,
//             getMessage(language, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY),
//             data || []
//         );

//     } catch (error) {
//         console.error(error);
//             res,
//             500,
//             getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
//         );
//     }
// };

export const getAllMakes = async (req, res) => {

    try {
        const search = req.query.search || "";
        const result = await getAllMakesModel(search);
        return handleSuccess(
            res,
            200,
            "Makes fetched successfully",
            result
        );

    } catch (error) {
        console.log(error);
        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};

// ======================================================
// GET MODELS BY MAKE
// ======================================================

export const getModelsByMake = async (req, res) => {

    try {

        const { brand_id } = req.params;

        const search = req.query.search || "";

        const result = await getModelsByMakeModel(
            brand_id,
            search
        );

        return handleSuccess(
            res,
            200,
            "Models fetched successfully",
            result
        );

    } catch (error) {

        console.log(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};

export const getModelsListWeb = async (req, res) => {
   try {
           const { brand_id } = req.params;
   
           if (!brand_id) {
               return res.status(400).json({
                   success: false,
                   message: "brand_id is required"
               });
           }
   
           const activeFiltersInput = parseFacetedInput(
               req.query.active_filters ?? req.query.applied_filters
           );
   
           const normalizedFilters = normalizeFacetedFilters(activeFiltersInput);
   
           const result = await getModelsFacetListModelweb(
               brand_id,
               normalizedFilters
           );
   
           const total_count = result.reduce(
               (sum, item) => sum + (Number(item?.count) || 0),
               0
           );
   
           const formattedResult = result.map((item) => {
               if (item.models?.length === 1) {
                   return item.models[0];
               }
   
               return item;
           });
   
           return res.status(200).json({
               success: true,
               message: "Models fetched successfully",
               total_count,
               data: formattedResult
           });
   
       } catch (error) {
           console.log(error);
   
           return res.status(500).json({
               success: false,
               message: "Something went wrong"
           });
       }
   
   

};
