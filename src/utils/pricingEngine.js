import { ApiError } from './ApiError.js';
import { PRINT_SIDES, PRINT_TYPES, PAPER_SIZES } from '../constants/printOptions.js';

/**
 * Normalizes print type (handling 'BW' as alias for 'BLACK_WHITE')
 */
export const normalizePrintType = (type) => {
  if (!type) return PRINT_TYPES.BLACK_WHITE;
  const upper = type.toUpperCase();
  if (upper === 'BW' || upper === 'BLACK_WHITE') return PRINT_TYPES.BLACK_WHITE;
  if (upper === 'COLOR') return PRINT_TYPES.COLOR;
  return upper;
};

/**
 * Normalizes print side
 */
export const normalizePrintSide = (side) => {
  if (!side) return PRINT_SIDES.SINGLE;
  const upper = side.toUpperCase();
  if (upper === 'SINGLE' || upper === 'DOUBLE') return upper;
  return upper;
};

/**
 * Calculates the exact price for a given print configuration using the shop's pricing matrix.
 *
 * @param {Object} shopPricing - The pricing matrix from the Shop document
 * @param {Object} options
 * @param {string} options.paperSize - 'A4' | 'A3'
 * @param {string} options.printType - 'BLACK_WHITE' | 'COLOR'
 * @param {string} options.printSides - 'SINGLE' | 'DOUBLE'
 * @param {number} options.pagesToPrintCount - Total printable pages per copy
 * @param {number} options.copies - Total copies to produce (>= 1)
 * @returns {{ unitRate: { single: number, double: number }, costPerCopy: number, totalAmount: number, breakdown: Object }}
 */
export const calculateOrderPrice = (shopPricing, {
  paperSize = PAPER_SIZES.A4,
  printType = PRINT_TYPES.BLACK_WHITE,
  printSides = PRINT_SIDES.SINGLE,
  pagesToPrintCount = 1,
  copies = 1,
}) => {
  const normPaperSize = paperSize.toUpperCase();
  const normPrintType = normalizePrintType(printType);
  const normPrintSides = normalizePrintSide(printSides);

  const sizePricing = shopPricing?.[normPaperSize] || shopPricing?.baseRates?.[normPaperSize];
  if (!sizePricing) {
    throw new ApiError(400, `Pricing configuration for paper size '${normPaperSize}' not found for this shop`);
  }

  const typePricing = sizePricing[normPrintType];
  if (!typePricing || typeof typePricing.single !== 'number' || typeof typePricing.double !== 'number') {
    throw new ApiError(400, `Pricing rates for '${normPrintType}' on '${normPaperSize}' are not configured properly`);
  }

  const singleRate = typePricing.single;
  const doubleRate = typePricing.double;

  let costPerCopy = 0;
  let breakdown = {};

  if (normPrintSides === PRINT_SIDES.SINGLE) {
    costPerCopy = pagesToPrintCount * singleRate;
    breakdown = {
      sheetsCount: pagesToPrintCount,
      rateApplied: singleRate,
      type: 'SINGLE_SIDED',
    };
  } else {
    // Double-sided printing:
    // Full 2-sided sheets + any single remaining odd page
    const doubleSheets = Math.floor(pagesToPrintCount / 2);
    const remainderSingle = pagesToPrintCount % 2;
    costPerCopy = (doubleSheets * doubleRate) + (remainderSingle * singleRate);
    breakdown = {
      doubleSheets,
      doubleRate,
      remainderSingle,
      singleRate,
      type: 'DOUBLE_SIDED',
    };
  }

  // Round to 2 decimal places to prevent floating point inaccuracies
  costPerCopy = Math.round(costPerCopy * 100) / 100;
  const totalAmount = Math.round(costPerCopy * copies * 100) / 100;

  return {
    unitRates: { single: singleRate, double: doubleRate },
    costPerCopy,
    totalAmount,
    breakdown,
  };
};
