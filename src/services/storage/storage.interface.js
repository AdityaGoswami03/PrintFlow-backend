/**
 * Base Storage Service Interface
 * All concrete storage implementations (Local, AWS S3, Cloudflare R2) must implement these methods.
 */
export class IStorageService {
  /**
   * Upload a file from buffer/stream to object storage
   * @param {Object} file - { buffer, originalname, mimetype, size }
   * @param {string} destinationSubdir - Subdirectory or folder prefix
   * @returns {Promise<{ key: string, originalName: string, mimeType: string, size: number }>}
   */
  async uploadFile(file, destinationSubdir) {
    throw new Error('Method not implemented: uploadFile');
  }

  /**
   * Delete a file by its unique storage key
   * @param {string} fileKey
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileKey) {
    throw new Error('Method not implemented: deleteFile');
  }

  /**
   * Generate a secure, time-limited temporary signed URL to view/download the document
   * @param {string} fileKey - Storage key of the object
   * @param {number} expiresInSeconds - Time in seconds before URL expires (default: 900 / 15 mins)
   * @returns {Promise<string>}
   */
  async getSignedDownloadUrl(fileKey, expiresInSeconds = 900) {
    throw new Error('Method not implemented: getSignedDownloadUrl');
  }

  /**
   * Generate a direct client-to-storage presigned upload URL
   * @param {string} fileKey - Destination key
   * @param {string} contentType - MIME type ('application/pdf')
   * @param {number} expiresInSeconds - Expiration in seconds
   * @returns {Promise<{ uploadUrl: string, key: string, method: string }>}
   */
  async getPresignedUploadUrl(fileKey, contentType = 'application/pdf', expiresInSeconds = 900) {
    throw new Error('Method not implemented: getPresignedUploadUrl');
  }
}
