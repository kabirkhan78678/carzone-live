import { callVehicleVrnAPI } from '../utils/vehicleVrnClient.js';

// code by raj third party api calling and get data


export const fetchVehicleByVRN = async ({ vrn }) => {
  const response = await callVehicleVrnAPI(vrn);

  // Swagger response → data is an array
  const vehicle = response?.data?.[0];

  if (!vehicle) {
    throw {
      statusCode: 404,
      message: "Vehicle not found for given VRN"
    };
  }

  // Normalize data exactly as per Figma
  return {
    vehicleCharacteristics: {
      make: vehicle.brand ?? null,
      model: vehicle.model ?? null,
      version: vehicle.version ?? null,
      fuel: vehicle.fuel ?? null,
      transmission: vehicle.gearbox ?? null,
      drive: vehicle.drive ?? null,
      bodyStyle: vehicle.body ?? null
    },

    registration: {
      firstAdmissionDate: vehicle.firstAdmissionDate ?? null,
      vin: vehicle.vin ?? null,
      licensePlate: vehicle.licensePlate ?? null,
      typeApproval: vehicle.typeApprovalNr ?? null
    },

    colors: {
      exterior: vehicle.color ?? null,
      interior: vehicle.innerColor ?? null
    },

    technicalData: {
      engineCC: vehicle.displacement ?? null,
      cylinders: vehicle.cylinders ?? null,
      power: {
        ps: vehicle.ps ?? null,
        kw: vehicle.kw ?? null,
        totalPs: vehicle.totalPs ?? null,
        totalKw: vehicle.totalKw ?? null
      },
      dimensions: {
        length: vehicle.length ?? null,
        width: vehicle.width ?? null,
        height: vehicle.height ?? null
      },
      seats: vehicle.seats ?? null,
      doors: vehicle.doors ?? null,
      batteryCapacity: vehicle.batteryCapacity ?? null,
      electricRange: vehicle.reachElectric ?? null,
      maxSpeed: vehicle.maxSpeed ?? null
    },

    equipment: {
      standard: vehicle.optkeystext
        ? vehicle.optkeystext.split("¿")
        : [],
      extra: vehicle.extraOptkeystext
        ? vehicle.extraOptkeystext.split("¿")
        : []
    }
  };
};
