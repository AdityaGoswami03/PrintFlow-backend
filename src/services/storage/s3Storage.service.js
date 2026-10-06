import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import { IStorageService } from './storage.interface.js';
import { env } from '../../config/env.js';

export class S3StorageService extends IStorageService {
  constructor() {
    super();
    this.bucketName = env.S3_BUCKET_NAME;

    const s3Config = {
      region: env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    };

    // Cloudflare R2 or custom S3-compatible endpoints
    if (env.S3_ENDPOINT) {
      s3Config.endpoint = env.S3_ENDPOINT;
    }

    this.s3Client = new S3Client(s3Config);
  }

  async uploadFile(file, destinationSubdir = 'documents') {
    const ext = path.extname(file.originalname) || '.pdf';
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const fileKey = `${destinationSubdir}/${uniqueFilename}`.replace(/^\/+/, '');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/pdf',
      Metadata: {
        originalName: encodeURIComponent(file.originalname),
      },
    });

    await this.s3Client.send(command);

    return {
      key: fileKey,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/pdf',
      size: file.size,
    };
  }

  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`[S3StorageService] Failed to delete object ${fileKey}:`, error.message);
      return false;
    }
  }

  async getSignedDownloadUrl(fileKey, expiresInSeconds = env.SIGNED_URL_EXPIRES_SECONDS) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ResponseContentType: 'application/pdf',
      ResponseContentDisposition: 'inline', // Opens inside browser PDF viewer
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async getPresignedUploadUrl(fileKey, contentType = 'application/pdf', expiresInSeconds = env.SIGNED_URL_EXPIRES_SECONDS) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });

    return {
      uploadUrl,
      key: fileKey,
      method: 'PUT',
    };
  }
}
