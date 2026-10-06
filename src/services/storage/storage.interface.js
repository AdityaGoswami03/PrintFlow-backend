/**
 * Base Storage Service Interface
 * All concrete storage implementations (Local, AWS S3, Cloudinary, Cloudflare R2) must implement these methods.
 */
export class IStorageService {
  /**
   * Upload a file
   * @param {Object} file - The file object from multer (buffer or disk path, originalname, mimetype, size)
   * @param {string} destinationSubdir - Subdirectory or folder prefix
   * @returns {Promise<{ key: string, fileUrl: string, originalName: string, mimeType: string, size: number }>}
   */
  async uploadFile(file, destinationSubdir) {
    throw new Error('Method not implemented.');
  }

  /**
   * Delete a file by its unique storage key/path
   * @param {string} fileKey
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileKey) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get a public or temporary pre-signed URL to view/download the document
   * @param {string} fileKey
   * @param {number} expiresInSeconds
   * @returns {Promise<string>}
   */
  async getFileUrl(fileKey, expiresInSeconds = 3600) {
    throw new Error('Method not implemented.');
  }
}
