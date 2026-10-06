import { z } from 'zod';
import { PAPER_SIZES, PRINT_TYPES, PRINT_SIDES, PAGE_SELECTION_TYPES } from '../constants/printOptions.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';

// Pre-process numeric string inputs from multipart/form-data
const stringToNumber = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
};

export const createOrderSchema = z.object({
  body: z.object({
    shopIdentifier: z.string().min(1, 'Shop identifier/slug is required'),
    copies: z.preprocess(stringToNumber, z.number().int().min(1, 'Copies must be at least 1').default(1)),
    paperSize: z
      .string()
      .toUpperCase()
      .pipe(z.enum([PAPER_SIZES.A4, PAPER_SIZES.A3, PAPER_SIZES.LEGAL, PAPER_SIZES.LETTER]))
      .default(PAPER_SIZES.A4),
    printType: z
      .string()
      .toUpperCase()
      .transform((val) => (val === 'BW' ? 'BLACK_WHITE' : val))
      .pipe(z.enum([PRINT_TYPES.BLACK_WHITE, PRINT_TYPES.COLOR]))
      .default(PRINT_TYPES.BLACK_WHITE),
    printSides: z
      .string()
      .toUpperCase()
      .pipe(z.enum([PRINT_SIDES.SINGLE, PRINT_SIDES.DOUBLE]))
      .default(PRINT_SIDES.SINGLE),
    pageSelectionType: z
      .string()
      .toUpperCase()
      .pipe(z.enum([
        PAGE_SELECTION_TYPES.ALL,
        PAGE_SELECTION_TYPES.RANGE,
        PAGE_SELECTION_TYPES.CUSTOM,
        PAGE_SELECTION_TYPES.ODD,
        PAGE_SELECTION_TYPES.EVEN,
      ]))
      .default(PAGE_SELECTION_TYPES.ALL),
    pageSelectionCustomValue: z.string().nullable().optional(),
    customerPhone: z.string().optional().default(''),
    customerNotes: z.string().max(500).optional().default(''),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    status: z.enum([
      ORDER_STATUS.ACCEPTED,
      ORDER_STATUS.PRINTING,
      ORDER_STATUS.COMPLETED,
      ORDER_STATUS.REJECTED,
      ORDER_STATUS.CANCELLED,
    ]),
    note: z.string().max(250).optional().default(''),
  }),
});

export const calculatePricePreviewSchema = z.object({
  body: z.object({
    shopIdentifier: z.string().min(1, 'Shop identifier is required'),
    totalDocPages: z.number().int().min(1, 'Total document pages must be at least 1'),
    copies: z.number().int().min(1).default(1),
    paperSize: z.enum([PAPER_SIZES.A4, PAPER_SIZES.A3]).default(PAPER_SIZES.A4),
    printType: z
      .string()
      .toUpperCase()
      .transform((val) => (val === 'BW' ? 'BLACK_WHITE' : val))
      .pipe(z.enum([PRINT_TYPES.BLACK_WHITE, PRINT_TYPES.COLOR]))
      .default(PRINT_TYPES.BLACK_WHITE),
    printSides: z.enum([PRINT_SIDES.SINGLE, PRINT_SIDES.DOUBLE]).default(PRINT_SIDES.SINGLE),
    pageSelectionType: z
      .enum([
        PAGE_SELECTION_TYPES.ALL,
        PAGE_SELECTION_TYPES.RANGE,
        PAGE_SELECTION_TYPES.CUSTOM,
        PAGE_SELECTION_TYPES.ODD,
        PAGE_SELECTION_TYPES.EVEN,
      ])
      .default(PAGE_SELECTION_TYPES.ALL),
    pageSelectionCustomValue: z.string().nullable().optional(),
  }),
});
