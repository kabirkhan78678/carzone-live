export const normalizeMySQLDate = (value) => {
    if (!value) return value;
    if (value instanceof Date) {
        return value.toISOString().split("T")[0];
    }
    const date = String(value).trim();
    // DD-MM-YYYY or DD/MM/YYYY or D-M-YYYY or D/M/YYYY
    const ddmmyyyy = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyy) {
        const [_, day, month, year] = ddmmyyyy;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    // ISO: 2024-06-24T00:00:00.000Z
    if (date.includes("T")) {
        return date.split("T")[0];
    }
    // Already YYYY-MM-DD or YYYY/MM/DD
    const yyyymmdd = date.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (yyyymmdd) {
        const [_, year, month, day] = yyyymmdd;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return value;
};