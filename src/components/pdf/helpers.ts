import { rgb, type PDFDocument, type PDFPage, type PDFFont } from "pdf-lib";

import { LAYOUT_FONT } from "./config";
import type { Layout } from "./types";
import {
  renderFoldMarks,
  renderPageNumber,
  renderTextBlock,
  renderTextLines,
} from "./utils";

export function formatLetterDate(date: string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
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
  page.setLineHeight(LAYOUT_FONT.content.size * LAYOUT_FONT.content.lineHeight);
  page.setFontColor(rgb(0, 0, 0));

  renderFoldMarks(page, layout.foldMarksMm);

  if (isFirstPage) {
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
    LAYOUT_FONT.content.size * LAYOUT_FONT.content.lineHeight,
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

  renderTextBlock(infoBlock, page, layout.info, font, LAYOUT_FONT.info);
  renderTextBlock(formattedDate, page, layout.date, font, LAYOUT_FONT.date);
  renderTextBlock(subject, page, layout.subject, fontBold, LAYOUT_FONT.subject);
}

export function renderPageNumbers(pdfDoc: PDFDocument, font: PDFFont) {
  const totalPages = pdfDoc.getPageCount();

  pdfDoc.getPages().forEach((page, i) => {
    const text = `Seite ${i + 1} von ${totalPages}`;
    renderPageNumber(page, font, text);
  });
}
