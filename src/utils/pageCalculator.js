import { PAGE_SELECTION_TYPES } from '../constants/printOptions.js';
import { ApiError } from './ApiError.js';

/**
 * Calculates and validates the list of page numbers and total count to print.
 * @param {string} selectionType - ALL | RANGE | CUSTOM | ODD | EVEN
 * @param {string|null} customValue - e.g., "1-5" or "1,3,7"
 * @param {number} totalDocPages - Total pages in the uploaded PDF
 * @returns {{ pagesToPrintCount: number, pageNumbers: number[] }}
 */
export const calculatePagesToPrint = (selectionType, customValue, totalDocPages) => {
  if (!totalDocPages || totalDocPages < 1) {
    throw new ApiError(400, 'Invalid PDF: Document has no pages');
  }

  let selectedPages = new Set();

  switch (selectionType) {
    case PAGE_SELECTION_TYPES.ALL: {
      for (let i = 1; i <= totalDocPages; i++) {
        selectedPages.add(i);
      }
      break;
    }

    case PAGE_SELECTION_TYPES.RANGE: {
      if (!customValue || typeof customValue !== 'string') {
        throw new ApiError(400, "Page range must be specified for 'RANGE' selection (e.g., '1-5')");
      }
      const parts = customValue.trim().split('-');
      if (parts.length !== 2) {
        throw new ApiError(400, "Invalid page range format. Expected format: 'start-end' (e.g., '1-5')");
      }

      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);

      if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
        throw new ApiError(400, `Invalid page range: start (${start}) must be >= 1 and <= end (${end})`);
      }
      if (end > totalDocPages) {
        throw new ApiError(400, `Page range ${customValue} exceeds total document pages (${totalDocPages})`);
      }

      for (let i = start; i <= end; i++) {
        selectedPages.add(i);
      }
      break;
    }

    case PAGE_SELECTION_TYPES.CUSTOM: {
      if (!customValue || typeof customValue !== 'string') {
        throw new ApiError(400, "Specific pages must be specified for 'CUSTOM' selection (e.g., '1,3,7')");
      }
      const pageStrings = customValue.split(',');
      for (const pStr of pageStrings) {
        const pageNum = parseInt(pStr.trim(), 10);
        if (isNaN(pageNum) || pageNum < 1) {
          throw new ApiError(400, `Invalid page number in custom selection: '${pStr.trim()}'`);
        }
        if (pageNum > totalDocPages) {
          throw new ApiError(400, `Page ${pageNum} exceeds total document pages (${totalDocPages})`);
        }
        selectedPages.add(pageNum);
      }
      break;
    }

    case PAGE_SELECTION_TYPES.ODD: {
      for (let i = 1; i <= totalDocPages; i += 2) {
        selectedPages.add(i);
      }
      break;
    }

    case PAGE_SELECTION_TYPES.EVEN: {
      for (let i = 2; i <= totalDocPages; i += 2) {
        selectedPages.add(i);
      }
      if (selectedPages.size === 0) {
        throw new ApiError(400, `Document has only ${totalDocPages} page, no even pages exist`);
      }
      break;
    }

    default:
      throw new ApiError(400, `Unsupported page selection type: '${selectionType}'`);
  }

  const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);

  if (sortedPages.length === 0) {
    throw new ApiError(400, 'Selected page configuration results in 0 printable pages');
  }

  return {
    pagesToPrintCount: sortedPages.length,
    pageNumbers: sortedPages,
  };
};
