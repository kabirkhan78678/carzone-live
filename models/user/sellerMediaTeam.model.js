import db from '../../config/db.js';
import fs from 'fs';
import path from 'path';

export const syncTeamMembers = async (userId, members) => {
    const uploadDir = path.join(process.cwd(), "public/profile");

    const existingRows = await db.query(
        "SELECT id, profilePhoto FROM seller_team_members WHERE user_id = ?",
        [userId]
    );

    const existingById = new Map();
    existingRows.forEach(row => {
        existingById.set(Number(row.id), row);
    });

    const incomingIds = members
        .map(m => {
            // Handle empty string or invalid IDs
            if (!m.id || m.id === '' || m.id === null) return null;
            const numId = Number(m.id);
            return Number.isFinite(numId) && numId > 0 ? numId : null;
        })
        .filter(id => id !== null);

    //  FIND MEMBERS TO BE DELETED
    const toBeDeleted = existingRows.filter(
        row => !incomingIds.includes(Number(row.id))
    );

    // DELETE THEIR IMAGES (SAFE)
    for (const member of toBeDeleted) {
        if (!member.profilePhoto) continue;

        try {
            const fileName = member.profilePhoto.split("/profile/")[1];
            if (!fileName) continue;

            const filePath = path.join(uploadDir, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.warn("Image cleanup failed:", err.message);
        }
    }

    //  DB DELETE
    if (incomingIds.length > 0) {
        const placeholders = incomingIds.map(() => "?").join(",");
        await db.query(
            `DELETE FROM seller_team_members WHERE user_id = ? AND id NOT IN (${placeholders})`,
            [userId, ...incomingIds]
        );
    } else {
        await db.query(
            "DELETE FROM seller_team_members WHERE user_id = ?",
            [userId]
        );
    }

    // 🔄 INSERT / UPDATE
    for (const m of members) {
        // Handle empty string ID or invalid ID  
        const memberId = (m.id && m.id !== '') ? Number(m.id) : null;
        const hasId = memberId && Number.isFinite(memberId) && memberId > 0;

        // Ensure phoneNumber is string
        const phoneNumber = String(m.phoneNumber || '');
        // code edit by raj for removing image from local when user delete and maintain the state of photo if not passed in payload
        if (hasId && existingById.has(memberId)) {
            const existing = existingById.get(memberId);

            const hasNewPhoto = Object.prototype.hasOwnProperty.call(m, "profilePhoto");

            const photo = hasNewPhoto
                ? m.profilePhoto
                : existing.profilePhoto;

            //  IMAGE REPLACE CLEANUP
            // Sirf tab delete karo jab:
            // 1. New image aayi ho
            // 2. Old image exist karti ho
            // 3. Dono same na ho
            if (
                hasNewPhoto &&
                m.profilePhoto &&
                existing.profilePhoto &&
                m.profilePhoto !== existing.profilePhoto
            ) {
                try {
                    const oldFile = existing.profilePhoto.split("/profile/")[1];
                    if (oldFile) {
                        const oldPath = path.join(
                            process.cwd(),
                            "public/profile",
                            oldFile
                        );
                        if (fs.existsSync(oldPath)) {
                            fs.unlinkSync(oldPath);
                        }
                    }
                } catch (err) {
                    console.warn("Old image replace cleanup failed:", err.message);
                }
            }

            await db.query(
                `UPDATE seller_team_members
                 SET fullName = ?, role = ?, phoneNumber = ?, email = ?, languages = ?, profilePhoto = ?
                 WHERE id = ? AND user_id = ?`,
                [
                    m.fullName,
                    m.role,
                    phoneNumber,  // Use the converted string phoneNumber
                    m.email,
                    m.languages,
                    photo,
                    memberId,
                    userId
                ]
            );
        } else {
            await db.query(
                `INSERT INTO seller_team_members 
                 (user_id, fullName, role, phoneNumber, email, languages, profilePhoto)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    m.fullName,
                    m.role,
                    phoneNumber,
                    m.email,
                    m.languages,
                    m.profilePhoto || null
                ]
            );
        }
    }
};


// showroomImages

export const replaceShowroomImages = async (userId, images) => {
    await db.query("DELETE FROM seller_images WHERE user_id = ?", [userId]);

    for (const img of images) {
        await db.query(
            "INSERT INTO seller_images (user_id, imageUrl) VALUES (?, ?)",
            [userId, img.imageUrl]
        );
    }
};

// showroomVideos

export const replaceShowroomVideos = async (userId, videos) => {
    await db.query("DELETE FROM seller_videos WHERE user_id = ?", [userId]);

    for (const v of videos) {
        await db.query(
            "INSERT INTO seller_videos (user_id, videoUrl) VALUES (?, ?)",
            [userId, v.videoUrl]
        );
    }
};

export const getSellerGoogleData = async (userId) => {
    const rows = await db.query(
        `SELECT google_place_id, google_rating, google_rating_updated_at
     FROM tbl_users
     WHERE id = ? AND isSeller = 1
     LIMIT 1`,
        [userId]
    );
    return rows[0];
};

export const updateSellerGoogleRating = async (userId, rating) => {
    return db.query(
        `UPDATE tbl_users
     SET google_rating = ?, google_rating_updated_at = NOW()
     WHERE id = ?`,
        [rating, userId]
    );
};


/**========================model end========================= */
