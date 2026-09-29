import db from '../../config/db.js';
import { getPurchaseAgreementById } from '../../models/user/purchaseAgreement.model.js';
import { findCarByIdAndUser } from '../../models/user/carCrud.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

/**
 * Controller for updating an existing Purchase Agreement draft.
 * Endpoint: PUT /purchase-agreements/:id
 */
export const updatePurchaseAgreementController = async (req, res) => {
    try {
        const lang = req.user?.language || 'en';

        // 1. Authorization: User must be authenticated
        if (!req.user || !req.user.id) {
            return handleError(
                res,
                401,
                getMessage(lang, 'User authentication is required')
            );
        }

        // 2. Authorization: User must be a company / dealer
        if (req.user.account_type !== 'company') {
            return handleError(
                res,
                403,
                getMessage(lang, 'PURCHASE_AGREEMENT_DEALER_ONLY')
            );
        }

        // 3. Agreement ID verification
        const { id: agreementId } = req.params;
        if (!agreementId || isNaN(Number(agreementId))) {
            return handleError(
                res,
                400,
                getMessage(lang, 'PURCHASE_AGREEMENT_ID_REQUIRED')
            );
        }

        const numericAgreementId = Number(agreementId);

        // 4. Fetch existing agreement record (deleted_at IS NULL)
        const existingAgreement = await getPurchaseAgreementById(numericAgreementId);

        // 5. Ownership & Existence check
        if (!existingAgreement || Number(existingAgreement.seller_user_id) !== Number(req.user.id)) {
            return handleError(
                res,
                404,
                getMessage(lang, 'PURCHASE_AGREEMENT_NOT_FOUND')
            );
        }

        // 6. Status check: Only DRAFT agreements can be updated
        if (existingAgreement.status !== 'DRAFT') {
            return handleError(
                res,
                400,
                getMessage(lang, 'PURCHASE_AGREEMENT_ONLY_DRAFT_CAN_BE_UPDATED')
            );
        }

        // 7. Verify Vehicle Ownership for associated vehicle_id
        const numericVehicleId = Number(existingAgreement.vehicle_id);
        const carOwnershipRows = await findCarByIdAndUser(numericVehicleId, req.user.id);
        if (!carOwnershipRows || carOwnershipRows.length === 0) {
            return handleError(
                res,
                404,
                getMessage(lang, 'Vehicle not found or does not belong to the authenticated dealer') || 'Vehicle not found or does not belong to the authenticated dealer'
            );
        }

        const carBasic = carOwnershipRows[0];
        if (carBasic.is_deleted === 1) {
            return handleError(
                res,
                404,
                getMessage(lang, 'Vehicle not found') || 'Vehicle not found'
            );
        }

        const body = req.body || {};

        // Helper conventions
        const isBlankString = (value) => typeof value === 'string' && value.trim() === '';
        const isNullLike = (value) =>
            value === null || (typeof value === 'string' && value.trim().toLowerCase() === 'null');

        const convertDate = (date) => {
            if (!date) return null;
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
            const dateStr = String(date).trim();
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    if (parts[0].length === 4) return dateStr.substring(0, 10); // YYYY-MM-DD
                    if (parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
                }
            }
            return dateStr;
        };

        // 8. Track vehicle updates for tbl_cars (Partial update: only update if field was provided)
        const vehicleUpdateData = {};

        // Make / brandName
        const rawMake = body.make !== undefined ? body.make : body.brandName;
        if (rawMake !== undefined) {
            if (rawMake !== null && !isNullLike(rawMake) && !isBlankString(rawMake)) {
                vehicleUpdateData.brandName = String(rawMake).trim();
            }
        }

        // Model / carModel
        const rawModel = body.model !== undefined ? body.model : body.carModel;
        if (rawModel !== undefined) {
            if (rawModel !== null && !isNullLike(rawModel) && !isBlankString(rawModel)) {
                vehicleUpdateData.carModel = String(rawModel).trim();
            }
        }

        // VIN
        const rawVin = body.vin !== undefined ? body.vin : body.vin_number;
        if (rawVin !== undefined) {
            if (rawVin !== null && !isNullLike(rawVin) && !isBlankString(rawVin)) {
                vehicleUpdateData.vin_number = String(rawVin).trim();
            }
        }

        // Stammnummer / registration_master_number
        const rawStammnummer = body.stammnummer !== undefined ? body.stammnummer : body.registration_master_number;
        if (rawStammnummer !== undefined) {
            if (rawStammnummer !== null && !isNullLike(rawStammnummer) && !isBlankString(rawStammnummer)) {
                vehicleUpdateData.registration_master_number = String(rawStammnummer).trim();
            }
        }

        // Type approval / type_approval_number
        const rawTypeApproval = body.type_approval_number !== undefined ? body.type_approval_number : body.type_approval;
        if (rawTypeApproval !== undefined) {
            if (rawTypeApproval !== null && !isNullLike(rawTypeApproval) && !isBlankString(rawTypeApproval)) {
                vehicleUpdateData.type_approval = String(rawTypeApproval).trim();
            }
        }

        // First registration date
        const rawFirstReg = body.first_registration_date;
        if (rawFirstReg !== undefined) {
            if (rawFirstReg !== null && !isNullLike(rawFirstReg) && !isBlankString(rawFirstReg)) {
                const formattedRegDate = convertDate(rawFirstReg);
                if (formattedRegDate) vehicleUpdateData.first_registration_date = formattedRegDate;
            }
        }

        // Last MFK date
        const rawLastMfk = body.last_mfk_date;
        if (rawLastMfk !== undefined) {
            if (rawLastMfk !== null && !isNullLike(rawLastMfk) && !isBlankString(rawLastMfk)) {
                const formattedMfkDate = convertDate(rawLastMfk);
                if (formattedMfkDate) vehicleUpdateData.last_mfk_date = formattedMfkDate;
            }
        }

        // Mileage / carMileage
        const rawMileage = body.mileage !== undefined ? body.mileage : body.carMileage;
        if (rawMileage !== undefined) {
            if (rawMileage !== null && !isNullLike(rawMileage) && !isBlankString(rawMileage)) {
                const parsedMileage = Number(String(rawMileage).replace(/[^0-9]/g, ''));
                if (!isNaN(parsedMileage)) vehicleUpdateData.carMileage = String(parsedMileage);
            }
        }

        // Color / exterior_color_custom
        const rawColor = body.color !== undefined ? body.color : body.exterior_color_custom;
        if (rawColor !== undefined) {
            if (rawColor !== null && !isNullLike(rawColor) && !isBlankString(rawColor)) {
                vehicleUpdateData.exterior_color_custom = String(rawColor).trim();
                vehicleUpdateData.exterior_color_id = null;
            }
        }

        // Power / powerOutput
        const rawPower = body.power !== undefined ? body.power : body.powerOutput;
        if (rawPower !== undefined) {
            if (rawPower !== null && !isNullLike(rawPower) && !isBlankString(rawPower)) {
                const powerStr = String(rawPower).trim();
                vehicleUpdateData.powerOutput = powerStr;
                const kwMatch = powerStr.match(/(\d+)\s*(?:kw)?/i);
                const psMatch = powerStr.match(/\((\d+)\s*(?:ps|hp)?\)/i) || powerStr.match(/(\d+)\s*(?:ps|hp)/i);
                if (kwMatch && kwMatch[1]) vehicleUpdateData.power_kw = Number(kwMatch[1]);
                if (psMatch && psMatch[1]) vehicleUpdateData.power_ps = Number(psMatch[1]);
            }
        }

        // Engine displacement / cubic_capacity
        const rawEngineDisplacement = body.engine_displacement !== undefined ? body.engine_displacement : body.cubic_capacity;
        if (rawEngineDisplacement !== undefined) {
            if (rawEngineDisplacement !== null && !isNullLike(rawEngineDisplacement) && !isBlankString(rawEngineDisplacement)) {
                const parsedCubic = Number(String(rawEngineDisplacement).replace(/[^0-9]/g, ''));
                if (!isNaN(parsedCubic) && parsedCubic > 0) {
                    vehicleUpdateData.cubic_capacity = parsedCubic;
                }
            }
        }

        // Body type
        const rawBodyType = body.body_type;
        if (rawBodyType !== undefined) {
            if (rawBodyType !== null && !isNullLike(rawBodyType) && !isBlankString(rawBodyType)) {
                vehicleUpdateData.body_type = String(rawBodyType).trim();
            }
        }

        // Transmission
        const rawTransmission = body.transmission;
        if (rawTransmission !== undefined) {
            if (rawTransmission !== null && !isNullLike(rawTransmission) && !isBlankString(rawTransmission)) {
                vehicleUpdateData.transmission = String(rawTransmission).trim();
            }
        }

        // 9. Build Updated Agreement Snapshot (Partial update: retain existing fields if omitted in request)
        const updatedSnapshot = {};

        // Seller fields
        if (body.seller_contact_person !== undefined) {
            updatedSnapshot.seller_contact_person = (body.seller_contact_person !== null && !isNullLike(body.seller_contact_person) && !isBlankString(body.seller_contact_person))
                ? String(body.seller_contact_person).trim()
                : null;
        }

        if (body.seller_is_legal_owner !== undefined) {
            updatedSnapshot.seller_is_legal_owner = body.seller_is_legal_owner !== null
                ? Boolean(body.seller_is_legal_owner)
                : null;
        }

        // Buyer fields (Boundary mapping)
        const hasFullName = body.fullName !== undefined || body.full_name !== undefined;
        if (hasFullName) {
            const rawFullName = body.fullName !== undefined ? body.fullName : body.full_name;
            updatedSnapshot.buyer_full_name = (rawFullName !== null && !isNullLike(rawFullName) && !isBlankString(rawFullName))
                ? String(rawFullName).trim()
                : null;
        }

        const hasDob = body.dateOfBirth !== undefined || body.date_of_birth !== undefined;
        if (hasDob) {
            const rawDob = body.dateOfBirth !== undefined ? body.dateOfBirth : body.date_of_birth;
            updatedSnapshot.buyer_date_of_birth = rawDob ? convertDate(rawDob) : null;
        }

        const hasAddress = body.fullAddress !== undefined || body.address !== undefined || body.city !== undefined || body.pincode !== undefined;
        if (hasAddress) {
            const rawAddress = body.fullAddress !== undefined ? body.fullAddress : body.address;
            if (rawAddress !== undefined) {
                updatedSnapshot.buyer_address = (rawAddress !== null && !isNullLike(rawAddress) && !isBlankString(rawAddress))
                    ? String(rawAddress).trim()
                    : null;
            } else if (body.city || body.pincode) {
                const addressParts = [body.pincode, body.city].filter(Boolean);
                updatedSnapshot.buyer_address = addressParts.length > 0 ? addressParts.join(' ').trim() : null;
            }
        }

        const hasPhone = body.phoneNumber !== undefined || body.phone !== undefined;
        if (hasPhone) {
            const rawPhone = body.phoneNumber !== undefined ? body.phoneNumber : body.phone;
            if (rawPhone !== null && !isNullLike(rawPhone) && !isBlankString(rawPhone)) {
                const phoneStr = String(rawPhone).trim();
                const countryCodeStr = (body.countryCode !== undefined && body.countryCode !== null) ? String(body.countryCode).trim() : '';

                if (countryCodeStr && !phoneStr.startsWith('+') && !phoneStr.startsWith('00')) {
                    const cleanCountryCode = countryCodeStr.startsWith('+') ? countryCodeStr : `+${countryCodeStr}`;
                    const cleanPhone = phoneStr.replace(/^0+/, '');
                    updatedSnapshot.buyer_phone = `${cleanCountryCode}${cleanPhone}`;
                } else {
                    updatedSnapshot.buyer_phone = phoneStr;
                }
            } else {
                updatedSnapshot.buyer_phone = null;
            }
        }

        // Vehicle snapshot fields
        if (rawMake !== undefined) {
            updatedSnapshot.make = (rawMake !== null && !isNullLike(rawMake) && !isBlankString(rawMake))
                ? String(rawMake).trim()
                : null;
        }

        if (rawModel !== undefined) {
            updatedSnapshot.model = (rawModel !== null && !isNullLike(rawModel) && !isBlankString(rawModel))
                ? String(rawModel).trim()
                : null;
        }

        if (rawBodyType !== undefined) {
            updatedSnapshot.body_type = (rawBodyType !== null && !isNullLike(rawBodyType) && !isBlankString(rawBodyType))
                ? String(rawBodyType).trim()
                : null;
        }

        if (rawColor !== undefined) {
            updatedSnapshot.color = (rawColor !== null && !isNullLike(rawColor) && !isBlankString(rawColor))
                ? String(rawColor).trim()
                : null;
        }

        if (rawEngineDisplacement !== undefined) {
            if (rawEngineDisplacement !== null && !isNullLike(rawEngineDisplacement) && !isBlankString(rawEngineDisplacement)) {
                updatedSnapshot.engine_displacement = String(rawEngineDisplacement).trim();
            } else {
                updatedSnapshot.engine_displacement = null;
            }
        }

        if (rawPower !== undefined) {
            if (rawPower !== null && !isNullLike(rawPower) && !isBlankString(rawPower)) {
                updatedSnapshot.power = String(rawPower).trim();
            } else {
                updatedSnapshot.power = null;
            }
        }

        if (rawTransmission !== undefined) {
            updatedSnapshot.transmission = (rawTransmission !== null && !isNullLike(rawTransmission) && !isBlankString(rawTransmission))
                ? String(rawTransmission).trim()
                : null;
        }

        if (rawVin !== undefined) {
            updatedSnapshot.vin = (rawVin !== null && !isNullLike(rawVin) && !isBlankString(rawVin))
                ? String(rawVin).trim()
                : null;
        }

        if (rawStammnummer !== undefined) {
            updatedSnapshot.stammnummer = (rawStammnummer !== null && !isNullLike(rawStammnummer) && !isBlankString(rawStammnummer))
                ? String(rawStammnummer).trim()
                : null;
        }

        if (rawTypeApproval !== undefined) {
            updatedSnapshot.type_approval_number = (rawTypeApproval !== null && !isNullLike(rawTypeApproval) && !isBlankString(rawTypeApproval))
                ? String(rawTypeApproval).trim()
                : null;
        }

        if (rawFirstReg !== undefined) {
            updatedSnapshot.first_registration_date = (rawFirstReg !== null && !isNullLike(rawFirstReg) && !isBlankString(rawFirstReg))
                ? convertDate(rawFirstReg)
                : null;
        }

        if (rawMileage !== undefined) {
            if (rawMileage !== null && !isNullLike(rawMileage) && !isBlankString(rawMileage)) {
                const parsedMileage = Number(String(rawMileage).replace(/[^0-9]/g, ''));
                updatedSnapshot.mileage = !isNaN(parsedMileage) ? parsedMileage : null;
            } else {
                updatedSnapshot.mileage = null;
            }
        }

        if (rawLastMfk !== undefined) {
            updatedSnapshot.last_mfk_date = (rawLastMfk !== null && !isNullLike(rawLastMfk) && !isBlankString(rawLastMfk))
                ? convertDate(rawLastMfk)
                : null;
        }

        // Purchase & Condition Checklist
        if (body.purchase_price !== undefined) {
            updatedSnapshot.purchase_price = (body.purchase_price !== null && !isNullLike(body.purchase_price) && !isBlankString(body.purchase_price))
                ? Number(body.purchase_price)
                : null;
        }

        if (body.second_key_available !== undefined) {
            updatedSnapshot.second_key_available = body.second_key_available !== null
                ? Boolean(body.second_key_available)
                : null;
        }

        if (body.accident_free !== undefined) {
            updatedSnapshot.accident_free = body.accident_free !== null
                ? Boolean(body.accident_free)
                : null;
        }

        if (body.vehicle_remarks !== undefined) {
            updatedSnapshot.vehicle_remarks = (body.vehicle_remarks !== null && !isNullLike(body.vehicle_remarks) && !isBlankString(body.vehicle_remarks))
                ? String(body.vehicle_remarks)
                : null;
        }

        if (body.defects_known !== undefined) {
            updatedSnapshot.defects_known = body.defects_known !== null
                ? Boolean(body.defects_known)
                : null;
        }

        if (body.defect_remarks !== undefined) {
            updatedSnapshot.defect_remarks = (body.defect_remarks !== null && !isNullLike(body.defect_remarks) && !isBlankString(body.defect_remarks))
                ? String(body.defect_remarks)
                : null;
        }

        if (body.service_book_available !== undefined) {
            updatedSnapshot.service_book_available = body.service_book_available !== null
                ? Boolean(body.service_book_available)
                : null;
        }

        if (body.service_book_remarks !== undefined) {
            updatedSnapshot.service_book_remarks = (body.service_book_remarks !== null && !isNullLike(body.service_book_remarks) && !isBlankString(body.service_book_remarks))
                ? String(body.service_book_remarks)
                : null;
        }

        // Warranty Terms
        if (body.warranty_type !== undefined) {
            if (body.warranty_type !== null && !isNullLike(body.warranty_type) && !isBlankString(body.warranty_type)) {
                const rawType = String(body.warranty_type).trim().toUpperCase();
                if (['EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER'].includes(rawType)) {
                    updatedSnapshot.warranty_type = rawType;
                } else {
                    return handleError(
                        res,
                        400,
                        "warranty_type must be one of 'EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER'."
                    );
                }
            } else {
                updatedSnapshot.warranty_type = null;
            }
        }

        const effectiveWarrantyType = updatedSnapshot.warranty_type !== undefined
            ? updatedSnapshot.warranty_type
            : existingAgreement.warranty_type;

        if (body.warranty_other_text !== undefined) {
            if (effectiveWarrantyType === 'OTHER') {
                updatedSnapshot.warranty_other_text = (body.warranty_other_text !== null && !isNullLike(body.warranty_other_text) && !isBlankString(body.warranty_other_text))
                    ? String(body.warranty_other_text).trim()
                    : null;
            } else {
                updatedSnapshot.warranty_other_text = null;
            }
        } else if (updatedSnapshot.warranty_type !== undefined && updatedSnapshot.warranty_type !== 'OTHER') {
            updatedSnapshot.warranty_other_text = null;
        }

        // Payment Terms
        if (body.payment_type !== undefined) {
            updatedSnapshot.payment_type = (body.payment_type !== null && !isNullLike(body.payment_type) && !isBlankString(body.payment_type))
                ? String(body.payment_type)
                : null;
        }

        if (body.payment_other_text !== undefined) {
            updatedSnapshot.payment_other_text = (body.payment_other_text !== null && !isNullLike(body.payment_other_text) && !isBlankString(body.payment_other_text))
                ? String(body.payment_other_text)
                : null;
        }

        // Handover
        if (body.handover_date !== undefined) {
            updatedSnapshot.handover_date = (body.handover_date !== null && !isNullLike(body.handover_date) && !isBlankString(body.handover_date))
                ? convertDate(body.handover_date)
                : null;
        }

        if (body.handover_location !== undefined) {
            updatedSnapshot.handover_location = (body.handover_location !== null && !isNullLike(body.handover_location) && !isBlankString(body.handover_location))
                ? String(body.handover_location)
                : null;
        }

        // 10. Database Transaction Execution
        const connection = await db.getConnection();

        try {
            await new Promise((resolve, reject) => {
                connection.beginTransaction((err) => (err ? reject(err) : resolve()));
            });

            // Update tbl_cars if any editable vehicle fields were provided
            if (Object.keys(vehicleUpdateData).length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        'UPDATE tbl_cars SET ? WHERE id = ?',
                        [vehicleUpdateData, numericVehicleId],
                        (err, result) => (err ? reject(err) : resolve(result))
                    );
                });
            }

            // Update purchase_agreements record
            if (Object.keys(updatedSnapshot).length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        'UPDATE purchase_agreements SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
                        [updatedSnapshot, numericAgreementId],
                        (err, result) => (err ? reject(err) : resolve(result))
                    );
                });
            }

            await new Promise((resolve, reject) => {
                connection.commit((err) => (err ? reject(err) : resolve()));
            });

        } catch (txnError) {
            await new Promise((resolve) => connection.rollback(() => resolve()));
            throw txnError;
        } finally {
            connection.release();
        }

        // 11. Fetch refreshed snapshot for response
        const refreshedAgreement = await getPurchaseAgreementById(numericAgreementId);

        // Format Warranty Multilingual Details
        let warranty_label = null;
        let warranty_text = null;
        const finalWarrantyType = refreshedAgreement.warranty_type || null;

        if (finalWarrantyType === 'EXCLUDED') {
            warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED');
            warranty_text = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED_TEXT');
        } else if (finalWarrantyType === 'TWO_YEAR_ART_210') {
            warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210');
            warranty_text = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210_TEXT');
        } else if (finalWarrantyType === 'OTHER') {
            warranty_label = getMessage(lang, 'PURCHASE_AGREEMENT_WARRANTY_OTHER');
            warranty_text = null;
        }

        const responseData = {
            id: refreshedAgreement.id,
            status: refreshedAgreement.status || 'DRAFT',

            seller: {
                user_id: refreshedAgreement.seller_user_id,
                company_name: refreshedAgreement.seller_company_name,
                address: refreshedAgreement.seller_address,
                phone: refreshedAgreement.seller_phone,
                contact_person: refreshedAgreement.seller_contact_person,
                is_legal_owner: refreshedAgreement.seller_is_legal_owner === null ? true : Boolean(refreshedAgreement.seller_is_legal_owner)
            },

            buyer: {
                full_name: refreshedAgreement.buyer_full_name,
                date_of_birth: refreshedAgreement.buyer_date_of_birth ? new Date(refreshedAgreement.buyer_date_of_birth).toISOString().split('T')[0] : null,
                address: refreshedAgreement.buyer_address,
                phone: refreshedAgreement.buyer_phone
            },

            vehicle: {
                vehicle_id: refreshedAgreement.vehicle_id,
                make: refreshedAgreement.make,
                model: refreshedAgreement.model,
                body_type: refreshedAgreement.body_type,
                color: refreshedAgreement.color,
                engine_displacement: refreshedAgreement.engine_displacement,
                power: refreshedAgreement.power,
                transmission: refreshedAgreement.transmission,
                vin: refreshedAgreement.vin,
                stammnummer: refreshedAgreement.stammnummer,
                type_approval_number: refreshedAgreement.type_approval_number,
                first_registration_date: refreshedAgreement.first_registration_date ? new Date(refreshedAgreement.first_registration_date).toISOString().split('T')[0] : null,
                mileage: refreshedAgreement.mileage !== null ? Number(refreshedAgreement.mileage) : null,
                last_mfk_date: refreshedAgreement.last_mfk_date ? new Date(refreshedAgreement.last_mfk_date).toISOString().split('T')[0] : null
            },

            purchase: {
                purchase_price: refreshedAgreement.purchase_price !== null ? Number(refreshedAgreement.purchase_price) : null,
                second_key_available: refreshedAgreement.second_key_available !== null ? Boolean(refreshedAgreement.second_key_available) : null,
                accident_free: refreshedAgreement.accident_free !== null ? Boolean(refreshedAgreement.accident_free) : null,
                vehicle_remarks: refreshedAgreement.vehicle_remarks,
                defects_known: refreshedAgreement.defects_known !== null ? Boolean(refreshedAgreement.defects_known) : null,
                defect_remarks: refreshedAgreement.defect_remarks,
                service_book_available: refreshedAgreement.service_book_available !== null ? Boolean(refreshedAgreement.service_book_available) : null,
                service_book_remarks: refreshedAgreement.service_book_remarks
            },

            warranty: {
                warranty_type: finalWarrantyType,
                warranty_label,
                warranty_text,
                warranty_other_text: refreshedAgreement.warranty_other_text
            },

            payment: {
                payment_type: refreshedAgreement.payment_type,
                payment_other_text: refreshedAgreement.payment_other_text
            },

            handover: {
                date: refreshedAgreement.handover_date ? new Date(refreshedAgreement.handover_date).toISOString().split('T')[0] : null,
                location: refreshedAgreement.handover_location
            },

            created_at: refreshedAgreement.created_at,
            updated_at: refreshedAgreement.updated_at
        };

        return handleSuccess(
            res,
            200,
            getMessage(lang, 'PURCHASE_AGREEMENT_UPDATED_SUCCESS'),
            responseData,
            lang
        );

    } catch (error) {
        console.error('updatePurchaseAgreementController error:', error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const updatePurchaseAgreement = updatePurchaseAgreementController;
export default updatePurchaseAgreementController;
