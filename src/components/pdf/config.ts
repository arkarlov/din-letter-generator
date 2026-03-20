import type { FontLayout, Layout, LetterType } from "./types";

export const LAYOUTS: Record<LetterType, Layout> = {
  A: {
    letterheadHeight: 27,
    returnInfo: {
      x: 25,
      y: 27,
      width: 80,
      height: 17.7,
    },
    address: {
      x: 25,
      y: 44.7,
      width: 80,
      height: 27.3,
    },
    info: {
      x: 125,
      y: 32,
      width: 75,
      height: 45,
    },
    date: {
      x: 125,
      y: 80,
      width: 75,
    },
    subject: {
      x: 25,
      y: 90,
      width: 165,
    },
    content: {
      x: 25,
      y: 110,
      width: 165,
    },
    foldMarks: [87, 192],
  },
  B: {
    letterheadHeight: 45,
    returnInfo: {
      x: 25,
      y: 45,
      width: 80,
      height: 17.7,
    },
    address: {
      x: 25,
      y: 62.7,
      width: 80,
      height: 27.3,
    },
    info: {
      x: 125,
      y: 50,
      width: 75,
      height: 45,
    },
    date: {
      x: 125,
      y: 98,
      width: 75,
    },
    subject: {
      x: 25,
      y: 106,
      width: 165,
    },
    content: {
      x: 25,
      y: 125,
      width: 165,
    },
    foldMarks: [105, 210],
  },
};

export const LAYOUT_FONT: FontLayout = {
  returnInfo: { size: 8, lineHeight: 1 },
  address: { size: 10, lineHeight: 1.1 },
  info: { size: 11, lineHeight: 1.15 },
  date: { size: 11, lineHeight: 1 },
  subject: { size: 12, lineHeight: 1 },
  content: { size: 12, lineHeight: 1.5 },
};
