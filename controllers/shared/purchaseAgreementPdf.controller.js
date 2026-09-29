import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { getPurchaseAgreementById } from '../../models/user/purchaseAgreement.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';

/**
 * Helper to build all translated label keys for the Purchase Agreement template.
 * @param {string} lang - Language code ('en', 'de', 'fr', 'it')
 * @returns {Object} Dictionary of localized labels
 */
const getTemplateLabels = (lang) => {
    const labelKeys = [
        'PURCHASE_AGREEMENT_DOC_TITLE',
        'PURCHASE_AGREEMENT_DOC_SUBTITLE',
        'PA_SECTION_SELLER',
        'PA_SECTION_BUYER',
        'PA_SECTION_VEHICLE',
        'PA_SECTION_PURCHASE_CONDITION',
        'PA_SECTION_WARRANTY',
        'PA_SECTION_PAYMENT',
        'PA_SECTION_HANDOVER',
        'PA_SECTION_SIGNATURES',
        'PA_LABEL_COMPANY',
        'PA_LABEL_ADDRESS',
        'PA_LABEL_PHONE',
        'PA_LABEL_CONTACT_PERSON',
        'PA_LABEL_LEGAL_OWNER',
        'PA_LABEL_FULL_NAME',
        'PA_LABEL_DOB',
        'PA_LABEL_MAKE',
        'PA_LABEL_MODEL',
        'PA_LABEL_BODY_TYPE',
        'PA_LABEL_COLOR',
        'PA_LABEL_ENGINE_DISPLACEMENT',
        'PA_LABEL_POWER',
        'PA_LABEL_TRANSMISSION',
        'PA_LABEL_VIN',
        'PA_LABEL_STAMMNUMMER',
        'PA_LABEL_TYPE_APPROVAL',
        'PA_LABEL_FIRST_REGISTRATION',
        'PA_LABEL_MILEAGE',
        'PA_LABEL_LAST_MFK',
        'PA_LABEL_PURCHASE_PRICE',
        'PA_LABEL_SECOND_KEY',
        'PA_LABEL_ACCIDENT_FREE',
        'PA_LABEL_ACCIDENT_NOTE',
        'PA_LABEL_VEHICLE_REMARKS',
        'PA_LABEL_KNOWN_DEFECTS',
        'PA_LABEL_DEFECT_REMARKS',
        'PA_LABEL_SERVICE_BOOK',
        'PA_LABEL_SERVICE_REMARKS',
        'PA_LABEL_PAYMENT_METHOD',
        'PA_LABEL_PAYMENT_CASH',
        'PA_LABEL_PAYMENT_OTHER',
        'PA_LABEL_HANDOVER_DATE',
        'PA_LABEL_HANDOVER_LOCATION',
        'PA_LABEL_PLACE_DATE',
        'PA_LABEL_SELLER_SIGNATURE',
        'PA_LABEL_BUYER_SIGNATURE',
        'PA_LABEL_YES',
        'PA_LABEL_NO',
        'PA_LABEL_NOT_SPECIFIED',
        'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED',
        'PURCHASE_AGREEMENT_WARRANTY_EXCLUDED_TEXT',
        'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210',
        'PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210_TEXT',
        'PURCHASE_AGREEMENT_WARRANTY_OTHER'
    ];

    const labels = {};
    for (const key of labelKeys) {
        labels[key] = getMessage(lang, key);
    }
    return labels;
};

/**
 * Helper to format date into DD-MM-YYYY
 * @param {string|Date} dateVal 
 * @param {string} defaultVal 
 * @returns {string} Formatted date as DD-MM-YYYY or fallback
 */
export const formatDate = (dateVal, defaultVal = '') => {
    if (!dateVal) return defaultVal;
    
    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (!trimmed) return defaultVal;

        // If already DD-MM-YYYY, DD.MM.YYYY, or DD/MM/YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
        if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3];
            return `${day}-${month}-${year}`;
        }

        // If YYYY-MM-DD, YYYY.MM.DD, or YYYY/MM/DD
        const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
        if (ymdMatch) {
            const year = ymdMatch[1];
            const month = ymdMatch[2].padStart(2, '0');
            const day = ymdMatch[3].padStart(2, '0');
            return `${day}-${month}-${year}`;
        }
    }

    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        
        // Handle ISO string / UTC timestamps from DB
        if (typeof dateVal === 'string' && (dateVal.includes('T') || dateVal.includes('Z'))) {
            const day = String(d.getUTCDate()).padStart(2, '0');
            const month = String(d.getUTCMonth() + 1).padStart(2, '0');
            const year = d.getUTCFullYear();
            return `${day}-${month}-${year}`;
        }

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return String(dateVal);
    }
};

/**
 * Controller for downloading a populated Purchase Agreement PDF.
 * Route: GET /purchase-agreements/:id/download-pdf
 */
export const downloadPurchaseAgreementPdf = async (req, res) => {
    let browser;
    try {
        const lang = req.query.lang || req.user?.language || 'en';

        // 1. Authorization: User must be authenticated
        if (!req.user || !req.user.id) {
            return handleError(
                res,
                401,
                getMessage(lang, 'User authentication is required') || 'User authentication is required'
            );
        }

        // 2. Authorization: User must be a company / dealer
        if (req.user.account_type !== 'company') {
            return handleError(
                res,
                403,
                getMessage(lang, 'Only dealer accounts can access purchase agreements') || 'Only dealer accounts can access purchase agreements'
            );
        }

        const agreementId = req.params.id || req.params.agreementId;
        if (!agreementId || isNaN(Number(agreementId))) {
            return handleError(
                res,
                400,
                getMessage(lang, 'Agreement ID must be a numeric value.') || 'Agreement ID must be a numeric value.'
            );
        }

        // 3. Fetch immutable snapshot from database (deleted_at IS NULL)
        const agreement = await getPurchaseAgreementById(Number(agreementId));

        // 4. Security & Existence check:
        // Must exist and must belong to the authenticated seller (purchase_agreements.seller_user_id = req.user.id)
        if (!agreement || Number(agreement.seller_user_id) !== Number(req.user.id)) {
            return handleError(
                res,
                404,
                getMessage(lang, 'Purchase agreement not found') || 'Purchase agreement not found'
            );
        }

        // 5. Read Handlebars Template
        const templatePath = path.join(process.cwd(), 'templates/purchase_agreement.hbs');
        const templateHtml = await fs.readFile(templatePath, 'utf8');
        const template = handlebars.compile(templateHtml);

        // 6. Format warranty & legal text
        const labels = getTemplateLabels(lang);
        const warranty_type = agreement.warranty_type;
        let warranty_label = null;
        let warranty_text = null;
        const warranty_other_text = agreement.warranty_other_text || null;

        if (warranty_type === 'EXCLUDED') {
            warranty_label = labels.PURCHASE_AGREEMENT_WARRANTY_EXCLUDED;
            warranty_text = labels.PURCHASE_AGREEMENT_WARRANTY_EXCLUDED_TEXT;
        } else if (warranty_type === 'TWO_YEAR_ART_210') {
            warranty_label = labels.PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210;
            warranty_text = labels.PURCHASE_AGREEMENT_WARRANTY_TWO_YEAR_ART_210_TEXT;
        } else if (warranty_type === 'OTHER') {
            warranty_label = labels.PURCHASE_AGREEMENT_WARRANTY_OTHER;
            warranty_text = null;
        }

        const formatBoolean = (val) => {
            if (val === null || val === undefined) return labels.PA_LABEL_NOT_SPECIFIED;
            return val ? labels.PA_LABEL_YES : labels.PA_LABEL_NO;
        };

        const formatNumber = (num) => {
            if (num === null || num === undefined || num === '') return labels.PA_LABEL_NOT_SPECIFIED;
            return Number(num).toLocaleString('de-CH');
        };

        const templateData = {
            lang,
            labels,
            is_blank_template: false,
            id: agreement.id,
            document_date: agreement.created_at ? formatDate(agreement.created_at, labels.PA_LABEL_NOT_SPECIFIED) : formatDate(new Date(), labels.PA_LABEL_NOT_SPECIFIED),

            seller: {
                company_name: agreement.seller_company_name || labels.PA_LABEL_NOT_SPECIFIED,
                address: agreement.seller_address || labels.PA_LABEL_NOT_SPECIFIED,
                phone: agreement.seller_phone || labels.PA_LABEL_NOT_SPECIFIED,
                contact_person: agreement.seller_contact_person || labels.PA_LABEL_NOT_SPECIFIED,
                legal_owner_display: agreement.seller_is_legal_owner === null ? labels.PA_LABEL_YES : formatBoolean(agreement.seller_is_legal_owner)
            },

            buyer: {
                full_name: agreement.buyer_full_name || labels.PA_LABEL_NOT_SPECIFIED,
                date_of_birth: agreement.buyer_date_of_birth ? formatDate(agreement.buyer_date_of_birth, labels.PA_LABEL_NOT_SPECIFIED) : labels.PA_LABEL_NOT_SPECIFIED,
                address: agreement.buyer_address || labels.PA_LABEL_NOT_SPECIFIED,
                phone: agreement.buyer_phone || labels.PA_LABEL_NOT_SPECIFIED
            },

            vehicle: {
                make: agreement.make || labels.PA_LABEL_NOT_SPECIFIED,
                model: agreement.model || labels.PA_LABEL_NOT_SPECIFIED,
                body_type: agreement.body_type || labels.PA_LABEL_NOT_SPECIFIED,
                color: agreement.color || labels.PA_LABEL_NOT_SPECIFIED,
                engine_displacement: agreement.engine_displacement || labels.PA_LABEL_NOT_SPECIFIED,
                power: agreement.power || labels.PA_LABEL_NOT_SPECIFIED,
                transmission: agreement.transmission || labels.PA_LABEL_NOT_SPECIFIED,
                vin: agreement.vin || labels.PA_LABEL_NOT_SPECIFIED,
                stammnummer: agreement.stammnummer || labels.PA_LABEL_NOT_SPECIFIED,
                type_approval_number: agreement.type_approval_number || labels.PA_LABEL_NOT_SPECIFIED,
                first_registration_date: agreement.first_registration_date ? formatDate(agreement.first_registration_date, labels.PA_LABEL_NOT_SPECIFIED) : labels.PA_LABEL_NOT_SPECIFIED,
                mileage: agreement.mileage !== null && agreement.mileage !== undefined ? `${formatNumber(agreement.mileage)} km` : labels.PA_LABEL_NOT_SPECIFIED,
                last_mfk_date: agreement.last_mfk_date ? formatDate(agreement.last_mfk_date, labels.PA_LABEL_NOT_SPECIFIED) : labels.PA_LABEL_NOT_SPECIFIED
            },

            purchase: {
                purchase_price_formatted: agreement.purchase_price !== null && agreement.purchase_price !== undefined ? `CHF ${formatNumber(agreement.purchase_price)}` : labels.PA_LABEL_NOT_SPECIFIED,
                second_key_display: formatBoolean(agreement.second_key_available),
                accident_free_display: formatBoolean(agreement.accident_free),
                vehicle_remarks: agreement.vehicle_remarks || null,
                defects_known_display: formatBoolean(agreement.defects_known),
                defect_remarks: agreement.defect_remarks || null,
                service_book_display: formatBoolean(agreement.service_book_available),
                service_book_remarks: agreement.service_book_remarks || null
            },

            warranty: {
                warranty_type,
                warranty_label,
                warranty_text,
                warranty_other_text,
                is_excluded: warranty_type === 'EXCLUDED',
                is_two_year: warranty_type === 'TWO_YEAR_ART_210',
                is_other: warranty_type === 'OTHER'
            },

            payment: {
                payment_type: agreement.payment_type || null,
                payment_other_text: agreement.payment_other_text || null,
                is_cash: agreement.payment_type === 'CASH_UPON_HANDOVER' || (agreement.payment_type && agreement.payment_type.toLowerCase().includes('cash'))
            },

            handover: {
                date: agreement.handover_date ? formatDate(agreement.handover_date, labels.PA_LABEL_NOT_SPECIFIED) : labels.PA_LABEL_NOT_SPECIFIED,
                location: agreement.handover_location || labels.PA_LABEL_NOT_SPECIFIED
            }
        };
        const finalHtml = template(templateData);

        // 7. Launch Puppeteer to generate A4 PDF
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        const pdfTimeout = 60000;

        page.setDefaultNavigationTimeout(pdfTimeout);
        page.setDefaultTimeout(pdfTimeout);

        await page.setContent(finalHtml, {
            waitUntil: 'domcontentloaded',
            timeout: pdfTimeout
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                bottom: '12mm',
                left: '15mm',
                right: '15mm'
            }
        });

        // Close browser after PDF generation
        await browser.close();
        browser = null;

        // 8. Save PDF to public/purchase-agreements directory and return public URL
        const fileBuffer = Buffer.isBuffer(pdfBuffer)
            ? pdfBuffer
            : Buffer.from(pdfBuffer);

        const fileName = `purchase-agreement-${agreement.id}.pdf`;
        const dirPath = path.join(process.cwd(), 'public', 'purchase-agreements');
        await fs.mkdir(dirPath, { recursive: true });

        const filePath = path.join(dirPath, fileName);
        await fs.writeFile(filePath, fileBuffer);

        const host = req.get('host');
        const protocol = req.protocol;
        const agreementUrl = `${protocol}://${host}/purchase-agreements/${fileName}`;

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY) || 'Purchase agreement PDF link fetched successfully',
            {
                agreement_url: agreementUrl,
                file_name: fileName
            },
            lang
        );

    } catch (error) {
        console.error('downloadPurchaseAgreementPdf error:', error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('PDF browser close error:', closeError);
            }
        }
    }
};

/**
 * Controller for getting the blank printable Purchase Agreement template link.
 * Route: GET /purchase-agreement/template
 */
export const downloadBlankPurchaseAgreementTemplate = async (req, res) => {
    let browser;
    try {
        const lang = req.query.lang || req.user?.language || 'en';
        const labels = getTemplateLabels(lang);

        const fileName = lang === 'en' ? 'purchase-agreement-template.pdf' : `purchase-agreement-template-${lang}.pdf`;
        const dirPath = path.join(process.cwd(), 'public');
        const filePath = path.join(dirPath, fileName);

        // Read Handlebars Template
        const templatePath = path.join(process.cwd(), 'templates/purchase_agreement.hbs');
        const templateHtml = await fs.readFile(templatePath, 'utf8');
        const template = handlebars.compile(templateHtml);

        const templateData = {
            lang,
            labels,
            is_blank_template: true,
            id: '',
            document_date: formatDate(new Date(), '')
        };

        const finalHtml = template(templateData);

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        const pdfTimeout = 60000;
        page.setDefaultNavigationTimeout(pdfTimeout);
        page.setDefaultTimeout(pdfTimeout);

        await page.setContent(finalHtml, {
            waitUntil: 'domcontentloaded',
            timeout: pdfTimeout
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                bottom: '12mm',
                left: '15mm',
                right: '15mm'
            }
        });

        await browser.close();
        browser = null;

        const fileBuffer = Buffer.isBuffer(pdfBuffer)
            ? pdfBuffer
            : Buffer.from(pdfBuffer);

        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, fileBuffer);

        const host = req.get('host');
        const protocol = req.protocol;
        const templateUrl = `${protocol}://${host}/${fileName}`;

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY) || 'Template link fetched successfully',
            {
                template_url: templateUrl,
                file_name: fileName
            },
            lang
        );
    } catch (error) {
        console.error('downloadBlankPurchaseAgreementTemplate error:', error);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('PDF browser close error:', closeError);
            }
        }
    }
};
