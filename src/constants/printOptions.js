export const PAPER_SIZES = Object.freeze({
  A4: 'A4',
  A3: 'A3',
  LEGAL: 'LEGAL',
  LETTER: 'LETTER',
});

export const COLOR_MODES = Object.freeze({
  BW: 'BW', // Black & White
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
