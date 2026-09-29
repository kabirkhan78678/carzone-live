import db from '../../config/db.js';
import { createPurchaseAgreement as insertPurchaseAgreementModel } from '../../models/user/purchaseAgreement.model.js';
import { viewCarDetailByCarIdModel } from '../../models/user/carDetailView.model.js';
import { findCarByIdAndUser, updateSellerCars } from '../../models/user/carCrud.model.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

/**
 * Controller for creating a new Purchase Agreement from an authenticated dealer's vehicle listing.
 * Follows the existing listing conventions (listCarmobile / tbl_cars mapping).
 * Endpoint: POST /vehicles/:vehicleId/purchase-agreement
 */
export const createPurchaseAgreementController = async (req, res) => {
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
                getMessage(lang, 'Only dealer accounts can create purchase agreements') || 'Only dealer accounts can create purchase agreements'
            );
        }

        // 3. Vehicle parameter verification
        const vehicleId = req.params.vehicleId || req.params.id || req.body.vehicle_id;
        if (!vehicleId || isNaN(Number(vehicleId))) {
            return handleError(
                res,
                400,
                getMessage(lang, 'Vehicle ID is required') || 'Vehicle ID is required'
            );
        }

        const numericVehicleId = Number(vehicleId);

        // 4. Vehicle ownership & existence verification
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

        // 5. Fetch enriched vehicle listing data with resolved lookup values and translations
        const enrichedCarRows = await viewCarDetailByCarIdModel(numericVehicleId, lang);
        const listingCar = (enrichedCarRows && enrichedCarRows.length > 0) ? enrichedCarRows[0] : carBasic;

        const body = req.body || {};

        // Helper conventions identical to listCarmobile
        const hasKey = (key) => Object.prototype.hasOwnProperty.call(body, key);
        const isBlankString = (value) => typeof value === 'string' && value.trim() === '';
        const isNullLike = (value) =>
            value === null || (typeof value === 'string' && value.trim().toLowerCase() === 'null');

        const convertDate = (date) => {
            if (!date) return null;

            if (date instanceof Date) {
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            }

            const dateStr = String(date).trim();
            if (!dateStr) return null;

            // DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
            const ddMmyyyyMatch = dateStr.match(/^(\d{2})[-./](\d{2})[-./](\d{4})$/);
            if (ddMmyyyyMatch) {
                const [, dayStr, monthStr, yearStr] = ddMmyyyyMatch;
                const day = Number(dayStr);
                const month = Number(monthStr);
                const year = Number(yearStr);

                const parsedDate = new Date(year, month - 1, day);
                if (
                    parsedDate.getFullYear() !== year ||
                    parsedDate.getMonth() !== month - 1 ||
                    parsedDate.getDate() !== day
                ) {
                    return null;
                }

                return `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
            }

            // YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
            const yyyyMmddMatch = dateStr.match(/^(\d{4})[-./](\d{2})[-./](\d{2})$/);
            if (yyyyMmddMatch) {
                const [, yearStr, monthStr, dayStr] = yyyyMmddMatch;
                const day = Number(dayStr);
                const month = Number(monthStr);
                const year = Number(yearStr);

                const parsedDate = new Date(year, month - 1, day);
                if (
                    parsedDate.getFullYear() !== year ||
                    parsedDate.getMonth() !== month - 1 ||
                    parsedDate.getDate() !== day
                ) {
                    return null;
                }

                return `${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
            }

            // Fallback for valid ISO strings or JS parseable dates
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }

            return null;
        };

        // 6. Build vehicle updates for tbl_cars (Mapping boundary: canonical PA keys -> tbl_cars columns)
        // Canonical PA keys: make, model, body_type, color, engine_displacement, power, transmission, vin, stammnummer, type_approval_number, first_registration_date, mileage, last_mfk_date


        const vehicleUpdateData = {};

        const rawMake = body.make !== undefined ? body.make : null;
        if (rawMake !== null && !isNullLike(rawMake) && !isBlankString(rawMake)) {
            vehicleUpdateData.brandName = String(rawMake).trim();
        }

        const rawModel = body.model !== undefined ? body.model : null;
        if (rawModel !== null && !isNullLike(rawModel) && !isBlankString(rawModel)) {
            vehicleUpdateData.carModel = String(rawModel).trim();
        }

        const rawVin = body.vin !== undefined ? body.vin : null;
        if (rawVin !== null && !isNullLike(rawVin) && !isBlankString(rawVin)) {
            vehicleUpdateData.vin_number = String(rawVin).trim();
        }

        const rawStammnummer = body.stammnummer !== undefined ? body.stammnummer : null;
        if (rawStammnummer !== null && !isNullLike(rawStammnummer) && !isBlankString(rawStammnummer)) {
            vehicleUpdateData.registration_master_number = String(rawStammnummer).trim();
        }

        const rawTypeApproval = body.type_approval_number !== undefined ? body.type_approval_number : null;
        if (rawTypeApproval !== null && !isNullLike(rawTypeApproval) && !isBlankString(rawTypeApproval)) {
            vehicleUpdateData.type_approval = String(rawTypeApproval).trim();
        }

        const rawFirstReg = body.first_registration_date !== undefined ? body.first_registration_date : (body.firstRegistrationDate !== undefined ? body.firstRegistrationDate : null);
        if (rawFirstReg !== null && !isNullLike(rawFirstReg) && !isBlankString(rawFirstReg)) {
            const formattedRegDate = convertDate(rawFirstReg);
            if (formattedRegDate) vehicleUpdateData.first_registration_date = formattedRegDate;
        }

        const rawLastMfk = body.last_mfk_date !== undefined ? body.last_mfk_date : null;
        if (rawLastMfk !== null && !isNullLike(rawLastMfk) && !isBlankString(rawLastMfk)) {
            const formattedMfkDate = convertDate(rawLastMfk);
            if (formattedMfkDate) vehicleUpdateData.last_mfk_date = formattedMfkDate;
        }

        const rawMileage = body.mileage !== undefined ? body.mileage : null;
        if (rawMileage !== null && !isNullLike(rawMileage) && !isBlankString(rawMileage)) {
            const parsedMileage = Number(String(rawMileage).replace(/[^0-9]/g, ''));
            if (!isNaN(parsedMileage)) vehicleUpdateData.carMileage = String(parsedMileage);
        }

        const rawColor = body.color !== undefined ? body.color : null;
        if (rawColor !== null && !isNullLike(rawColor) && !isBlankString(rawColor)) {
            vehicleUpdateData.exterior_color_custom = String(rawColor).trim();
            vehicleUpdateData.exterior_color_id = null;
        }

        const rawPower = body.power !== undefined ? body.power : null;
        if (rawPower !== null && !isNullLike(rawPower) && !isBlankString(rawPower)) {
            const powerStr = String(rawPower).trim();
            vehicleUpdateData.powerOutput = powerStr;
            const kwMatch = powerStr.match(/(\d+)\s*(?:kw)?/i);
            const psMatch = powerStr.match(/\((\d+)\s*(?:ps|hp)?\)/i) || powerStr.match(/(\d+)\s*(?:ps|hp)/i);
            if (kwMatch && kwMatch[1]) vehicleUpdateData.power_kw = Number(kwMatch[1]);
            if (psMatch && psMatch[1]) vehicleUpdateData.power_ps = Number(psMatch[1]);
        }

        const rawEngineDisplacement = body.engine_displacement !== undefined ? body.engine_displacement : null;
        if (rawEngineDisplacement !== null && !isNullLike(rawEngineDisplacement) && !isBlankString(rawEngineDisplacement)) {
            const parsedCubic = Number(String(rawEngineDisplacement).replace(/[^0-9]/g, ''));
            if (!isNaN(parsedCubic) && parsedCubic > 0) {
                vehicleUpdateData.cubic_capacity = parsedCubic;
            }
        }

        const rawBodyType = body.body_type !== undefined ? body.body_type : null;
        if (rawBodyType !== null && !isNullLike(rawBodyType) && !isBlankString(rawBodyType)) {
            vehicleUpdateData.body_type = String(rawBodyType).trim();
        }

        const rawTransmission = body.transmission !== undefined ? body.transmission : null;
        if (rawTransmission !== null && !isNullLike(rawTransmission) && !isBlankString(rawTransmission)) {
            vehicleUpdateData.transmission = String(rawTransmission).trim();
        }

        // 7. Resolve Final Vehicle Snapshot Values (Manual input -> Updated tbl_cars -> Existing tbl_cars -> null)
        const finalMake = (rawMake !== null && !isNullLike(rawMake) && !isBlankString(rawMake))
            ? String(rawMake).trim()
            : (listingCar.brandName || null);

        const finalModel = (rawModel !== null && !isNullLike(rawModel) && !isBlankString(rawModel))
            ? String(rawModel).trim()
            : (listingCar.carModel || null);

        const finalBodyType = (rawBodyType !== null && !isNullLike(rawBodyType) && !isBlankString(rawBodyType))
            ? String(rawBodyType).trim()
            : (listingCar.body_type_label || listingCar.body_type || null);

        const finalColor = (rawColor !== null && !isNullLike(rawColor) && !isBlankString(rawColor))
            ? String(rawColor).trim()
            : (listingCar.exterior_color_value || listingCar.carColor || null);

        let finalEngineDisplacement = null;
        if (rawEngineDisplacement !== null && !isNullLike(rawEngineDisplacement) && !isBlankString(rawEngineDisplacement)) {
            finalEngineDisplacement = String(rawEngineDisplacement).trim();
        } else if (listingCar.cubic_capacity) {
            finalEngineDisplacement = `${listingCar.cubic_capacity} ccm`;
        } else if (listingCar.engineType) {
            finalEngineDisplacement = String(listingCar.engineType);
        }

        let finalPower = null;
        if (rawPower !== null && !isNullLike(rawPower) && !isBlankString(rawPower)) {
            finalPower = String(rawPower).trim();
        } else if (vehicleUpdateData.powerOutput) {
            finalPower = vehicleUpdateData.powerOutput;
        } else if (listingCar.power_kw && listingCar.power_ps) {
            finalPower = `${listingCar.power_kw} kW (${listingCar.power_ps} PS)`;
        } else if (listingCar.power_kw) {
            finalPower = `${listingCar.power_kw} kW`;
        } else if (listingCar.power_ps) {
            finalPower = `${listingCar.power_ps} PS`;
        } else if (listingCar.powerOutput) {
            finalPower = String(listingCar.powerOutput);
        }

        const finalTransmission = (rawTransmission !== null && !isNullLike(rawTransmission) && !isBlankString(rawTransmission))
            ? String(rawTransmission).trim()
            : (listingCar.transmission_label || listingCar.transmission || null);

        const finalVin = (rawVin !== null && !isNullLike(rawVin) && !isBlankString(rawVin))
            ? String(rawVin).trim()
            : (listingCar.vin_number || listingCar.vrn || null);

        const finalStammnummer = (rawStammnummer !== null && !isNullLike(rawStammnummer) && !isBlankString(rawStammnummer))
            ? String(rawStammnummer).trim()
            : (listingCar.registration_master_number || null);

        const finalTypeApproval = (rawTypeApproval !== null && !isNullLike(rawTypeApproval) && !isBlankString(rawTypeApproval))
            ? String(rawTypeApproval).trim()
            : (listingCar.type_approval || null);

        let finalFirstRegDate = null;
        if (vehicleUpdateData.first_registration_date) {
            finalFirstRegDate = vehicleUpdateData.first_registration_date;
        } else if (listingCar.first_registration_date) {
            finalFirstRegDate = convertDate(listingCar.first_registration_date);
        }

        let finalMileage = null;
        if (rawMileage !== null && !isNullLike(rawMileage) && !isBlankString(rawMileage)) {
            const parsedMileage = Number(String(rawMileage).replace(/[^0-9]/g, ''));
            if (!isNaN(parsedMileage)) finalMileage = parsedMileage;
        } else if (listingCar.carMileage !== undefined && listingCar.carMileage !== null && listingCar.carMileage !== '') {
            const parsedMileage = Number(String(listingCar.carMileage).replace(/[^0-9]/g, ''));
            if (!isNaN(parsedMileage)) finalMileage = parsedMileage;
        }

        let finalLastMfkDate = null;
        if (vehicleUpdateData.last_mfk_date) {
            finalLastMfkDate = vehicleUpdateData.last_mfk_date;
        } else if (listingCar.last_mfk_date) {
            finalLastMfkDate = convertDate(listingCar.last_mfk_date);
        }

        // 8. Seller Snapshot & Profile Update Mapping
        // Seller user ID strictly derived from vehicle ownership (tbl_cars.user_id / req.user.id)
        const seller_user_id = carBasic.user_id || req.user.id;

        const rawSellerCompany = body.seller_company_name !== undefined ? body.seller_company_name : null;
        const rawSellerFullName = body.seller_fullName !== undefined ? body.seller_fullName : null;
        const rawSellerAddress = body.seller_fullAddress !== undefined ? body.seller_fullAddress : null;
        const rawSellerPhone = body.seller_phoneNumber !== undefined ? body.seller_phoneNumber : null;
        const rawSellerCountryCode = body.seller_countryCode !== undefined ? body.seller_countryCode : null;
        const rawSellerPincode = body.seller_pincode !== undefined ? body.seller_pincode : null;
        const rawSellerCity = body.seller_city !== undefined ? body.seller_city : null;

        const seller_company_name = (rawSellerCompany !== null && !isNullLike(rawSellerCompany) && !isBlankString(rawSellerCompany))
            ? String(rawSellerCompany).trim()
            : (req.user.companyName || req.user.fullName || null);

        const seller_address = (rawSellerAddress !== null && !isNullLike(rawSellerAddress) && !isBlankString(rawSellerAddress))
            ? String(rawSellerAddress).trim()
            : (req.user.fullAddress || req.user.companyAddress || null);

        const seller_phone = (rawSellerPhone !== null && !isNullLike(rawSellerPhone) && !isBlankString(rawSellerPhone))
            ? String(rawSellerPhone).trim()
            : (req.user.phoneNumber || req.user.business_phone || null);

        const seller_contact_person = body.seller_contact_person !== undefined && body.seller_contact_person !== null && body.seller_contact_person !== ''
            ? String(body.seller_contact_person).trim()
            : (rawSellerFullName ? String(rawSellerFullName).trim() : (req.user.fullName || null));

        let seller_is_legal_owner = true;
        if (body.seller_is_legal_owner !== undefined && body.seller_is_legal_owner !== null) {
            seller_is_legal_owner = Boolean(body.seller_is_legal_owner);
        }

        // Build seller tbl_users update payload
        const sellerUserUpdates = {};
        if (rawSellerCompany !== null && !isNullLike(rawSellerCompany) && !isBlankString(rawSellerCompany)) {
            sellerUserUpdates.companyName = String(rawSellerCompany).trim();
        }
        if (rawSellerFullName !== null && !isNullLike(rawSellerFullName) && !isBlankString(rawSellerFullName)) {
            sellerUserUpdates.fullName = String(rawSellerFullName).trim();
        }
        if (rawSellerAddress !== null && !isNullLike(rawSellerAddress) && !isBlankString(rawSellerAddress)) {
            sellerUserUpdates.fullAddress = String(rawSellerAddress).trim();
            sellerUserUpdates.companyAddress = String(rawSellerAddress).trim();
        }
        if (rawSellerPhone !== null && !isNullLike(rawSellerPhone) && !isBlankString(rawSellerPhone)) {
            sellerUserUpdates.phoneNumber = String(rawSellerPhone).trim();
            sellerUserUpdates.business_phone = String(rawSellerPhone).trim();
        }
        if (rawSellerCountryCode !== null && !isNullLike(rawSellerCountryCode) && !isBlankString(rawSellerCountryCode)) {
            sellerUserUpdates.countryCode = String(rawSellerCountryCode).trim();
            sellerUserUpdates.businessCountryCode = String(rawSellerCountryCode).trim();
        }
        if (rawSellerPincode !== null && !isNullLike(rawSellerPincode) && !isBlankString(rawSellerPincode)) {
            sellerUserUpdates.pincode = String(rawSellerPincode).trim();
        }
        if (rawSellerCity !== null && !isNullLike(rawSellerCity) && !isBlankString(rawSellerCity)) {
            sellerUserUpdates.city = String(rawSellerCity).trim();
        }

        const rawSellerDob = body.seller_dateOfBirth !== undefined 
            ? body.seller_dateOfBirth 
            : (body.seller_date_of_birth !== undefined ? body.seller_date_of_birth : (body.seller_dob !== undefined ? body.seller_dob : null));
        if (rawSellerDob !== null && !isNullLike(rawSellerDob) && !isBlankString(rawSellerDob)) {
            const formattedSellerDob = convertDate(rawSellerDob);
            if (formattedSellerDob) sellerUserUpdates.dob = formattedSellerDob;
        }

        // 9. Buyer Details (Boundary mapping: fullName/full_name -> buyer_full_name, dateOfBirth/date_of_birth/dob -> buyer_date_of_birth, fullAddress/address -> buyer_address, phoneNumber/phone -> buyer_phone)
        const rawFullName = body.fullName ?? body.full_name ?? null;
        const buyer_full_name = (rawFullName !== null && !isNullLike(rawFullName) && !isBlankString(rawFullName))
            ? String(rawFullName).trim()
            : null;

        const rawDob = body.dateOfBirth ?? body.date_of_birth ?? body.dob ?? null;
        const buyer_date_of_birth = rawDob ? convertDate(rawDob) : null;

        let buyer_address = null;
        const rawAddress = body.fullAddress ?? body.address ?? null;
        if (rawAddress !== null && !isNullLike(rawAddress) && !isBlankString(rawAddress)) {
            buyer_address = String(rawAddress).trim();
        } else if (body.city || body.pincode) {
            const addressParts = [body.pincode, body.city].filter(Boolean);
            if (addressParts.length > 0) buyer_address = addressParts.join(' ').trim();
        }

        let buyer_phone = null;
        const rawPhone = body.phoneNumber ?? body.phone ?? null;
        if (rawPhone !== null && !isNullLike(rawPhone) && !isBlankString(rawPhone)) {
            const phoneStr = String(rawPhone).trim();
            const countryCodeStr = (body.countryCode !== undefined && body.countryCode !== null) ? String(body.countryCode).trim() : '';

            if (countryCodeStr && !phoneStr.startsWith('+') && !phoneStr.startsWith('00')) {
                const cleanCountryCode = countryCodeStr.startsWith('+') ? countryCodeStr : `+${countryCodeStr}`;
                const cleanPhone = phoneStr.replace(/^0+/, '');
                buyer_phone = `${cleanCountryCode}${cleanPhone}`;
            } else {
                buyer_phone = phoneStr;
            }
        }

        // Build buyer tbl_users update payload (if buyer_user_id is supplied, validate it exists in tbl_users and is not the seller)
        const rawBuyerUserId = body.buyer_user_id || body.buyer_id || null;
        let buyer_user_id = null;
        const buyerUserUpdates = {};

        if (rawBuyerUserId && !isNaN(Number(rawBuyerUserId))) {
            const numericBuyerId = Number(rawBuyerUserId);
            if (numericBuyerId !== Number(seller_user_id)) {
                // Verify buyer user exists in tbl_users
                const [buyerUserRows] = await connection.query(
                    'SELECT id, account_type FROM tbl_users WHERE id = ?',
                    [numericBuyerId]
                );
                if (buyerUserRows && buyerUserRows.length > 0) {
                    buyer_user_id = numericBuyerId;

                    if (rawFullName !== null && !isNullLike(rawFullName) && !isBlankString(rawFullName)) {
                        buyerUserUpdates.fullName = String(rawFullName).trim();
                    }
                    if (buyer_date_of_birth) {
                        buyerUserUpdates.dob = buyer_date_of_birth;
                    }
                    if (buyer_address !== null && !isNullLike(buyer_address) && !isBlankString(buyer_address)) {
                        buyerUserUpdates.fullAddress = buyer_address;
                    }
                    if (buyer_phone !== null && !isNullLike(buyer_phone) && !isBlankString(buyer_phone)) {
                        buyerUserUpdates.phoneNumber = buyer_phone;
                    }
                    if (body.countryCode !== undefined && body.countryCode !== null && !isBlankString(body.countryCode)) {
                        buyerUserUpdates.countryCode = String(body.countryCode).trim();
                    }
                    if (body.pincode !== undefined && body.pincode !== null && !isBlankString(body.pincode)) {
                        buyerUserUpdates.pincode = String(body.pincode).trim();
                    }
                    if (body.city !== undefined && body.city !== null && !isBlankString(body.city)) {
                        buyerUserUpdates.city = String(body.city).trim();
                    }
                }
            }
        }

        // 10. Purchase & Condition Checklist
        let purchase_price = null;
        if (body.purchase_price !== undefined && body.purchase_price !== null && body.purchase_price !== '') {
            purchase_price = Number(body.purchase_price);
        } else if (listingCar.selling_price !== undefined && listingCar.selling_price !== null) {
            purchase_price = Number(listingCar.selling_price);
        } else if (listingCar.totalPrice !== undefined && listingCar.totalPrice !== null) {
            purchase_price = Number(listingCar.totalPrice);
        }

        const second_key_available = body.second_key_available !== undefined && body.second_key_available !== null
            ? Boolean(body.second_key_available)
            : null;

        let accident_free = null;
        if (body.accident_free !== undefined && body.accident_free !== null) {
            accident_free = Boolean(body.accident_free);
        } else if (listingCar.is_accident_vehicle !== undefined && listingCar.is_accident_vehicle !== null) {
            accident_free = listingCar.is_accident_vehicle === 0;
        }

        const vehicle_remarks = body.vehicle_remarks !== undefined && body.vehicle_remarks !== null && body.vehicle_remarks !== ''
            ? String(body.vehicle_remarks)
            : null;

        const defects_known = body.defects_known !== undefined && body.defects_known !== null
            ? Boolean(body.defects_known)
            : null;

        const defect_remarks = body.defect_remarks !== undefined && body.defect_remarks !== null && body.defect_remarks !== ''
            ? String(body.defect_remarks)
            : null;

        let service_book_available = null;
        if (body.service_book_available !== undefined && body.service_book_available !== null) {
            service_book_available = Boolean(body.service_book_available);
        } else if (listingCar.is_fresh_from_service !== undefined && listingCar.is_fresh_from_service !== null) {
            service_book_available = Boolean(listingCar.is_fresh_from_service);
        }

        const service_book_remarks = body.service_book_remarks !== undefined && body.service_book_remarks !== null && body.service_book_remarks !== ''
            ? String(body.service_book_remarks)
            : null;

        // 11. Warranty Terms (EXCLUDED, TWO_YEAR_ART_210, OTHER)
        let warranty_type = null;
        if (body.warranty_type !== undefined && body.warranty_type !== null && body.warranty_type !== '') {
            const rawType = String(body.warranty_type).trim().toUpperCase();
            if (['EXCLUDED', 'TWO_YEAR_ART_210', 'OTHER'].includes(rawType)) {
                warranty_type = rawType;
            }
        }

        let warranty_other_text = null;
        if (warranty_type === 'OTHER' && body.warranty_other_text !== undefined && body.warranty_other_text !== null && body.warranty_other_text !== '') {
            warranty_other_text = String(body.warranty_other_text).trim();
        }

        // 12. Payment Terms
        const payment_type = body.payment_type !== undefined && body.payment_type !== null && body.payment_type !== ''
            ? String(body.payment_type)
            : null;

        const payment_other_text = body.payment_other_text !== undefined && body.payment_other_text !== null && body.payment_other_text !== ''
            ? String(body.payment_other_text)
            : null;

        // 13. Handover
        const handover_date = body.handover_date ? convertDate(body.handover_date) : null;
        const handover_location = body.handover_location !== undefined && body.handover_location !== null && body.handover_location !== ''
            ? String(body.handover_location)
            : null;

        // 14. Build Immutable Agreement Snapshot
        const agreementSnapshot = {
            status: 'DRAFT',

            // Seller
            seller_user_id,
            seller_company_name,
            seller_address,
            seller_phone,
            seller_contact_person,
            seller_is_legal_owner,

            // Buyer
            buyer_full_name,
            buyer_date_of_birth,
            buyer_address,
            buyer_phone,

            // Vehicle
            vehicle_id: numericVehicleId,
            make: finalMake,
            model: finalModel,
            body_type: finalBodyType,
            color: finalColor,
            engine_displacement: finalEngineDisplacement,
            power: finalPower,
            transmission: finalTransmission,
            vin: finalVin,
            stammnummer: finalStammnummer,
            type_approval_number: finalTypeApproval,
            first_registration_date: finalFirstRegDate,
            mileage: finalMileage,
            last_mfk_date: finalLastMfkDate,

            // Purchase & Condition
            purchase_price,
            second_key_available,
            accident_free,
            vehicle_remarks,
            defects_known,
            defect_remarks,
            service_book_available,
            service_book_remarks,

            // Warranty
            warranty_type,
            warranty_other_text,

            // Payment
            payment_type,
            payment_other_text,

            // Handover
            handover_date,
            handover_location
        };

        // 15. Transactional Execution: Update seller/buyer tbl_users, update tbl_cars with supplied missing specs, then insert agreement
        const connection = await db.getConnection();
        let agreementId;

        try {
            await new Promise((resolve, reject) => {
                connection.beginTransaction((err) => (err ? reject(err) : resolve()));
            });

            // If any seller fields were supplied, update seller record in tbl_users
            if (Object.keys(sellerUserUpdates).length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        'UPDATE tbl_users SET ? WHERE id = ?',
                        [sellerUserUpdates, seller_user_id],
                        (err, result) => (err ? reject(err) : resolve(result))
                    );
                });
            }

            // If buyer_user_id exists and buyer fields were supplied, update buyer record in tbl_users
            if (buyer_user_id && Object.keys(buyerUserUpdates).length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        'UPDATE tbl_users SET ? WHERE id = ?',
                        [buyerUserUpdates, buyer_user_id],
                        (err, result) => (err ? reject(err) : resolve(result))
                    );
                });
            }

            // If any vehicle fields were supplied, update tbl_cars
            if (Object.keys(vehicleUpdateData).length > 0) {
                await new Promise((resolve, reject) => {
                    connection.query(
                        'UPDATE tbl_cars SET ? WHERE id = ?',
                        [vehicleUpdateData, numericVehicleId],
                        (err, result) => (err ? reject(err) : resolve(result))
                    );
                });
            }

            // Insert Purchase Agreement Snapshot
            const insertResult = await new Promise((resolve, reject) => {
                connection.query(
                    'INSERT INTO purchase_agreements SET ?',
                    [agreementSnapshot],
                    (err, result) => (err ? reject(err) : resolve(result))
                );
            });

            agreementId = insertResult.insertId;

            await new Promise((resolve, reject) => {
                connection.commit((err) => (err ? reject(err) : resolve()));
            });

        } catch (txnError) {
            await new Promise((resolve) => connection.rollback(() => resolve()));
            throw txnError;
        } finally {
            connection.release();
        }

        // 16. Return standard success response
        return handleSuccess(
            res,
            200,
            getMessage(lang, 'Purchase agreement created successfully') || 'Purchase agreement created successfully',
            {
                id: agreementId,
                agreement: {
                    id: agreementId,
                    ...agreementSnapshot
                }
            },
            lang
        );

    } catch (error) {
        console.error('createPurchaseAgreementController error:', error);
        return handleError(
            res,
            500,
            getMessage('en', variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

// Aliases for backward compatibility in imports
export const createPurchaseAgreement = createPurchaseAgreementController;
export default createPurchaseAgreementController;
