import type { FontLayout, Layout, LetterType, MmBlockZone } from "./types";

const PAGE = {
  leftMarginMm: 25,
  rightColumnXMm: 125,
  leftColumnWidthMm: 80,
  rightColumnWidthMm: 75,
  contentWidthMm: 165,
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

const zone = ({
  xMm,
  yMm,
  widthMm,
  heightMm,
}: MmBlockZone): MmBlockZone => ({
  xMm,
  yMm,
  widthMm,
  ...(heightMm === undefined ? {} : { heightMm }),
});

const createLayoutForHeader = (letterheadHeightMm: number): Layout => {
  return {
    letterheadHeightMm,
    sender: zone({
      xMm: PAGE.leftMarginMm,
      yMm: letterheadHeightMm,
      widthMm: PAGE.leftColumnWidthMm,
      heightMm: BODY.senderHeightMm,
    }),
    recipient: zone({
      xMm: PAGE.leftMarginMm,
      yMm: letterheadHeightMm + BODY.senderHeightMm,
      widthMm: PAGE.leftColumnWidthMm,
      heightMm: BODY.recipientHeightMm,
    }),
    info: zone({
      xMm: PAGE.rightColumnXMm,
      yMm: letterheadHeightMm + BODY.infoTopOffsetMm,
      widthMm: PAGE.rightColumnWidthMm,
      heightMm: BODY.infoHeightMm,
    }),
    date: zone({
      xMm: PAGE.rightColumnXMm,
      yMm: letterheadHeightMm + BODY.dateTopOffsetMm,
      widthMm: PAGE.rightColumnWidthMm,
    }),
    subject: zone({
      xMm: PAGE.leftMarginMm,
      yMm: BODY.subjectTopMm + letterheadHeightMm,
      widthMm: PAGE.contentWidthMm,
    }),
    content: zone({
      xMm: PAGE.leftMarginMm,
      yMm: BODY.contentTopMm + letterheadHeightMm,
      widthMm: PAGE.contentWidthMm,
    }),
    foldMarksMm: BODY.foldMarksOffsetsMm.map(
      (offsetMm) => letterheadHeightMm + offsetMm,
    ),
  };
};

export const createLayout = (letterType: LetterType): Layout => {
  switch (letterType) {
    case "A":
      return createLayoutForHeader(27);
    case "B":
      return createLayoutForHeader(45);
  }
};

export const LAYOUT_FONT = {
  sender: { size: 7, lineHeight: 1 },
  recipient: { size: 10, lineHeight: 1.1 },
  info: { size: 11, lineHeight: 1.15 },
  date: { size: 11, lineHeight: 1 },
  subject: { size: 11, lineHeight: 1.2 },
  content: { size: 11, lineHeight: 1.5 },
} satisfies FontLayout;
