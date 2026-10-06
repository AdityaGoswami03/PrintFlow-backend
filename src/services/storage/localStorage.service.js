import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
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

    const ext = path.extname(file.originalname) || '.pdf';
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

    return {
      key: relativeKey,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/pdf',
      size: file.size,
    };
  }

  async deleteFile(fileKey) {
    try {
      const fullPath = path.join(this.baseUploadDir, fileKey);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false; // File already deleted or doesn't exist
      console.error(`[LocalStorageService] Failed to delete file ${fileKey}:`, error.message);
      return false;
    }
  }

  /**
   * Generates a temporary, signed streaming endpoint for local storage
   */
  async getSignedDownloadUrl(fileKey, expiresInSeconds = env.SIGNED_URL_EXPIRES_SECONDS) {
    const token = jwt.sign(
      { key: fileKey, purpose: 'DOCUMENT_STREAM' },
      env.JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );
    return `/api/v1/orders/stream-document?token=${token}`;
  }

  /**
   * Generates a direct upload token endpoint for local development testing
   */
  async getPresignedUploadUrl(fileKey, contentType = 'application/pdf', expiresInSeconds = env.SIGNED_URL_EXPIRES_SECONDS) {
    const token = jwt.sign(
      { key: fileKey, purpose: 'DOCUMENT_DIRECT_UPLOAD', contentType },
      env.JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );
    return {
      uploadUrl: `/api/v1/orders/direct-upload?token=${token}`,
      key: fileKey,
      method: 'PUT',
    };
  }
}
