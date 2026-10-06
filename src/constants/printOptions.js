export const PAPER_SIZES = Object.freeze({
  A4: 'A4',
  A3: 'A3',
  LEGAL: 'LEGAL',
  LETTER: 'LETTER',
});

export const PRINT_TYPES = Object.freeze({
  BLACK_WHITE: 'BLACK_WHITE',
  COLOR: 'COLOR',
});

export const PRINT_SIDES = Object.freeze({
  SINGLE: 'SINGLE',
  DOUBLE: 'DOUBLE',
});

export const PAGE_SELECTION_TYPES = Object.freeze({
  ALL: 'ALL',
  RANGE: 'RANGE',     // e.g., "1-5"
  CUSTOM: 'CUSTOM',   // e.g., "1,3,7"
  ODD: 'ODD',         // Odd pages only
  EVEN: 'EVEN',       // Even pages only
});

export const DEFAULT_PRICING_CONFIG = Object.freeze({
  A4: {
    BLACK_WHITE: { single: 2.0, double: 3.0 },
    COLOR: { single: 10.0, double: 18.0 },
  },
  A3: {
    BLACK_WHITE: { single: 5.0, double: 8.0 },
    COLOR: { single: 20.0, double: 35.0 },
  },
});
