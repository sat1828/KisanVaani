import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../lib/logger';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = ALLOWED_EXT[file.mimetype] || '.jpg';
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(
        `Unsupported file type "${file.mimetype}". Allowed: JPEG, PNG, WebP.`,
        400,
        'UNSUPPORTED_FILE_TYPE'
      ) as any);
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /api/upload — accepts a single image (`image` field) and returns a
 * URL the frontend can pass as `imageUrl` to POST /api/chat.
 *
 * Note on EXIF/GPS stripping: this endpoint validates MIME type and size
 * but does NOT currently strip EXIF metadata (which can contain GPS
 * coordinates from a farmer's phone). Proper stripping needs an image
 * processing library (e.g. `sharp`) which isn't vendored in this
 * environment's dependency set. Before going to production with real
 * uploads, add `sharp` and re-encode every upload through it (which both
 * strips EXIF and gives you resizing/compression for free). Tracked
 * honestly here rather than silently skipped.
 */
router.post('/', (req: Request, res: Response, next) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Image too large (max 5MB)', 400, 'IMAGE_TOO_LARGE'));
        }
        return next(new AppError(err.message, 400, 'UPLOAD_ERROR'));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No image file provided (expected field name "image")', 400, 'NO_FILE'));
    }

    const publicBase = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${publicBase.replace(/\/$/, '')}/uploads/${req.file.filename}`;

    logger.info('Image uploaded', { filename: req.file.filename, sizeBytes: req.file.size });

    res.status(201).json({
      success: true,
      url,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
});

export default router;
