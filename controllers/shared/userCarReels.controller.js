import { fetchSavedCarReelsByUserId, getCarsByIds } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage, getChfFormattedPrice } from '../../utils/user_helper.js';

export const fetchCarReels = async (req, res) => {
    try {
        let { id, language } = req.user;

        let data = await fetchSavedCarReelsByUserId(id);

        if (data.length > 0) {
            data = await Promise.all(
                data.map(async (item) => {
                    let fetchReelsSaved = await getCarsByIds(item.carId);

                    if (fetchReelsSaved.length > 0) {
                        const car = fetchReelsSaved[0];
                        const price = car.totalPrice || car.selling_price || car.price;
                        return {
                            id: item.id,
                            carId: item.carId,
                            isSavedReel: true,
                            fullModel: `${car.brandName} ${car.carModel}`,
                            carReel: car.carReel,
                            reelThumbnails: car.reelThumbnails,
                            carReelInfo: `${getChfFormattedPrice(price)} | ${car.selectYear || "N/A"} | ${car.carMileage ? car.carMileage.toLocaleString("en-US") + " km" : ""}`,
                        };
                    }

                    return null;
                })
            );

            data = data.filter(item => item !== null);
        } else {
            data = [];
        }

        return handleSuccess(
            res,
            200,
            getMessage(language, variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY),
            {
                totalItems: data.length,
                data
            }
        );
    } catch (error) {
        console.error("fetchCarReels error:", error);
        return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
    }
};
