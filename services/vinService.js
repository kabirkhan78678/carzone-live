import axios from 'axios';

const VEHICLE_API_URL = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevin";
const VEHICLE_API_KEY = process.env.VEHICLE_API_KEY; 

export const decodeVin = async (vin) => {
  try {
    const response = await axios.get(`${VEHICLE_API_URL}/${vin}`, {
      params: {
        format: "json"
      },
      headers: {
        "Ocp-Apim-Subscription-Key": VEHICLE_API_KEY,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || "Something went wrong",
      },
    };
  }
};
