import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { IStorageService } from './storage.interface.js';
import { env } from '../../config/env.js';

export class LocalStorageService extends IStorageService {
  constructor(baseUploadDir = env.UPLOAD_DIR) {
    super();
    this.baseUploadDir = path.resolve(process.cwd(), baseUploadDir);
  }

  async uploadFile(file, destinationSubdir = 'documents') {
    const targetDir = path.join(this.baseUploadDir, destinationSubdir);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const destinationPath = path.join(targetDir, uniqueFilename);

    if (file.buffer) {
      await fs.writeFile(destinationPath, file.buffer);
    } else if (file.path) {
      await fs.rename(file.path, destinationPath);
    } else {
      throw new Error('Invalid file payload: Expected buffer or path');
    }

    const relativeKey = path.posix.join(destinationSubdir, uniqueFilename);
    const fileUrl = `/uploads/${relativeKey}`;

    return {
      key: relativeKey,
      fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async deleteFile(fileKey) {
    try {
      const fullPath = path.join(this.baseUploadDir, fileKey);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false; // File doesn't exist
      throw error;
    }
  }

  async getFileUrl(fileKey) {
    return `/uploads/${fileKey.replace(/\\/g, '/')}`;
  }
}
