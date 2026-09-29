import { baseurl } from '../../config/path.js';
import { createEmblemModel, getEmblemListModel, getEmblemByIdModel, fetchEmblemById, updateEmblemModel, deleteEmblemModel } from '../../models/admin.model.js';
import { handleSuccessNew, handleError, handleSuccess } from '../../utils/responseHandler.js';

export const createEmblem = async (req, res) => {
    try {

        const {
            emblem_name,
            description
        } = req.body;

        if (!emblem_name) {
            return handleError(res, 400, "Emblem name is required");
        }

        let image = null;

        if (req.files && req.files.image) {
            image = `${baseurl}/profile/${req.files.image[0].filename}`;
        }

        const result = await createEmblemModel({
            emblem_name,
            image,
            description
        });

        return handleSuccess(
            res,
            201,
            "Emblem created successfully",
            result
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};

export const getEmblems = async (req, res) => {

    try {

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);

        const {
            search = "",
            status = ""
        } = req.query;

        const emblems = await getEmblemListModel({
            page,
            limit,
            search,
            status
        });

        return handleSuccessNew(
            res,
            200,
            "Data found successfully",
            {
                total: emblems.total,
                page,
                limit,
                totalPages: Math.ceil(emblems.total / limit),
                data: emblems.data
            }
        );

    } catch (error) {

        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );

    }

};

export const getEmblemById = async (req, res) => {

    try {

        const { id } = req.params;

        const emblem = await getEmblemByIdModel(id);

        if (!emblem) {
            return handleError(
                res,
                404,
                "Emblem not found"
            );
        }

        return handleSuccess(
            res,
            200,
            "Data found successfully",
            emblem
        );

    } catch (error) {

        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );

    }

};

export const updateEmblem = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            emblem_name,
            description,
            status
        } = req.body;

        const emblem = await fetchEmblemById(id);

        if (!emblem.length) {
            return handleError(res, 404, "Emblem not found");
        }

        let image;

        if (req.files && req.files.image) {

            image = `${baseurl}/profile/${req.files.image[0].filename}`;

        } else {

            image = emblem[0].image;

        }

        const result = await updateEmblemModel({
            id,
            emblem_name,
            image,
            description,
            status
        });

        return handleSuccess(
            res,
            200,
            "Emblem updated successfully",
            result
        );

    } catch (error) {

        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );

    }
};

export const deleteEmblem = async (req, res) => {
    try {

        const { id } = req.params;
        const emblem = await fetchEmblemById(id);

        if (!emblem.length) {
            return handleError(
                res,
                404,
                "Emblem not found"
            );
        }
        await deleteEmblemModel(id);
        return handleSuccess(
            res,
            200,
            "Emblem deleted successfully",
            null
        );
    } catch (error) {
        console.error(error);

        return handleError(
            res,
            500,
            "Internal server error"
        );
    }
};
