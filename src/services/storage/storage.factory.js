import { env } from '../../config/env.js';
import { LocalStorageService } from './localStorage.service.js';
import { S3StorageService } from './s3Storage.service.js';

let storageInstance = null;

export const getStorageService = () => {
  if (!storageInstance) {
    const provider = (env.STORAGE_PROVIDER || 'local').toLowerCase();

    switch (provider) {
      case 's3':
      case 'r2':
        storageInstance = new S3StorageService();
        break;
      case 'local':
      default:
        storageInstance = new LocalStorageService(env.UPLOAD_DIR);
        break;
    }
  }
  return storageInstance;
};
