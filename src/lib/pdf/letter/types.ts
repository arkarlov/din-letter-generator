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

/** A zone whose vertical position depends on the content above it. */
type FlowingZone = Omit<MmBlockZone, "yMm" | "heightMm">;

/**
 * Fixed zones of a letter form. The date, subject, and text follow the
 * information block, so `layoutFirstPage` places them once the content is
 * measured.
 */
export type LayoutGeometry = Omit<Layout, "date" | "subject" | "content"> & {
  date: FlowingZone;
  subject: FlowingZone;
  content: FlowingZone;
};
