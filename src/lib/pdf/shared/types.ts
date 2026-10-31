export type MmBlockZone = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm?: number;
};

/** Both values are in pt. */
export type FontOptions = { size: number; lineHeight: number };

export type VerticalDirection = "top-down" | "bottom-up";
