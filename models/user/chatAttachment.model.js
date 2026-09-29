import db from '../../config/db.js';

// Ensure table exists
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS tbl_chat_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                attachment_url VARCHAR(500) NULL,
                attachment_type VARCHAR(100) NULL,
                original_name VARCHAR(255) NULL,
                file_size BIGINT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        console.error('Error creating tbl_chat_attachments:', e);
    }
})();

export const addChatAttachmentModel = async (data) => {
    return db.query('INSERT INTO tbl_chat_attachments SET ?', [data]);
};

export const getChatAttachmentByIdModel = async (id) => {
    const rows = await db.query('SELECT * FROM tbl_chat_attachments WHERE id = ? LIMIT 1', [id]);
    return rows?.length > 0 ? rows[0] : null;
};

export const deleteChatAttachmentModel = async (id) => {
    return db.query('DELETE FROM tbl_chat_attachments WHERE id = ?', [id]);
};
