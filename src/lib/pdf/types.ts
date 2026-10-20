export type MmBlockZone = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm?: number;
};

export type FontOptions = { size: number; lineHeight: number };

export type TextLayout = {
  sender: MmBlockZone;
  recipient: MmBlockZone;
  info: MmBlockZone;
  date: MmBlockZone;
  subject: MmBlockZone;
  content: MmBlockZone;
};
export type FontLayout = {
  [K in keyof TextLayout]: FontOptions;
};
export type Layout = TextLayout & {
  letterheadHeightMm: number;
  foldMarksMm: readonly number[];
};

export type VerticalDirection = "top-down" | "bottom-up";
