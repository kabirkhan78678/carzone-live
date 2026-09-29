import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess, handleSuccessNew } from '../../utils/responseHandler.js';
import { getVersionsListModel } from '../../models/user.model.js';

export const getVersionsList = async (req, res) => {
    try {
        const { model_id } = req.query;
        const lang = req.query.lang || "en";
        if (!model_id) {
            return handleError(res, 400, "model_id is required");
        }
        const result = await getVersionsListModel(
            model_id,
            lang
        );

        const fuelMap = new Map();
        const transmissionMap = new Map();
        const bodyMap = new Map();
        const horsepowerSet = new Set();
        const doorsSet = new Set();
        const driveMap = new Map();

        const parsedResult = result.map(item => {

            let rawPayload = null;

            let rawPayloadStringifyEng = null;

            rawPayload =
                item.raw_payload
                    ? JSON.parse(item.raw_payload)
                    : null;

            rawPayloadStringifyEng =
                item.raw_payload_stringify_eng
                    ? JSON.parse(
                        item.raw_payload_stringify_eng
                    )
                    : null;

            if (
                item.local_fuel_id &&
                item.local_fuel_code
            ) {

                fuelMap.set(
                    item.local_fuel_id,
                    {
                        id: item.local_fuel_id,
                        value:
                            item.fuel_translation ||
                            item.local_fuel_code
                    }
                );
            }

            if (
                item.local_transmission_id &&
                item.local_transmission_code
            ) {

                transmissionMap.set(
                    item.local_transmission_id,
                    {
                        id: item.local_transmission_id,
                        value:
                            item.transmission_translation ||
                            item.local_transmission_code
                    }
                );
            }

            if (
                item.local_body_id &&
                item.local_body_code
            ) {

                bodyMap.set(
                    item.local_body_id,
                    {
                        id: item.local_body_id,
                        value:
                            item.body_translation ||
                            item.local_body_code
                    }
                );
            }

            if (
                item.local_drive_id &&
                item.local_drive_code
            ) {

                driveMap.set(
                    item.local_drive_id,
                    {
                        id: item.local_drive_id,
                        value:
                            item.drive_translation ||
                            item.local_drive_code
                    }
                );
            }

            const ps =
                rawPayload?.data?.[0]?.ps || null;

            const kw =
                rawPayload?.data?.[0]?.kw || null;

            if (ps || kw) {

                horsepowerSet.add(
                    `${ps || 0} (${kw || 0})`
                );
            }

            const doors =
                rawPayload?.data?.[0]?.doors ||
                null;

            if (doors) {

                doorsSet.add(
                    Number(doors)
                );
            }

            if (rawPayload && Array.isArray(rawPayload.data)) {
                rawPayload.data = rawPayload.data.map((d) => ({
                    ...d,
                    fuel_name: item.fuel_translation || item.local_fuel_code,
                    transmission_name: item.transmission_translation || item.local_transmission_code,
                    drive_name: item.drive_translation,
                    body_name:
                        item.body_translation ||
                        item.local_body_code,
                }));
            }

            return {
                id: item.id,
                model_id: item.model_id,
                fzkey: item.fzkey,
                version_name: item.version_name,
                production_from: item.production_from,
                production_to: item.production_to,
                raw_payload: rawPayload,
                raw_payload_stringify_eng: rawPayloadStringifyEng,
                model_name: item.model_name,
                vehicle_type: item.vehicle_type,
                brand_name: item.brand_name
            };
        });

        return res.status(200).json({

            success: true,

            message:
                "Versions fetched successfully",

            data: parsedResult,

            filters: {

                fuel_types: Array.from(
                    fuelMap.values()
                ),

                transmissions: Array.from(
                    transmissionMap.values()
                ),

                body_types: Array.from(
                    bodyMap.values()
                ),

                horsepower: Array.from(
                    horsepowerSet
                ).map((item) => ({
                    value: item
                })),

                doors: Array.from(
                    doorsSet
                )
                    .sort((a, b) => a - b)
                    .map((item) => ({
                        value: item
                    }))
            }
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};

export const parseVehicleCatalogLookupRows = (rows = []) => {
    return rows.map((item) => {
        let rawPayload = null;
        let rawPayloadStringifyEng = null;
        let typeApprovalNumbers = [];

        try {
            rawPayload = item.raw_payload ? JSON.parse(item.raw_payload) : null;
        } catch (e) {
            rawPayload = null;
        }

        try {
            rawPayloadStringifyEng = item.raw_payload_stringify_eng
                ? JSON.parse(item.raw_payload_stringify_eng)
                : null;
        } catch (e) {
            rawPayloadStringifyEng = null;
        }

        try {
            typeApprovalNumbers = item.type_approval_numbers
                ? JSON.parse(item.type_approval_numbers)
                : [];
        } catch (e) {
            typeApprovalNumbers = [];
        }

        if (rawPayload && Array.isArray(rawPayload.data)) {
            rawPayload.data = rawPayload.data.map((d) => ({
                ...d,
                fuel_name: item.fuel_translation || item.local_fuel_code,
                transmission_name: item.transmission_translation || item.local_transmission_code,
                drive_name: item.drive_translation || item.local_drive_code,
                body_name: item.body_translation || item.local_body_code,
                body_image: item.body_image || null
            }));
        }

        return {
            id: item.id,
            model_id: item.model_id,
            fzkey: item.fzkey,
            version_name: item.version_name,
            production_from: item.production_from,
            production_to: item.production_to,
            vin_number: item.vin_number || null,
            type_approval_numbers: typeApprovalNumbers,
            raw_payload: rawPayload,
            raw_payload_stringify_eng: rawPayloadStringifyEng,
            model_name: item.model_name,
            vehicle_type: item.vehicle_type,
            brand_name: item.brand_name
        };
    });
};
