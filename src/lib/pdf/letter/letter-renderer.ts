import {
  grayscale,
  rgb,
  type PDFDocument,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

import { renderTextBlock, renderTextLines } from "../shared/drawing";
import { mmToPt } from "../shared/geometry";
import { LAYOUT_FONT, PAGE_GEOMETRY, PAGE_NUMBER_FONT } from "./layout";
import type { Layout } from "./types";

export function formatLetterDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type RenderLetterPageProps = {
  page: PDFPage;
  layout: Layout;
  font: PDFFont;
  fontBold: PDFFont;
  content: string[];
  isFirstPage: boolean;
  returnAddress?: string;
  recipientAddress?: string;
  infoBlock: string;
  formattedDate: string;
  subject: string;
};

export function renderLetterPage({
  page,
  layout,
  font,
  fontBold,
  content,
  isFirstPage,
  returnAddress,
  recipientAddress,
  infoBlock,
  formattedDate,
  subject,
}: RenderLetterPageProps) {
  page.setFont(font);
  page.setFontSize(LAYOUT_FONT.content.size);
  page.setLineHeight(LAYOUT_FONT.content.lineHeight);
  page.setFontColor(rgb(0, 0, 0));

  if (isFirstPage) {
    renderFoldMarks(page, layout.foldMarksMm);
    renderLetterHeader({
      page,
      layout,
      font,
      fontBold,
      returnAddress,
      recipientAddress,
      infoBlock,
      formattedDate,
      subject,
    });
  }

  const contentLayout = isFirstPage
    ? layout.content
    : { ...layout.content, yMm: layout.letterheadHeightMm };

  renderTextLines(
    page,
    contentLayout,
    font,
    content,
    LAYOUT_FONT.content.size,
    LAYOUT_FONT.content.lineHeight,
  );
}

type RenderLetterHeaderProps = {
  page: PDFPage;
  layout: Layout;
  font: PDFFont;
  fontBold: PDFFont;
  returnAddress?: string;
  recipientAddress?: string;
  infoBlock: string;
  formattedDate: string;
  subject: string;
};

export function renderLetterHeader({
  page,
  layout,
  font,
  fontBold,
  returnAddress,
  recipientAddress,
  infoBlock,
  formattedDate,
  subject,
}: RenderLetterHeaderProps) {
  if (returnAddress) {
    renderTextBlock(
      returnAddress,
      page,
      layout.sender,
      font,
      LAYOUT_FONT.sender,
      "bottom-up",
    );
  }

  if (recipientAddress) {
    renderTextBlock(
      recipientAddress,
      page,
      layout.recipient,
      font,
      LAYOUT_FONT.recipient,
      "bottom-up",
    );
  }

  renderTextBlock(
    infoBlock,
    page,
    layout.info,
    font,
    LAYOUT_FONT.info,
    "bottom-up",
  );
  renderTextBlock(formattedDate, page, layout.date, font, LAYOUT_FONT.date);
  renderTextBlock(subject, page, layout.subject, fontBold, LAYOUT_FONT.subject);
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
    lineHeight,
  });
}

export function renderPageNumbers(pdfDoc: PDFDocument, font: PDFFont) {
  const totalPages = pdfDoc.getPageCount();

  pdfDoc.getPages().forEach((page, i) => {
    const text = `Seite ${i + 1} von ${totalPages}`;
    renderPageNumber(page, font, text);
  });
}
