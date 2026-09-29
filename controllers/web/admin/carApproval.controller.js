import { variableTypes } from '../../utils/constant.js';
import { fetchallCars, fetchCarImagesByCarId, getFullCarById, changeMfkCarStatusModel } from '../../models/admin.model.js';
import { updateSellerCars } from '../../models/user.model.js';
import { notifyListingEvent } from '../../services/notificationDispatchers.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

export const listAllcars = async (req, res) => {
  try {
    const { search = '', isActive = '', createdAt = '' } = req.query;
    const cars = await fetchallCars(search, isActive, createdAt);
    const carImgObjects = await fetchCarImagesByCarId();

    const imageMap = {};
    carImgObjects.forEach((img) => {
      if (!imageMap[img.carId]) {
        imageMap[img.carId] = [];
      }
      imageMap[img.carId].push(img.images);
    });
    const carsWithImages = cars.map((car) => ({
      ...car,
      carImages: imageMap[car.id] || [],
    }));

    return handleSuccess(res, 200, getMessage("en", variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY), carsWithImages);
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const fetchCarById = async (req, res) => {
  try {
    const id = req.query.id || req.query.carId || req.query.car_id;
    if (!id) {
      return handleError(res, 400, 'Car ID is required');
    }
    const car = await getFullCarById(id);
    if (!car) {
      return handleError(res, 404, getMessage("en", variableTypes.CAR_NOT_FOUND));
    }
    return handleSuccess(res, 200, getMessage("en", variableTypes.CAR_DETAILS_FETCHED_SUCCESSFULLY), car);
  } catch (error) {
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};

export const changeMfkCarStatus = async (req, res) => {
  try {
    const id = req.body.id || req.body.carId || req.body.car_id;
    const { status } = req.body;

    if (!id) {
      return handleError(res, 400, 'Car ID is required');
    }

    if (!status) {
      return handleError(res, 400, 'status is required');
    }

    await changeMfkCarStatusModel(status, id);
    return handleSuccess(res, 200, `MFK status updated successfully`);
  } catch (error) {
    console.error("Update MFK status error:", error);
    return handleError(res, 500, getMessage("en", "INTERNAL_SERVER_ERROR"));
  }
};

export const rejectCarListing = async (req, res) => {
  try {
    const id = req.params.id || req.body.carId || req.body.id;
    const { reason = 'Listing did not meet platform guidelines' } = req.body;

    if (!id) {
      return handleError(res, 400, 'Car ID is required');
    }

    const car = await getFullCarById(id);
    if (!car) {
      return handleError(res, 404, getMessage("en", variableTypes.CAR_NOT_FOUND));
    }

    await updateSellerCars({ listing_status: 'rejected', rejection_reason: reason }, id);

    const carName = [car.selectYear || car.carYear, car.brandName, car.carModel || car.modelName].filter(Boolean).join(' ') || 'Vehicle';
    notifyListingEvent({
      sellerId: car.user_id,
      carId: id,
      event: 'rejected',
      carName,
      reason
    }).catch((err) => console.error("Error notifying seller of rejected listing:", err));

    return handleSuccess(res, 200, 'Listing rejected successfully and seller notified');
  } catch (error) {
    console.error("Error rejecting car listing:", error);
    return handleError(res, 500, getMessage("en", variableTypes.INTERNAL_SERVER_ERROR));
  }
};
