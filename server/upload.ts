import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || './uploads';
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

ensureUploadDir();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${randomUUID()}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const safeBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${safeBasename}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for internal drive
    cb(null, true);
  },
});

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
