import type { FontOptions, MmBlockZone } from "../shared/types";

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
