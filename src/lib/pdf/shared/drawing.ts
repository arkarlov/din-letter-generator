import type { PDFPage, PDFFont, PDFPageDrawTextOptions } from "pdf-lib";
import type { FontOptions, MmBlockZone, VerticalDirection } from "./types";
import { PdfLayoutError } from "./errors";
import { mmToPt, ptToMM } from "./geometry";
import { wrapText } from "./text-layout";

/** Distance from the top of a line to its baseline: the font's ascender. */
const getAscent = (font: PDFFont, size: number) =>
  font.heightAtSize(size, { descender: false });

/**
 * Height of the glyphs of a text block in pt, from the ascender of the first
 * line to the descender of the last one. A line height smaller than the font
 * would otherwise let the last line hang below its zone.
 */
export const getTextBlockHeight = (
  font: PDFFont,
  size: number,
  lineHeight: number,
  lineCount: number,
) =>
  lineCount > 0 ? (lineCount - 1) * lineHeight + font.heightAtSize(size) : 0;

/** Draw text whose glyph box starts at `y` (mm from the page top, in pt). */
const drawPageText = (
  page: PDFPage,
  text: string,
  options: PDFPageDrawTextOptions &
    Required<Pick<PDFPageDrawTextOptions, "font" | "size" | "x" | "y">>,
) => {
  const { height } = page.getSize();

  page.drawText(text, {
    ...options,
    y: height - options.y - getAscent(options.font, options.size),
  });
};

export function renderTextLines(
  page: PDFPage,
  layout: MmBlockZone,
  font: PDFFont,
  lines: string[],
  fontSize: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    drawPageText(page, line, {
      x: mmToPt(layout.xMm),
      y: mmToPt(layout.yMm) + index * lineHeight,
      maxWidth: mmToPt(layout.widthMm),
      font,
      size: fontSize,
    });
  });
}

export function renderTextBlock(
  text: string,
  page: PDFPage,
  layout: MmBlockZone,
  font: PDFFont,
  fontOptions: FontOptions,
  direction: VerticalDirection = "top-down",
) {
  const { size, lineHeight } = fontOptions;
  const lines = wrapText(text, font, size, layout.widthMm);
  const totalHeightMm = ptToMM(
    getTextBlockHeight(font, size, lineHeight, lines.length),
  );

  if (layout.heightMm && totalHeightMm > layout.heightMm) {
    throw new PdfLayoutError("Text block exceeds allowed height");
  }

  let startYmm = layout.yMm;

  if (layout.heightMm && direction === "bottom-up") {
    startYmm = layout.yMm + (layout.heightMm - totalHeightMm);
  }

  renderTextLines(
    page,
    { ...layout, yMm: startYmm },
    font,
    lines,
    size,
    lineHeight,
  );
}
