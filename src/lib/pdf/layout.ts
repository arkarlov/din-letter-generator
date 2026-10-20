import type { LetterType } from "@/lib/letter/schema";
import type { FontLayout, Layout } from "./types";

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
} as const;

const BODY = {
  senderHeightMm: 17.7,
  recipientHeightMm: 27.3,
  infoTopOffsetMm: 5,
  infoHeightMm: 45,
  dateTopOffsetMm: 53,
  foldMarksOffsetsMm: [60, 165],
  // B previously used 106/125 mm for these anchors; keep the discrepancy
  // noted while the zero-header translation is investigated.
  subjectTopMm: 63,
  contentTopMm: 83,
} as const;

const LETTERHEAD_HEIGHTS_MM: Record<LetterType, number> = {
  A: 27,
  B: 45,
};

export const createLayout = (letterType: LetterType): Layout => {
  const letterheadHeightMm = LETTERHEAD_HEIGHTS_MM[letterType];

  return {
    letterheadHeightMm,
    sender: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: letterheadHeightMm,
      widthMm: PAGE_GEOMETRY.leftColumnWidthMm,
      heightMm: BODY.senderHeightMm,
    },
    recipient: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: letterheadHeightMm + BODY.senderHeightMm,
      widthMm: PAGE_GEOMETRY.leftColumnWidthMm,
      heightMm: BODY.recipientHeightMm,
    },
    info: {
      xMm: PAGE_GEOMETRY.rightColumnXMm,
      yMm: letterheadHeightMm + BODY.infoTopOffsetMm,
      widthMm: PAGE_GEOMETRY.rightColumnWidthMm,
      heightMm: BODY.infoHeightMm,
    },
    date: {
      xMm: PAGE_GEOMETRY.rightColumnXMm,
      yMm: letterheadHeightMm + BODY.dateTopOffsetMm,
      widthMm: PAGE_GEOMETRY.rightColumnWidthMm,
    },
    subject: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: BODY.subjectTopMm + letterheadHeightMm,
      widthMm: PAGE_GEOMETRY.contentWidthMm,
    },
    content: {
      xMm: PAGE_GEOMETRY.leftMarginMm,
      yMm: BODY.contentTopMm + letterheadHeightMm,
      widthMm: PAGE_GEOMETRY.contentWidthMm,
    },
    foldMarksMm: BODY.foldMarksOffsetsMm.map(
      (offsetMm) => letterheadHeightMm + offsetMm,
    ),
  };
};

export const LAYOUT_FONT = {
  sender: { size: 7, lineHeight: 1 },
  recipient: { size: 10, lineHeight: 1.1 },
  info: { size: 11, lineHeight: 1.15 },
  date: { size: 11, lineHeight: 1 },
  subject: { size: 11, lineHeight: 1.2 },
  content: { size: 11, lineHeight: 1.5 },
} satisfies FontLayout;

export const PAGE_NUMBER_FONT = { size: 8, lineHeight: 1 };
