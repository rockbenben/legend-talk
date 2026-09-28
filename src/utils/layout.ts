import type { CSSProperties } from 'react';

/**
 * The proceedings column. 880 − the 140px marginal label = ~45 CJK characters
 * of measure; at 1200 a speech ran to 55+, past comfortable reading. The note,
 * transcript, action row and composer all sit on this same column — they are
 * one document, not a document plus chrome.
 */
export const COLUMN: CSSProperties = { maxWidth: 880, width: '100%', margin: '0 auto' };
/** Page gutter around the column. */
export const GUTTER = '0 clamp(16px, 5vw, 96px)';
/** The transcript scroller's inset: the gutter plus 24px of air at the ends. */
export const COLUMN_PADDING = '24px clamp(16px, 5vw, 96px)';
/** The registry grid is a gallery of cards, not a text column — it runs wider. */
export const WIDE_COLUMN: CSSProperties = { maxWidth: 1200, width: '100%', margin: '0 auto' };
