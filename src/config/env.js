import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || '*',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  DB_NAME: process.env.DB_NAME || 'printflow',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_min_32_chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Storage configuration ('local' | 's3' | 'r2')
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 25,

  // AWS S3 / Cloudflare R2 Credentials
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
  S3_REGION: process.env.S3_REGION || 'auto',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '', // Required for Cloudflare R2 (e.g. https://<accountid>.r2.cloudflarestorage.com)

  // Document retention and security
  DOC_RETENTION_HOURS: parseInt(process.env.DOC_RETENTION_HOURS, 10) || 24, // Retention after order completion
  SIGNED_URL_EXPIRES_SECONDS: parseInt(process.env.SIGNED_URL_EXPIRES_SECONDS, 10) || 900, // 15 mins
};

// Validate critical environment configurations in production
if (env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_secret_key_change_in_production_min_32_chars') {
    console.warn('⚠️ [Config Warning] JWT_SECRET is using default development value in production mode.');
  }
  if (!process.env.MONGO_URI) {
    console.error('💥 [Config Error] MONGO_URI must be defined in production!');
  }
  if (env.STORAGE_PROVIDER !== 'local' && (!env.S3_BUCKET_NAME || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)) {
    console.error('💥 [Config Error] S3/R2 storage provider selected but credentials (S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) are missing!');
  }
}
