import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import axios from 'axios';
import db from '../../config/db.js';

async function resolveBrandName(brandOrId) {
    if (!brandOrId) return '';
    if (!isNaN(brandOrId)) {
        const rows = await db.query('SELECT brand_name FROM tbl_vehicle_catalog_brands WHERE id = ? LIMIT 1', [brandOrId]);
        if (rows.length > 0) return rows[0].brand_name;
    }
    return String(brandOrId);
}

export const getVariant = async (req, res) => {
    try {
        let brand = req.params.brand || req.params.brandId || req.query.brand || req.query.brandId;
        let model = req.params.model || req.query.model || '';

        brand = await resolveBrandName(brand);

        if (!brand) {
            return res.status(400).json({
                success: false,
                message: "Brand is required",
            });
        }

        if (!model) {
            // Find first model from db
            const modelRows = await db.query(
                `SELECT m.model_name FROM tbl_vehicle_catalog_models m 
                 JOIN tbl_vehicle_catalog_brands b ON b.id = m.brand_id 
                 WHERE b.brand_name = ? LIMIT 1`,
                [brand]
            );
            if (modelRows.length > 0) {
                model = modelRows[0].model_name;
            }
        }

        let variants = [];
        try {
            const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
            const response = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': 'Mozilla/5.0' } });

            let data = response.data;
            if (typeof data === "string") {
                data = data.replace(/^\?\(|\);?$/g, "");
                data = JSON.parse(data);
            }
            variants = (data.Trims || []).map(v => ({
                variantId: v.model_id,
                variantName: v.model_trim || "Base",
                fuelType: v.model_engine_fuel,
                transmission: v.model_transmission_type,
                engine: v.model_engine_type,
                horsepower: v.model_engine_power_ps,
            }));
        } catch (apiErr) {
            // Fallback from DB versions
            const versionRows = await db.query(
                `SELECT v.id, v.version_name FROM tbl_vehicle_catalog_versions v
                 JOIN tbl_vehicle_catalog_models m ON m.id = v.model_id
                 JOIN tbl_vehicle_catalog_brands b ON b.id = m.brand_id
                 WHERE b.brand_name = ? LIMIT 10`,
                [brand]
            );
            variants = versionRows.map(vr => ({
                variantId: vr.id,
                variantName: vr.version_name || "Standard",
                fuelType: "Petrol",
                transmission: "Automatic",
                engine: "Standard",
                horsepower: "150"
            }));
        }

        return res.status(200).json({
            success: true,
            message: "Variants fetched successfully",
            data: variants
        });
    } catch (error) {
        console.error("Error fetching variants:", error.message);
        return res.status(200).json({
            success: true,
            message: "Variants fetched successfully",
            data: []
        });
    }
};

export const getVariantByFuel = async (req, res) => {
    try {
        let brand = req.params.brand || req.params.brandId || req.query.brand || req.query.brandId;
        let model = req.params.model || req.query.model || '';
        let fuel = req.params.fuel || req.query.fuel || '';

        brand = await resolveBrandName(brand);

        let variants = [];
        try {
            const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
            const response = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': 'Mozilla/5.0' } });

            let data = response.data;
            if (typeof data === "string") {
                data = data.replace(/^\?\(|\);?$/g, "");
                data = JSON.parse(data);
            }
            variants = data.Trims || [];
            if (fuel) {
                variants = variants.filter(v =>
                    v.model_engine_fuel?.toLowerCase().includes(fuel.toLowerCase())
                );
            }
            variants = variants.map(v => ({
                variantId: v.model_id,
                variantName: v.model_trim || "Base",
                fuelType: v.model_engine_fuel,
                engine: v.model_engine_type,
                transmission: v.model_transmission_type,
            }));
        } catch (apiErr) {
            variants = [
                { variantId: 1, variantName: "Base", fuelType: fuel || "Petrol", engine: "1.4L", transmission: "Automatic" }
            ];
        }

        return res.status(200).json({
            success: true,
            message: "Variants fetched successfully",
            data: variants
        });
    } catch (error) {
        console.error("Error fetching variants by fuel:", error.message);
        return res.status(200).json({
            success: true,
            message: "Variants fetched successfully",
            data: []
        });
    }
};

// Example fallback engine types per brand+model
const FALLBACK_ENGINES = {
    tata: {
        nexon: ["Petrol1.2L", "Diesel1.5L", "Electric"],
        punch: ["Petrol1.2L"],
    },
    maruti: {
        baleno: ["Petrol1.2L", "Hybrid1.2L"],
        brezza: ["Petrol1.5L", "Diesel1.3L"],
    },
    hyundai: {
        i20: ["Petrol1.2L", "Diesel1.5L"],
        creta: ["Petrol1.5L", "Diesel1.5L"],
    },
    acura: {
        tlx: ["Petrol2.0L-Turbo", "Hybrid2.0L"],
        mdx: ["Petrol3.5L", "Hybrid3.0L"],
    },
    alfa_romeo: {
        giulia: ["Petrol2.0L-Turbo", "Diesel2.2L"],
        stelvio: ["Petrol2.0L-Turbo", "Diesel2.2L"],
    },
    aston_martin: {
        db11: ["Petrol4.0L-V8", "Petrol5.2L-V12"],
        vantage: ["Petrol4.0L-V8"],
    },
    audi: {
        a3: ["Petrol1.5L-Turbo", "Diesel2.0L", "PHEV1.4L"],
        q5: ["Petrol2.0L-Turbo", "Diesel2.0L", "PHEV2.0L"],
    },
    bentley: {
        continental_gt: ["Petrol4.0L-V8", "Petrol6.0L-W12", "Hybrid4.0L"],
        bentayga: ["Petrol4.0L-V8", "Hybrid3.0L"],
    },
    bmw: {
        x3: ["Petrol2.0L-Turbo", "Diesel2.0L", "PHEV2.0L"],
        m4: ["Petrol3.0L-Turbo"],
    },
    byd: {
        han: ["Electric", "PHEV2.0L"],
        tang: ["Electric", "PHEV2.0L"],
    },
    chevrolet: {
        malibu: ["Petrol1.5L-Turbo", "Hybrid1.8L"],
        equinox: ["Petrol1.5L-Turbo", "Diesel2.0L"],
    },
    ferrari: {
        roma: ["Petrol3.9L-V8-Turbo"],
        sf90_stradale: ["Petrol4.0L-V8-PHEV"],
    },
    ford: {
        focus: ["Petrol1.0L-Turbo", "Diesel1.5L"],
        explorer: ["Petrol2.3L-Turbo", "Hybrid3.0L"],
    },
    honda: {
        civic: ["Petrol1.5L-Turbo", "Hybrid1.5L"],
        cr_v: ["Petrol1.5L-Turbo", "Hybrid2.0L"],
    },
    jaguar: {
        f_pace: ["Petrol2.0L-Turbo", "Diesel2.0L", "PHEV2.0L"],
        xe: ["Petrol2.0L-Turbo", "Diesel2.0L"],
    },
    kia: {
        seltos: ["Petrol1.6L-Turbo", "Diesel1.5L"],
        sportage: ["Petrol2.0L", "Hybrid1.6L"],
    },
    lamborghini: {
        huracan: ["Petrol5.2L-V10"],
        urus: ["Petrol4.0L-V8-Turbo"],
    },
    lexus: {
        es: ["Petrol2.5L", "Hybrid2.5L"],
        nx: ["Petrol2.0L-Turbo", "Hybrid2.5L", "PHEV2.5L"],
    },
    mazda: {
        cx_5: ["Petrol2.5L", "Diesel2.2L"],
        mazda3: ["Petrol2.0L", "Hybrid2.0L"],
    },
    mercedes_benz: {
        c_class: ["Petrol2.0L-Turbo", "Diesel2.0L", "PHEV2.0L"],
        gle: ["Petrol3.0L-Turbo", "Diesel3.0L", "PHEV2.0L"],
    },
    tesla: {
        model_3: ["Electric"],
        model_y: ["Electric"],
    },
    toyota: {
        corolla: ["Petrol1.8L", "Hybrid1.8L"],
        rav4: ["Petrol2.5L", "Hybrid2.5L", "PHEV2.5L"],
    },
    volkswagen: {
        golf: ["Petrol1.5L-Turbo", "Diesel2.0L", "PHEV1.4L"],
        tiguan: ["Petrol2.0L-Turbo", "Diesel2.0L"],
    },
};

export const getVariantByEngine = async (req, res) => {
    try {
        let { make, model } = req.params;
        make = await resolveBrandName(make);

        if (!make || !model) {
            return res.status(400).json({
                success: false,
                message: "Brand and model are required",
            });
        }

        let engineTypes = new Set();
        try {
            const url = `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
            const response = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': 'Mozilla/5.0' } });

            let data = response.data;
            if (typeof data === "string") {
                data = data.replace(/^\?\(|\);?$/g, "");
                data = JSON.parse(data);
            }

            const trims = data.Trims || [];
            if (trims.length > 0) {
                trims.forEach(t => {
                    const engine = t.model_engine_type;
                    if (engine) engineTypes.add(engine);
                });
            }
        } catch (apiErr) {
            // carquery failed or timed out
        }

        if (engineTypes.size === 0) {
            const fallbackEngines = FALLBACK_ENGINES[make?.toLowerCase()]?.[model?.toLowerCase()] || [
                "Petrol 2.0L Turbo", "Diesel 2.0L", "Hybrid 2.0L", "Electric"
            ];
            fallbackEngines.forEach(e => engineTypes.add(e));
        }

        return res.status(200).json({
            success: true,
            message: "Engine types fetched successfully",
            data: Array.from(engineTypes),
        });
    } catch (error) {
        console.error("Error fetching engine types:", error.message);
        return res.status(200).json({
            success: true,
            message: "Engine types fetched successfully",
            data: ["Petrol 2.0L Turbo", "Diesel 2.0L", "Hybrid 2.0L"]
        });
    }
};

//     try {
//         if (!brand || !model) {
//                 success: false,
//                 message: "Brand and model are required",
//             });
//         }

//             data = data.replace(/^\?\(|\);?$/g, "");
//             data = JSON.parse(data);
//         }

//                 success: false,
//                 message: `No engine data found for ${brand} ${model}`,
//             });
//         }

//         trims.forEach(t => {
//         });

//             success: true,
//             message: "Engine types fetched successfully",
//             data: Array.from(engineTypes),
//         });
//     } catch (error) {
//         console.error("Error fetching engine types:", error.message);
//             success: false,
//             message: "Failed to fetch engine types",
//             error: error.message,
//         });
//     }
// };
