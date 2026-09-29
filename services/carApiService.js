import axios from 'axios';

class CarApiService {
    constructor() {
        this.apiKey = process.env.CAR_API_KEY;
        this.baseURL = 'https://car-api2.p.rapidapi.com/api';
        this.host = 'car-api2.p.rapidapi.com';

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': this.host,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    async getAllBrands() {
        try {
            const response = await this.client.get('/makes');
            return {
                success: true,
                data: response.data.data,
                total: response.data.collection.count,
                message: 'Brands retrieved successfully'
            };
        } catch (error) {
            return this.handleError(error, 'Failed to fetch brands');
        }
    }

    async getModelsByBrand(brand, year = '2020') {
        try {
            const response = await this.client.get(
                `/models?make=${encodeURIComponent(brand)}&year=${year}`
            );
            return {
                success: true,
                data: response.data.data,
                total: response.data.collection.count,
                message: `Models retrieved for ${brand} ${year}`
            };
        } catch (error) {
            return this.handleError(error, 'Failed to fetch models');
        }
    }

    async getVehicleByVIN(vin) {
        try {
            const response = await this.client.get(`/vin/${vin}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return this.handleError(error, 'Failed to fetch vehicle by VIN');
        }
    }

    async getVehicleByModel(brand, model, year) {
        try {
            console.log(`🔍 Fetching data for ${year} ${brand} ${model}...`);

            const [
                modelsResponse,
                trimsResponse,
                bodiesResponse,
                enginesResponse,
                exteriorColorsResponse,
                interiorColorsResponse
            ] = await Promise.all([
                this.getModels(brand, year),
                this.getTrims(brand, model, year),
                this.getBodies(brand, model, year),
                this.getEngines(brand, model, year),
                this.getExteriorColors(brand, model, year),
                this.getInteriorColors(brand, model, year)
            ]);

            const modelDetails = modelsResponse.data.find(
                m => m.name.toLowerCase() === model.toLowerCase()
            );

            const baseTrim = trimsResponse.data[0];

            const vehicleData = this.combineVehicleData({
                brand,
                model,
                year,
                modelDetails,
                baseTrim,
                bodies: bodiesResponse.data,
                engines: enginesResponse.data,
                exteriorColors: exteriorColorsResponse.data,
                interiorColors: interiorColorsResponse.data
            });

            return {
                success: true,
                data: vehicleData,
                message: `Complete data retrieved for ${year} ${brand} ${model}`
            };

        } catch (error) {
            return this.handleError(error, 'Failed to fetch vehicle data by model');
        }
    }

    async getModels(brand, year) {
        const response = await this.client.get(
            `/models?make=${encodeURIComponent(brand)}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    async getTrims(brand, model, year) {
        const response = await this.client.get(
            `/trims?make=${encodeURIComponent(brand)}&model=${encodeURIComponent(
                model
            )}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    async getBodies(brand, model, year) {
        const response = await this.client.get(
            `/bodies?make=${encodeURIComponent(brand)}&model=${encodeURIComponent(
                model
            )}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    async getEngines(brand, model, year) {
        const response = await this.client.get(
            `/engines?make=${encodeURIComponent(brand)}&model=${encodeURIComponent(
                model
            )}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    async getExteriorColors(brand, model, year) {
        const response = await this.client.get(
            `/exterior-colors?make=${encodeURIComponent(
                brand
            )}&model=${encodeURIComponent(model)}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    async getInteriorColors(brand, model, year) {
        const response = await this.client.get(
            `/interior-colors?make=${encodeURIComponent(
                brand
            )}&model=${encodeURIComponent(model)}&year=${year}`
        );
        return {
            success: true,
            data: response.data.data,
            total: response.data.collection.count
        };
    }

    combineVehicleData({
        brand,
        model,
        year,
        modelDetails,
        baseTrim,
        bodies,
        engines,
        exteriorColors,
        interiorColors
    }) {
        const firstBody = bodies?.[0];
        const firstEngine = engines?.[0];

        return {
            firstRegistration: year,
            mileage: null,
            transmission: this.extractTransmission(baseTrim),
            drivetrain: firstBody?.drive_type || null,
            bodyType: firstBody?.type || null,
            power: this.extractPower(firstEngine),
            fuelType: firstEngine?.fuel_type || null,

            engineCapacity: firstEngine?.size_l || null,
            cylinders: firstEngine?.cylinders || null,
            engineDesign: firstEngine ? `${firstEngine.cylinders}-cylinder ${firstEngine.cylinder_configuration}` : null,
            gears: this.extractGears(baseTrim),

            numberOfDoors: firstBody?.doors || null,
            seats: firstBody?.passengers || null,

            length: firstBody?.length_inches || null,
            width: firstBody?.width_inches || null,
            height: firstBody?.height_inches || null,
            curbWeight: firstBody ? `${firstBody.curb_weight_lbs} lbs` : null,

            exteriorColor: exteriorColors?.[0]?.name || null,
            interiorColor: interiorColors?.[0]?.name || null,

            options: {
                trims: baseTrim ? [baseTrim] : [],
                bodies,
                engines,
                exteriorColors,
                interiorColors
            },

            basicInfo: {
                make: brand,
                model,
                year,
                trim: baseTrim?.name || null,
                description: baseTrim?.description || null
            }
        };
    }

    extractTransmission(trim) {
        if (!trim?.description) return null;

        const match = trim.description.match(/(\d+)\s*(automatic|manual)/i);
        if (match) return `${match[1]}-speed ${match[2]}`;

        return null;
    }

    extractGears(trim) {
        if (!trim?.description) return null;
        const match = trim.description.match(/(\d+)[- ]*speed/i);
        return match ? match[1] : null;
    }

    extractPower(engine) {
        return engine?.horsepower ? `${engine.horsepower} PS` : null;
    }

    handleError(error, customMessage) {
        console.error('Car API Error:', error.response?.data || error.message);

        if (error.response) {
            return {
                success: false,
                error: customMessage,
                status: error.response.status,
                details: error.response.data
            };
        }

        return {
            success: false,
            error: customMessage,
            details: error.message
        };
    }
}

const carApiService = new CarApiService();
export default carApiService;
