export const CONDITION_WARRANTY_I18N = {
    de: {
        section_title: "Zustand & Garantie",
        mfk: {
            fresh_title: "Frisch vorgeführt",
            valid_title: "MFK gültig",
            due_title: "MFK fällig",
            no_data_title: "Nicht vorgeführt",
            prefix_at: "MFK am ",
            prefix_due: "MFK fällig am ",
            no_data_sub: "Keine Angaben"
        },
        warranty: {
            included_title: "Garantie inklusive",
            excluded_title: "Keine Garantie",
            seller_details: "Details beim Verkäufer",
            badge_yes: "Ja",
            badge_no: "Nein"
        }
    },
    en: {
        section_title: "Condition & Warranty",
        mfk: {
            fresh_title: "Freshly inspected",
            valid_title: "Valid inspection",
            due_title: "Inspection due",
            no_data_title: "Not inspected",
            prefix_at: "MFK on ",
            prefix_due: "MFK due on ",
            no_data_sub: "No details available"
        },
        warranty: {
            included_title: "Warranty included",
            excluded_title: "No warranty",
            seller_details: "Details from seller",
            badge_yes: "Yes",
            badge_no: "No"
        }
    },
    fr: {
        section_title: "État & Garantie",
        mfk: {
            fresh_title: "Expertisée du jour",
            valid_title: "Expertise valide",
            due_title: "Expertise à faire",
            no_data_title: "Non expertisée",
            prefix_at: "Expertise du ",
            prefix_due: "Expertise prévue le ",
            no_data_sub: "Aucune information"
        },
        warranty: {
            included_title: "Garantie incluse",
            excluded_title: "Aucune garantie",
            seller_details: "Détails auprès du vendeur",
            badge_yes: "Oui",
            badge_no: "Non"
        }
    },
    it: {
        section_title: "Stato & Garanzia",
        mfk: {
            fresh_title: "Collaudata di recente",
            valid_title: "Collaudo valido",
            due_title: "Collaudo scaduto",
            no_data_title: "Non collaudata",
            prefix_at: "Collaudo del ",
            prefix_due: "Collaudo entro il ",
            no_data_sub: "Nessuna informazione"
        },
        warranty: {
            included_title: "Garanzia inclusa",
            excluded_title: "Nessuna garanzia",
            seller_details: "Dettagli dal venditore",
            badge_yes: "Sì",
            badge_no: "No"
        }
    }
};

/**
 * Builds the Zustand & Garantie (Condition & Warranty) payload matching the new UI
 * @param {Object} car - Vehicle row object
 * @param {Object} mfkInfo - Computed MFK info from calculateMfk
 * @param {string} lang - Selected language code ('de', 'en', 'fr', 'it')
 * @returns {Object} Structured condition_and_warranty payload
 */
export const buildConditionAndWarrantyPayload = (car, mfkInfo = {}, lang = 'de') => {
    const rawLang = String(lang || 'de').toLowerCase().slice(0, 2);
    const i18n = CONDITION_WARRANTY_I18N[rawLang] || CONDITION_WARRANTY_I18N.de;

    // --- 1. MFK / INSPECTION ---
    const lastDateRaw = mfkInfo?.last_mfk_date || car?.last_mfk_date || null;
    let formattedMfkDate = null;
    if (lastDateRaw) {
        const d = new Date(lastDateRaw);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            formattedMfkDate = `${day}.${month}.${year}`;
        }
    }

    const nextDateRaw = mfkInfo?.next_mfk_due || car?.next_mfk_due || null;
    let formattedNextDate = null;
    if (nextDateRaw) {
        const d = new Date(nextDateRaw);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            formattedNextDate = `${day}.${month}.${year}`;
        }
    }

    const isFresh = Number(car?.mfk_status_id) === 1 ||
                    car?.mfk_status_code === 'freshly_inspected' ||
                    mfkInfo?.status === 'freshly_inspected' ||
                    Number(car?.is_fresh_from_service) === 1 ||
                    (mfkInfo?.days_since_last_mfk !== null && mfkInfo?.days_since_last_mfk !== undefined && mfkInfo.days_since_last_mfk <= 365);

    const isValid = isFresh ||
                    Number(car?.mfk_status_id) === 2 ||
                    car?.mfk_status_code === 'valid' ||
                    mfkInfo?.status === 'valid' ||
                    (mfkInfo?.days_until_next_mfk !== null && mfkInfo?.days_until_next_mfk !== undefined && mfkInfo.days_until_next_mfk > 0);

    const isDue = car?.mfk_status_code === 'due' ||
                  car?.mfk_status_code === 'expired' ||
                  mfkInfo?.status === 'expired' ||
                  (mfkInfo?.days_until_next_mfk !== null && mfkInfo?.days_until_next_mfk !== undefined && mfkInfo.days_until_next_mfk <= 0 && lastDateRaw);

    let mfkTitle = i18n.mfk.no_data_title;
    if (isFresh) {
        mfkTitle = i18n.mfk.fresh_title; // "Frisch vorgeführt"
    } else if (isValid) {
        mfkTitle = i18n.mfk.valid_title; // "MFK gültig"
    } else if (isDue) {
        mfkTitle = i18n.mfk.due_title;   // "MFK fällig"
    }

    let mfkSubtitle = i18n.mfk.no_data_sub; // "Keine Angaben"
    if (formattedMfkDate) {
        mfkSubtitle = `${i18n.mfk.prefix_at}${formattedMfkDate}`; // "MFK am 16.10.2026"
    } else if (formattedNextDate) {
        mfkSubtitle = `${i18n.mfk.prefix_due}${formattedNextDate}`;
    }

    const mfkIndicator = isFresh ? "#006400" : (isValid ? "#90EE90" : (isDue ? "#FF0000" : "#808080"));
    const mfkIndicatorColor = isFresh || isValid ? "green" : (isDue ? "red" : "grey");

    // --- 2. WARRANTY ---
    const warrantyValueNorm = String(car?.warranty_value || "").trim().toLowerCase();
    const isNoWarranty = !car?.mfk_warrenty_id ||
                         Number(car?.mfk_warrenty_id) === 1 ||
                         warrantyValueNorm === "no warranty" ||
                         warrantyValueNorm === "keine garantie" ||
                         warrantyValueNorm === "none";

    const hasWarranty = !isNoWarranty;

    const warrantyTitle = hasWarranty ? i18n.warranty.included_title : i18n.warranty.excluded_title; // "Garantie inklusive"
    const warrantyBadge = hasWarranty ? i18n.warranty.badge_yes : i18n.warranty.badge_no; // "Ja"

    const warrantyParts = [
        car?.warranty_value,
        car?.warranty_number_of_months ? `${car.warranty_number_of_months} ${rawLang === 'de' ? 'Monate' : 'months'}` : null,
        car?.warranty_kilometer ? `${car.warranty_kilometer} km` : null
    ].filter(Boolean);

    let warrantySubtitle = i18n.warranty.seller_details; // "Details beim Verkäufer"
    if (car?.warranty_description && car.warranty_description.trim() && car.warranty_description.trim().toLowerCase() !== "no warranty") {
        warrantySubtitle = car.warranty_description.trim();
    } else if (warrantyParts.length > 1) {
        warrantySubtitle = warrantyParts.slice(1).join(", ");
    } else if (car?.warranty_type_value) {
        warrantySubtitle = car.warranty_type_value;
    }

    return {
        section_title: i18n.section_title, // "Zustand & Garantie"
        title: i18n.section_title,
        inspection: {
            title: mfkTitle, // "Frisch vorgeführt"
            subtitle: mfkSubtitle, // "MFK am 16.10.2026"
            date: formattedMfkDate,
            raw_date: lastDateRaw,
            is_fresh: isFresh,
            is_inspected: isValid,
            has_mfk: isValid || !!lastDateRaw,
            indicator: mfkIndicatorColor,
            indicator_hex: mfkIndicator,
            icon: "check_circle"
        },
        mfk: {
            title: mfkTitle,
            subtitle: mfkSubtitle,
            date: formattedMfkDate,
            raw_date: lastDateRaw,
            is_fresh: isFresh,
            is_inspected: isValid,
            has_mfk: isValid || !!lastDateRaw,
            indicator: mfkIndicatorColor,
            indicator_hex: mfkIndicator,
            icon: "check_circle"
        },
        warranty: {
            title: warrantyTitle, // "Garantie inklusive"
            subtitle: warrantySubtitle, // "Details beim Verkäufer"
            badge: warrantyBadge, // "Ja"
            has_warranty: hasWarranty,
            warranty_included: hasWarranty,
            indicator: hasWarranty ? "red" : "grey",
            indicator_hex: hasWarranty ? "#C62828" : "#808080",
            icon: "shield_check",
            details: {
                id: car?.mfk_warrenty_id ?? null,
                months: car?.warranty_number_of_months ?? null,
                kilometer: car?.warranty_kilometer ?? null,
                description: car?.warranty_description ?? null,
                from: car?.warranty_from ?? null,
                to: car?.warranty_to ?? null,
                provider: car?.warranty_type_value ?? null
            }
        }
    };
};
