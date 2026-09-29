import { fetchUsersReelsModel, fetchCarReelById, fetchProfileReelById, fetchMixedReelsByUser, deleteCarsReelByThereIds, deleteUserProfileReelById, removeSavedCarReel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const fetchMyReels = async (req, res) => {
    try {
        let { id, language } = req.user;
        let usersReels = await fetchUsersReelsModel(id);

        usersReels = await Promise.all(usersReels.map(async (item) => {
            const registrationYear = item.year ? new Date(item.year).getUTCFullYear() : null;
            const formattedMileage = item.carMileage
                ? `${Number(item.carMileage).toLocaleString("en-US")} km`
                : null;
            return {
                ...item,
                year: registrationYear,
                mileage: formattedMileage
            };
        }));

        return handleSuccess(res, 200, getMessage(language, 'Reels fetched successfully'), usersReels);
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
}

export const fetchReelById = async (req, res) => {
    try {

        const { id, language } = req.user;

        const reelId = Number(req.query.reel_id || req.query.id);
        let reelType = req.query.reelType;
        if (reelType === 'users_reels') reelType = 'profile';

        const page = Number(req.query.page) || 1;
        const limit = 5;

        if (!reelId || !reelType) {
            return handleError(
                res,
                400,
                "reel_id and reelType are required"
            );
        }

        let reelData = null;

        if (reelType === "car") {

            reelData = await fetchCarReelById(
                reelId,
                id,
                language
            );

        } else if (reelType === "profile") {

            reelData = await fetchProfileReelById(
                reelId
            );

        } else {

            return handleError(
                res,
                400,
                "Invalid reelType"
            );
        }

        if (!reelData) {
            return handleError(
                res,
                404,
                "Reel not found"
            );
        }

        let finalData = [reelData];
        if (reelType === "profile") {

            const mixedReels =
                await fetchMixedReelsByUser(
                    reelData.user_id,
                    reelId,
                    id,
                    language
                );

            const offset =
                (page - 1) * (limit - 1);

            const paginatedMixed =
                mixedReels.slice(
                    offset,
                    offset + (limit - 1)
                );

            finalData = [
                reelData,
                ...paginatedMixed
            ];
        }

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY
            ),
            {
                selectedReelId: reelId,
                currentPage: page,
                data: finalData
            }
        );

    } catch (error) {

        console.log(error);

        return handleError(
            res,
            500,
            getMessage(
                "en",
                variableTypes.INTERNAL_SERVER_ERROR
            )
        );
    }
};

//     try {

//         if (!reelId || !reelType) {
//                 res,
//                 400,
//                 "reel_id and reelType are required"
//             );
//         }

//             reelData = await fetchCarReelById(
//                 reelId,
//                 id,
//                 language
//             );

//         } else if (reelType === "profile") {

//             reelData = await fetchProfileReelById(
//                 reelId
//             );

//         } else {

//                 res,
//                 400,
//                 "Invalid reelType"
//             );
//         }

//         if (!reelData) {
//                 res,
//                 404,
//                 "Reel not found"
//             );
//         }

//             res,
//             200,
//             getMessage(
//                 language,
//                 variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY
//             ),
//             {
//                 selectedReelId: reelId,
//                 data: [reelData]
//             }
//         );

//     } catch (error) {

//             res,
//             500,
//             getMessage(
//                 "en",
//                 variableTypes.INTERNAL_SERVER_ERROR
//             )
//         );
//     }
// };

// -----------------------------delete reel by id and type (car/profile)---------------//

export const deleteReel = async (req, res) => {
    try {
        const { id, language } = req.user;
        const reelId = Number(req.query.reel_id || req.query.id || req.body?.reel_id || req.body?.id);
        let reelType = req.query.reelType || req.body?.reelType;
        if (reelType === 'users_reels') reelType = 'profile';

        if (!reelId || !reelType) {
            return handleError(res, 400, "reel_id and reelType are required");
        }

        if (reelType === "car") {
            await deleteCarsReelByThereIds(reelId);
        } else if (reelType === "profile") {
            await deleteUserProfileReelById(reelId);
        } else {
            return handleError(res, 400, "Invalid reelType");
        }
        return handleSuccess(res, 200, getMessage(language, 'Reel deleted successfully'));

    } catch (error) {
        console.log(error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const removeSavedCarReels = async (req, res) => {
    try {
        const { id, language } = req.user;
        const { carId, reelType } = req.body;

        if (!carId) {
            return handleError(
                res,
                400,
                getMessage(language, variableTypes.CAR_ID_REQUIRED)
            );
        }

        if (!reelType) {
            return handleError(
                res,
                400,
                "Reel type is required"
            );
        }

        const deleted = await removeSavedCarReel({
            userId: id,
            carId,
            reelType
        });

        if (!deleted.affectedRows) {
            return handleError(
                res,
                404,
                getMessage(
                    language,
                    variableTypes.SAVED_REEL_NOT_FOUND
                )
            );
        }

        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                variableTypes.REEL_REMOVED_SUCCESSFULLY
            ),
            []
        );

    } catch (error) {
        console.error(
            "removeSavedCarReels Error:",
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
