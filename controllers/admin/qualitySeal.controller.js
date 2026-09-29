import { baseurl } from '../../config/path.js';
import {
    createQualitySealModel,
    getQualitySealListModel,
    getQualitySealByIdModel,
    fetchQualitySealById,
    updateQualitySealModel,
    deleteQualitySealModel
} from '../../models/admin.model.js';
import { handleSuccessNew, handleError, handleSuccess } from '../../utils/responseHandler.js';

export const createQualitySeal = async (req, res) => {
    try {
        const {
            name,
            description
        } = req.body;

        if (!name) {
            return handleError(res, 400, "Quality seal name is required");
        }

        let image = null;

        if (req.files && req.files.image && req.files.image.length > 0) {
            image = `${baseurl}/profile/${req.files.image[0].filename}`;
        } else if (req.file) {
            image = `${baseurl}/profile/${req.file.filename}`;
        }

        const result = await createQualitySealModel({
            name,
            image,
            description: description || null
        });

        return handleSuccess(
            res,
            201,
            "Quality seal created successfully",
            {
                id: result.insertId,
                name,
                image,
                description
            }
        );
    } catch (error) {
        console.error("createQualitySeal error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getQualitySeals = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);

        const {
            search = "",
            status = ""
        } = req.query;

        const qualitySeals = await getQualitySealListModel({
            page,
            limit,
            search,
            status
        });

        return handleSuccessNew(
            res,
            200,
            "Quality seals fetched successfully",
            {
                total: qualitySeals.total,
                page,
                limit,
                totalPages: Math.ceil(qualitySeals.total / limit),
                data: qualitySeals.data
            }
        );
    } catch (error) {
        console.error("getQualitySeals error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getQualitySealById = async (req, res) => {
    try {
        const { id } = req.params;

        const seal = await getQualitySealByIdModel(id);

        if (!seal) {
            return handleError(res, 404, "Quality seal not found");
        }

        return handleSuccessNew(
            res,
            200,
            "Quality seal fetched successfully",
            seal
        );
    } catch (error) {
        console.error("getQualitySealById error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const updateQualitySeal = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            status
        } = req.body;

        const existing = await fetchQualitySealById(id);
        if (!existing || existing.length === 0) {
            return handleError(res, 404, "Quality seal not found");
        }

        let image = existing[0].image;

        if (req.files && req.files.image && req.files.image.length > 0) {
            image = `${baseurl}/profile/${req.files.image[0].filename}`;
        } else if (req.file) {
            image = `${baseurl}/profile/${req.file.filename}`;
        }

        await updateQualitySealModel({
            id,
            name: name !== undefined ? name : existing[0].name,
            image,
            description: description !== undefined ? description : existing[0].description,
            status: status !== undefined ? status : existing[0].status
        });

        const updated = await getQualitySealByIdModel(id);

        return handleSuccess(
            res,
            200,
            "Quality seal updated successfully",
            updated
        );
    } catch (error) {
        console.error("updateQualitySeal error:", error);
        return handleError(res, 500, "Internal server error");
    }
};

export const deleteQualitySeal = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await fetchQualitySealById(id);
        if (!existing || existing.length === 0) {
            return handleError(res, 404, "Quality seal not found");
        }

        await deleteQualitySealModel(id);

        return handleSuccess(
            res,
            200,
            "Quality seal deleted successfully",
            { id: Number(id) }
        );
    } catch (error) {
        console.error("deleteQualitySeal error:", error);
        return handleError(res, 500, "Internal server error");
    }
};
