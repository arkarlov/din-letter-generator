import type { PDFPage, PDFFont, PDFPageDrawTextOptions } from "pdf-lib";
import type { FontOptions, MmBlockZone, VerticalDirection } from "./types";
import { PdfLayoutError } from "./errors";
import { mmToPt, ptToMM } from "./geometry";
import { wrapText } from "./text-layout";

const drawPageText = (
  page: PDFPage,
  text: string,
  options: PDFPageDrawTextOptions &
    Required<Pick<PDFPageDrawTextOptions, "font" | "size" | "x" | "y">>,
) => {
  const { height } = page.getSize();
  const ascent = options.font.heightAtSize(options.size);

  page.drawText(text, {
    ...options,
    y: height - options.y - ascent,
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
  const totalHeightMm = lines.length * ptToMM(lineHeight);

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
