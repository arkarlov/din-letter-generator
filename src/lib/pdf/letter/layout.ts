import type { LetterType } from "@/lib/letter/schema";
import type { FontLayout, LayoutGeometry } from "./types";

/** Absolute page coordinates, the same for Form A and B. */
export const PAGE_GEOMETRY = {
  widthMm: 210,
  heightMm: 297,
  leftMarginMm: 25,
  rightColumnXMm: 125,
  leftColumnWidthMm: 80,
  rightColumnWidthMm: 75,
  contentWidthMm: 165,
  bottomMarginMm: 25,
  footerBaselineMm: 7,
  /** The envelope window. Address text starts 5 mm further right. */
  addressFieldXMm: 20,
  addressFieldWidthMm: 85,
} as const;

/** Vertical sizes from the bottom of the letterhead (27 mm Form A, 45 mm Form B). */
const BELOW_LETTERHEAD_MM = {
  /** Zusatz- und Vermerkzone: return line and postal notes. */
  returnZoneHeight: 17.7,
  /** Anschriftzone: recipient address. */
  addressZoneHeight: 27.3,
  infoTopOffset: 5,
  foldMarkOffsets: [60, 165],
} as const;

/** DIN 5008 distances between blocks whose position depends on content. */
export const FLOW_MM = {
  /** Two blank lines of 4.23 mm: before the subject and before the text. */
  blankLinesGap: 8.46,
  /** The information block, date included, is at least this tall. */
  infoBlockMinHeight: 40,
} as const;

const LETTERHEAD_HEIGHTS_MM: Record<LetterType, number> = {
  A: 27,
  B: 45,
};

export const createLayout = (letterType: LetterType): LayoutGeometry => {
  const letterheadHeightMm = LETTERHEAD_HEIGHTS_MM[letterType];

  return {
    letterheadHeightMm,
    sender: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: letterheadHeightMm,
      widthMm: PAGE_GEOMETRY.leftColumnWidthMm,
      heightMm: BELOW_LETTERHEAD_MM.returnZoneHeight,
    },
    recipient: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: letterheadHeightMm + BELOW_LETTERHEAD_MM.returnZoneHeight,
      widthMm: PAGE_GEOMETRY.leftColumnWidthMm,
      heightMm: BELOW_LETTERHEAD_MM.addressZoneHeight,
    },
    info: {
      xMm: PAGE_GEOMETRY.rightColumnXMm,
      yMm: letterheadHeightMm + BELOW_LETTERHEAD_MM.infoTopOffset,
      widthMm: PAGE_GEOMETRY.rightColumnWidthMm,
    },
    date: {
      xMm: PAGE_GEOMETRY.rightColumnXMm,
      widthMm: PAGE_GEOMETRY.rightColumnWidthMm,
    },
    subject: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      widthMm: PAGE_GEOMETRY.contentWidthMm,
    },
    content: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      widthMm: PAGE_GEOMETRY.contentWidthMm,
    },
    foldMarksMm: BELOW_LETTERHEAD_MM.foldMarkOffsets.map(
      (offsetMm) => letterheadHeightMm + offsetMm,
    ),
  };
};

export const LAYOUT_FONT = {
  sender: { size: 7, lineHeight: 7 }, // ×1
  recipient: { size: 10, lineHeight: 11 }, // ×1.1
  info: { size: 11, lineHeight: 12.65 }, // ×1.15
  date: { size: 11, lineHeight: 11 }, // ×1
  subject: { size: 11, lineHeight: 13.2 }, // ×1.2
  content: { size: 11, lineHeight: 16.5 }, // ×1.5
} satisfies FontLayout;

export const PAGE_NUMBER_FONT = { size: 8, lineHeight: 8 }; // ×1
