import {
  grayscale,
  type PDFPage,
  type PDFFont,
  type PDFPageDrawTextOptions,
} from "pdf-lib";
import type {
  FontOptions,
  Layout,
  MmBlockZone,
  VerticalDirection,
} from "./types";
import { mmToPt, ptToMM } from "./geometry";
import { wrapText } from "./text-layout";
import { PAGE_GEOMETRY, PAGE_NUMBER_FONT } from "./layout";

export class PdfLayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfLayoutError";
  }
}

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
  lineHeightPt: number,
) {
  lines.forEach((line, index) => {
    drawPageText(page, line, {
      x: mmToPt(layout.xMm),
      y: mmToPt(layout.yMm) + index * lineHeightPt,
      maxWidth: mmToPt(layout.widthMm),
      font,
      size: fontSize,
    });
  });
}

export function renderFoldMarks(
  page: PDFPage,
  foldMarksMm: Layout["foldMarksMm"],
) {
  const { height } = page.getSize();
  const color = grayscale(0.7);
  const hole = height / 2;

  foldMarksMm.forEach((mm) => {
    const y = height - mmToPt(mm);
    page.drawLine({
      start: { x: mmToPt(5), y },
      end: { x: mmToPt(10), y },
      thickness: 1,
      color,
    });
  });

  page.drawLine({
    start: { x: mmToPt(5), y: hole },
    end: { x: mmToPt(12), y: hole },
    thickness: 1,
    color,
  });
}

export function renderPageNumber(page: PDFPage, font: PDFFont, text: string) {
  const { size, lineHeight } = PAGE_NUMBER_FONT;
  const textWidth = font.widthOfTextAtSize(text, size);
  const ascent = font.heightAtSize(size);
  const rightEdgeMm = PAGE_GEOMETRY.leftMarginMm + PAGE_GEOMETRY.contentWidthMm;

  page.drawText(text, {
    x: mmToPt(rightEdgeMm) - textWidth,
    y: mmToPt(PAGE_GEOMETRY.footerBaselineMm) + ascent / 2,
    font,
    size,
    lineHeight: size * lineHeight,
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
  const lineHeightPt = size * lineHeight;
  const totalHeightMm = lines.length * ptToMM(lineHeightPt);

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
    lineHeightPt,
  );
}
