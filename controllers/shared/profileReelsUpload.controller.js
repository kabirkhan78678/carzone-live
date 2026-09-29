import { insertProfileReel } from '../../models/user.model.js';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { baseurl } from '../../config/path.js';

export const uploadProfileReel = async (req, res) => {
    try {
        let { id, language } = req.user;
        let profileReel = null;
        let profileReelThumbnail = null;
        if (req.files) {
            if (req.files.profileReel?.length) {
                profileReel = `${baseurl}/profile/${req.files.profileReel[0].filename}`;
            }
            if (req.files.profileReelThumbnail?.length) {
                profileReelThumbnail = `${baseurl}/profile/${req.files.profileReelThumbnail[0].filename}`;
            }
        }

        const payload = {
            user_id: id,
            reel_url: profileReel,
            thumbnail: profileReelThumbnail,
            captions: req.body.captions || null,
            is_active: 1,
        };
        const result = await insertProfileReel(payload);

        return handleSuccess(res, 200, getMessage(language, 'Reel uploaded successfully'));
    } catch (error) {
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
}
