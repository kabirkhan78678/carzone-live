import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), "public/profile");

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  // Videos
  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  'video/x-msvideo',
  'video/avi',
  'video/msvideo',
  'video/3gpp',
  'video/3gpp2',
  'video/x-m4v',
  'video/m4v',
  'video/ogg',
  'video/x-ms-wmv',
  'video/wmv',
  'video/mp2t',
  // Audio
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/amr',
  'audio/flac',
  'audio/x-caf',
  'audio/caf',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const ALLOWED_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  // Videos
  '.mp4', '.mov', '.mkv', '.webm', '.avi', '.3gp', '.3g2', '.m4v', '.ogv', '.wmv', '.ts',
  // Audio
  '.m4a', '.mp3', '.wav', '.aac', '.ogg', '.oga', '.weba', '.amr', '.flac', '.caf',
  // Documents
  '.pdf', '.doc', '.docx'
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const rawMime = (file.mimetype || '').toLowerCase();
  const mimeType = rawMime.split(';')[0].trim();

  const hasAllowedExt = ext ? ALLOWED_EXTENSIONS.has(ext) : false;
  const hasAllowedMime = mimeType ? (ALLOWED_MIME_TYPES.has(mimeType) || mimeType === 'application/octet-stream') : false;

  if ((hasAllowedExt && (hasAllowedMime || !mimeType)) || (!ext && hasAllowedMime && mimeType !== 'application/octet-stream')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type (${ext || mimeType}). Only images, videos, audio, and standard documents are permitted.`));
  }
};

const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeFieldName = (file.fieldname || 'file').replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${safeFieldName}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const uploadProfile = multer({
  storage: storageProduct,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  }
});

export { uploadProfile };