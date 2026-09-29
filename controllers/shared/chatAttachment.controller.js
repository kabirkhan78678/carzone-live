import { addChatAttachmentModel, getChatAttachmentByIdModel, deleteChatAttachmentModel } from '../../models/user.model.js';
import path from 'path';
import fs from 'fs/promises';
import { variableTypes } from '../../utils/constant.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { baseurl } from '../../config/path.js';

export const uploadChatAttachment = async (req, res) => {
    try {

        const user_id = req.user?.id;
        const lang = req.user?.language || 'en';

        const file = req.files?.chatAttachment?.[0] || req.files?.file?.[0] || (Array.isArray(req.files) && req.files[0]) || req.file;

        if (!file) {
            return handleError(
                res,
                400,
                getMessage(lang, variableTypes.FILE_REQUIRED)
            );
        }

        let {
            attachment_type
        } = req.body || {};

        if (!attachment_type) {
            const mimeType = (file.mimetype || '').toLowerCase();
            const ext = path.extname(file.originalname || '').toLowerCase();
            if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext)) {
                attachment_type = 'image';
            } else if (mimeType.startsWith('video/') || ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.3gp', '.3g2', '.m4v', '.wmv', '.ogv', '.ts'].includes(ext)) {
                attachment_type = 'video';
            } else if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.oga', '.weba', '.amr', '.flac', '.caf'].includes(ext)) {
                attachment_type = 'audio';
            } else {
                attachment_type = 'document';
            }
        }

        const attachmentUrl = `${baseurl}/profile/${file.filename}`;

        const result = await addChatAttachmentModel({
            user_id,
            attachment_url: attachmentUrl,
            attachment_type,
            original_name: file.originalname ? file.originalname.substring(0, 255) : null,
            file_size: file.size || 0
        });

        return handleSuccess(
            res,
            200,
            getMessage(lang, variableTypes.FILE_UPLOADED_SUCCESSFULLY),
            {
                attachment_id: result.insertId,
                attachment_url: attachmentUrl,
                attachment_type,
                original_name: file.originalname,
                file_size: file.size
            }
        );

    } catch (error) {

        console.error("Error uploading chat attachment:", error);

        return handleError(
            res,
            500,
            getMessage("en", variableTypes.INTERNAL_SERVER_ERROR)
        );
    }
};

export const deleteChatAttachment = async (req, res) => {
    try {

        const attachment_id = req.params.id;
        const attachment = await getChatAttachmentByIdModel(attachment_id);

        if (!attachment) {
            return handleError(res, 404, "Attachment not found");
        }

        if (attachment.attachment_url) {
            const filename = path.basename(attachment.attachment_url);
            const filePath = path.join(
                process.cwd(),
                "public",
                "profile",
                filename
            );

            try {
                await fs.unlink(filePath);
            } catch (err) {
                // Ignore if file doesn't exist
                if (err.code !== "ENOENT") {
                    throw err;
                }
            }
        }

        await deleteChatAttachmentModel(attachment_id);

        return handleSuccess(
            res,
            200,
            "Attachment deleted successfully"
        );

    } catch (error) {
        console.error(error);
        return handleError(res, 500, "Internal server error");
    }
};
