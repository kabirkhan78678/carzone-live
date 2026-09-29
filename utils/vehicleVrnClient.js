import axios from 'axios';
import { THIRD_PARTY } from '../config/thirdParty.config.js';

// code by raj 



export const callVehicleVrnAPI = async (vrn) => {
  try {
    const response = await axios.get(
      `${THIRD_PARTY.BASE_URL}/vehiclebuild/vrn/${vrn}`,
      {
        headers: {
          "x-api-key": THIRD_PARTY.API_KEY
        },
        timeout: 8000
      }
    );

    // IMPORTANT:
    // We return exactly what swagger gives (no modification here)
    return response.data;
  } catch (error) {
    throw {
      statusCode: 502,
      message: "Vehicle identification service unavailable"
    };
  }
};
