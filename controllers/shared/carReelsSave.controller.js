import { saveAcarReels, fetchSavedCarReelsByUserId, getProfileReelById, getCarsByIds, removeCarReels } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const saveCarReels = async (req, res) => {
    try {
        let { id, language } = req.user;
        let { carId, reelType } = req.body
        let obj = {
            userId: id,
            carId: carId,
            reelType: reelType
        }
        let data = await saveAcarReels(obj);
        data = data.length > 0 ? data : []
        return handleSuccess(res, 200, getMessage(language, variableTypes.REEL_SAVED_SUCCESSFULLY), data);
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
}

//     try {
//             data = await Promise.all(data.map(async (item) => {
//                 item.isSavedReel = fetchReelsSaved.length > 0 ? fetchReelsSaved : []
//             }))
//         } else {
//             data = []
//         }
//     } catch (error) {
//     }
// }

export const fetchedSavedCarReels = async (req, res) => {
    try {
        let { id, language } = req.user;

        let data = await fetchSavedCarReelsByUserId(id);

        if (data.length > 0) {

            data = await Promise.all(
                data.map(async (item) => {

                    // PROFILE REEL
                    if (item.reelType === "profile") {

                        const profileReel = await getProfileReelById(item.carId);
                        item.isSavedReel =
                            profileReel.length > 0
                                ? {
                                    id: profileReel[0].id,
                                    fullModel: null,

                                    carReel: profileReel[0].reel_url,
                                    reelThumbnails: profileReel[0].thumbnail,

                                    isSavedReel: true,
                                    carReelInfo: null,

                                    price: null,
                                    year: null,
                                    mileage: null,
                                    firstRegistration: null,

                                    fuelType: null,
                                    power: null,
                                    transmission: null,
                                    consumption: null,

                                    accountType: null,
                                    sellerAddress: null,
                                    sellerRating: null,
                                    sellerLogo: null,

                                    captions: profileReel[0].captions || null,
                                    reelType: "profile",
                                    user_id: profileReel[0].user_id,
                                    createdAt: profileReel[0].createdAt
                                }
                                : null;

                        return item;
                    }

                    // CAR REEL
                    let carData = await getCarsByIds(item.carId);
                    carData = carData.map((car) => (
                        {

                            ...car,
                            price: car.price,
                        }));
                    item.isSavedReel =
                        carData.length > 0
                            ? {
                                ...carData[0],
                                reelType: "car"
                            }
                            : null;

                    return item;
                })
            );

        } else {
            data = [];
        }
        return handleSuccess(
            res,
            200,
            getMessage(
                language,
                variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY
            ),
            data
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

export const removeSavedCarsReel = async (req, res) => {
    try {
        let { id, language } = req.user;
        let { carId } = req.body
        await removeCarReels(carId, id);
        return handleSuccess(res, 200, getMessage(language, variableTypes.CAR_REMOVED_SUCCESSFULLY));
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
}

//-----------------------------------------------------end------------------------------------------------
