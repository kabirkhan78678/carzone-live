import path from 'path';
import fs from 'fs/promises';
import { getUserActivePlans, getUserTotalSlots, countUserCars } from '../../models/user.model.js';
import { hasExplicitContent } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const toNumber = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
};

export const normalizePowerOutput = (val) => {
    if (val === undefined || val === null) return null;
    const str = String(val).trim();
    return str === '' ? null : str;
};

export const composePowerOutput = (kwValue, psValue, rawValue = null) => {
    const normalizedRaw = normalizePowerOutput(rawValue);
    if (normalizedRaw) return normalizedRaw;
    const kw = toNumber(kwValue);
    const ps = toNumber(psValue);
    if (kw !== null && ps !== null) return `${kw}(${ps})`;
    if (kw !== null) return String(kw);
    if (ps !== null) return String(ps);
    return null;
};

export const toBool = (val) => {
    const str = String(val ?? "").trim().toLowerCase();
    return Number(val) === true || val === 1 || str === "true" || str === "1" ? 1 : 0;
};

export const handleCarFilesAndRekognition = async (files) => {
    let carReel = null, carImages = [], document = null, reelThumbnails = null;
    let explicitContent = false;

    if (files) {
        if (files['carReel'] && files['carReel'][0]) {
            carReel = files['carReel'][0].location;
        }
        if (files['reelThumbnails'] && files['reelThumbnails'][0]) {
            reelThumbnails = files['reelThumbnails'][0].location;
        }
        if (files['document'] && files['document'][0]) {
            document = files['document'][0].location;
        }
        if (files['carImages']) {
            carImages = files['carImages'].map(file => file.location);
            const imageBuffers = await Promise.all(
                files['carImages'].map(async (file) => {
                    if (file.buffer) return file.buffer;
                    if (file.path) return await fs.readFile(file.path);
                    return null;
                })
            );
            const validBuffers = imageBuffers.filter(Boolean);
            if (validBuffers.length > 0) {
                const results = await Promise.all(validBuffers.map(buffer => hasExplicitContent(buffer)));
                explicitContent = results.some(result => result === true);
            }
        }
    }

    return { carReel, carImages, document, reelThumbnails, explicitContent };
};

export const validateUserSlots = async (userId, lang = 'en') => {
    const plans = await getUserActivePlans(userId);
    if (!plans || plans.length === 0) {
        return { error: 'no active plan' };
    }
    const slotLimit = await getUserTotalSlots(userId);
    const listedCarCount = await countUserCars(userId);
    if (listedCarCount >= slotLimit) {
        return { error: variableTypes.SLOT_LIMIT_EXCEEDED };
    }
    return { ok: true, slotLimit, listedCarCount };
};
