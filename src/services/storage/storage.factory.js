import { env } from '../../config/env.js';
import { LocalStorageService } from './localStorage.service.js';

let storageInstance = null;

export const getStorageService = () => {
  if (!storageInstance) {
    switch (env.STORAGE_PROVIDER.toLowerCase()) {
      case 'local':
        storageInstance = new LocalStorageService(env.UPLOAD_DIR);
        break;
      // Future cloud object storage providers can be plugged in seamlessly here
      // case 's3':
      //   storageInstance = new S3StorageService();
      //   break;
      // case 'cloudinary':
      //   storageInstance = new CloudinaryStorageService();
      //   break;
      default:
        storageInstance = new LocalStorageService(env.UPLOAD_DIR);
    }
  }
  return storageInstance;
};
