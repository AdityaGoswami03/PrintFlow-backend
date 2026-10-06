import { PDFDocument } from 'pdf-lib';
import { ApiError } from './ApiError.js';

/**
 * Validates PDF binary headers (magic bytes) to ensure file is genuinely a PDF.
 * Checks for %PDF- signature (0x25, 0x50, 0x44, 0x46).
 *
 * @param {Buffer} buffer - File buffer
 * @returns {boolean}
 */
export const isValidPdfHeader = (buffer) => {
  if (!buffer || buffer.length < 4) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  );
};

/**
 * Inspects PDF buffer, validates genuine structure, and extracts total page count.
 *
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<number>} - Total page count
 * @throws {ApiError} - If header or structure is invalid
 */
export const validateAndExtractPdfPages = async (buffer) => {
  if (!isValidPdfHeader(buffer)) {
    throw new ApiError(
      400,
      'Invalid file content: The uploaded file is not a valid PDF document (magic byte signature check failed)'
    );
  }

  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    if (!pageCount || pageCount < 1) {
      throw new ApiError(400, 'Invalid PDF: Document contains 0 pages');
    }

    return pageCount;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      400,
      `Corrupted or unreadable PDF document: ${err.message || 'Structure parsing failed'}`
    );
  }
};
