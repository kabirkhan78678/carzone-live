import dayjs from 'dayjs';

export const MFK_STATUS = {
    FRESH_MFK: "FRESH_MFK",
    FROM_MFK: "FROM_MFK",
    REMAINING_MFK: "REMAINING_MFK",
    NO_MFK: "NO_MFK",
    NO_DATA: "NO_DATA"
};

export const INDICATOR_MAP = {
    [MFK_STATUS.FRESH_MFK]: "#006400",
    [MFK_STATUS.FROM_MFK]: "#90EE90",
    [MFK_STATUS.REMAINING_MFK]: "#FFFF00",
    [MFK_STATUS.NO_MFK]: "#FF0000",
    [MFK_STATUS.NO_DATA]: "#808080"
};

export const calculateMfk = ({
    mfk_status_code = null,
    first_registration_date = null,
    last_mfk_date = null,
    from_mfk = false
}) => {
    if (!mfk_status_code) {
        return {
            status: MFK_STATUS.NO_DATA,
            indicator: "grey",
            last_mfk_date: last_mfk_date || null,
            next_mfk_due: null,
            days_since_last_mfk: null,
            days_until_next_mfk: null,
            mfk_cycle: "5_3_2",
            mfk_source: null
        };
    }
    const today = dayjs().startOf("day");
    let firstRegistration = null;
    let lastMfk = null;
    if (first_registration_date) {
        const parsed = dayjs(first_registration_date).startOf("day");
        if (parsed.isValid()) {
            firstRegistration = parsed;
        }
    }
    if (last_mfk_date) {
        const parsed = dayjs(last_mfk_date).startOf("day");
        if (parsed.isValid()) {
            lastMfk = parsed;
        }
    }
    let nextMfkDate = null;
    if (lastMfk) {
        if (mfk_status_code === "freshly_inspected") {
            nextMfkDate = lastMfk.add(3, "year");
        } else {
            nextMfkDate = lastMfk.add(2, "year");
        }
    } else if (firstRegistration) {
        nextMfkDate =
            firstRegistration.add(5, "year");
    }
    const daysSinceLastMfk =
        lastMfk
            ? today.diff(lastMfk, "day")
            : null;
    const daysUntilNextMfk =
        nextMfkDate
            ? nextMfkDate.diff(today, "day")
            : null;
    const indicatorMap = {
        freshly_inspected: "#006400",
        valid: "#90EE90",
        expired: "#FF0000"
    };
    return {
        status: mfk_status_code,
        indicator:
            indicatorMap[mfk_status_code] || "grey",
        last_mfk_date:
            lastMfk
                ? lastMfk.format("YYYY-MM-DD")
                : null,
        next_mfk_due:
            nextMfkDate
                ? nextMfkDate.format("YYYY-MM-DD")
                : null,
        days_since_last_mfk:
            daysSinceLastMfk,
        days_until_next_mfk:
            daysUntilNextMfk,
        mfk_cycle: "5_3_2",
        mfk_source:
            from_mfk ? "MFK" : "USER"
    };
};

export const buildMfkMessage = ({
    status,
    last_mfk_date = null,
    next_mfk_due = null,
    language = "en"
}) => {
    const formatDate = (date) => {
        if (!date) return "";
        return dayjs(date).format("DD.MM.YYYY");
    };
    const templates = {
        en: {
            FRESH_MFK:
                "MFK for this vehicle was completed on {lastDate}.",
            FROM_MFK:
                "MFK for this vehicle was completed on {lastDate} and the next MFK is due on {nextDate}.",
            REMAINING_MFK:
                "The MFK for this vehicle is due on {nextDate}.",
            NO_MFK:
                "The MFK inspection is overdue.",
            NO_DATA:
                "No MFK information available."
        },
        fr: {
            FRESH_MFK:
                "Le contrôle MFK de ce véhicule a été effectué le {lastDate}.",
            FROM_MFK:
                "Le contrôle MFK de ce véhicule a été effectué le {lastDate} et le prochain contrôle MFK est prévu le {nextDate}.",
            REMAINING_MFK:
                "Le contrôle MFK de ce véhicule est prévu le {nextDate}.",
            NO_MFK:
                "Le contrôle MFK est en retard.",
            NO_DATA:
                "Aucune information MFK disponible."
        },
        de: {
            FRESH_MFK:
                "Die MFK für dieses Fahrzeug wurde am {lastDate} durchgeführt.",
            FROM_MFK:
                "Die MFK für dieses Fahrzeug wurde am {lastDate} durchgeführt und die nächste MFK ist am {nextDate} fällig.",
            REMAINING_MFK:
                "Die MFK für dieses Fahrzeug ist am {nextDate} fällig.",
            NO_MFK:
                "Die MFK-Prüfung ist überfällig.",
            NO_DATA:
                "Keine MFK-Informationen verfügbar."
        },
        it: {
            FRESH_MFK:
                "La MFK per questo veicolo è stata effettuata il {lastDate}.",
            FROM_MFK:
                "La MFK per questo veicolo è stata effettuata il {lastDate} e la prossima MFK è prevista per il {nextDate}.",
            REMAINING_MFK:
                "La MFK per questo veicolo è prevista per il {nextDate}.",
            NO_MFK:
                "La MFK è scaduta.",
            NO_DATA:
                "Nessuna informazione MFK disponibile."
        }
    };
    const t = templates[language] || templates.en;
    const fill = (template, values = {}) => {
        return template
            .replace("{lastDate}", values.lastDate || "")
            .replace("{nextDate}", values.nextDate || "");
    };
    switch (status) {
        case "freshly_inspected":
            return fill(t.FRESH_MFK, {
                lastDate: formatDate(last_mfk_date)
            });
        case "valid":
            return fill(t.FROM_MFK, {
                lastDate: formatDate(last_mfk_date),
                nextDate: formatDate(next_mfk_due)
            });
        case "expired":
            return t.NO_MFK;
        default:
            return t.NO_DATA;
    }
};