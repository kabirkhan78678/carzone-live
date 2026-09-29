import { sendSystemBroadcastNotification } from '../../services/notificationDispatchers.js';
import { handleSuccess, handleError } from '../../utils/responseHandler.js';
import { getMessage } from '../../utils/user_helper.js';
import { variableTypes } from '../../utils/constant.js';

export const sendSystemAnnouncement = async (req, res) => {
    try {
        const { title, body, isUrgent, user_ids, userIds, user_id, userId, targetUserIds } = req.body;

        if (!title || !body) {
            return handleError(res, 400, 'Title and body are required for system announcements');
        }

        // Normalize input into an array
        let rawUsers = user_ids ?? userIds ?? targetUserIds ?? user_id ?? userId ?? [];
        if (!Array.isArray(rawUsers)) {
            if (typeof rawUsers === 'string' && rawUsers.includes(',')) {
                rawUsers = rawUsers.split(',').map(s => s.trim());
            } else if (rawUsers !== null && rawUsers !== undefined && rawUsers !== '') {
                rawUsers = [rawUsers];
            } else {
                rawUsers = [];
            }
        }

        const result = await sendSystemBroadcastNotification({
            title: title.trim(),
            body: body.trim(),
            isUrgent: Boolean(isUrgent),
            user_ids: rawUsers
        });

        if (!result.success) {
            return handleError(res, 500, result.error || 'Failed to send system announcement');
        }

        const targetLabel = rawUsers.length > 0 && !rawUsers.includes('all') ? 'selected' : 'active';
        return handleSuccess(
            res,
            200,
            `System announcement sent to ${result.count} of ${result.total} ${targetLabel} devices.`,
            result
        );
    } catch (err) {
        console.error('Error in sendSystemAnnouncement:', err);
        return handleError(res, 500, getMessage('en', variableTypes.INTERNAL_SERVER_ERROR));
    }
};
