import { createSavedSearch, getUserSavedSearches, deleteSavedSearch } from '../../models/user/savedSearch.model.js';
import { handleSuccess, handleError } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const createSavedSearchController = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.user?.language || 'en';
        const { search_name, searchName, filters } = req.body;

        if (!filters || (typeof filters !== 'object' && typeof filters !== 'string')) {
            return handleError(res, 400, 'Filters object is required');
        }

        const name = (search_name || searchName || 'Saved Search').trim();
        const savedSearch = await createSavedSearch(userId, name, filters);

        return handleSuccess(
            res,
            201,
            'Saved search created successfully',
            savedSearch,
            lang
        );
    } catch (err) {
        console.error('Error in createSavedSearchController:', err);
        return handleError(res, 500, getMessage(req.user?.language || 'en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const getSavedSearchesController = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.user?.language || 'en';

        const searches = await getUserSavedSearches(userId);
        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.DATA_FOUND_SUCCESSFULLY) || 'Saved searches retrieved',
            searches,
            lang
        );
    } catch (err) {
        console.error('Error in getSavedSearchesController:', err);
        return handleError(res, 500, getMessage(req.user?.language || 'en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};

export const deleteSavedSearchController = async (req, res) => {
    try {
        const userId = req.user.id;
        const lang = req.user?.language || 'en';
        const { id } = req.params;

        if (!id) {
            return handleError(res, 400, 'Saved search ID is required');
        }

        const success = await deleteSavedSearch(userId, id);
        if (!success) {
            return handleError(res, 404, 'Saved search not found or unauthorized');
        }

        return handleSuccess(
            res,
            200,
            'Saved search deleted successfully',
            null,
            lang
        );
    } catch (err) {
        console.error('Error in deleteSavedSearchController:', err);
        return handleError(res, 500, getMessage(req.user?.language || 'en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
