import { PDFDocument, PageSizes, StandardFonts, rgb } from "pdf-lib";
import {
  renderPageNumber,
  renderFoldMarks,
  renderTextBlock,
  renderTextLines,
  paginateContent,
} from "./utils";
import { PdfData } from "./types";
import { LAYOUT_FONT, LAYOUTS } from "./config";

/**
 * Generate a PDF document with letter content
 * @param data - The letter data containing all required fields
 * @returns Uint8Array containing the PDF bytes
 * @throws Error if required fields are missing or invalid
 * @throws Error if text content exceeds layout constraints
 * @example
 * const pdfBytes = await generatePDF({
 *   date: new Date(),
 *   recipientAddress: '123 Main St',
 *   senderAddress: '456 Oak Ave',
 *   subject: 'Invoice',
 *   message: 'Dear Customer...',
 *   returnInfo: 'Return to Sender'
 * });
 */
export async function generatePDF(data: PdfData): Promise<Uint8Array> {
  // Validate required fields
  const requiredFields: (keyof PdfData)[] = [
    "date",
    "recipientAddress",
    "senderAddress",
    "subject",
    "message",
    "returnInfo",
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const layout = LAYOUTS["A"];

    const {
      date,
      recipientAddress,
      senderAddress,
      subject,
      message,
      returnInfo,
    } = data;

    const contentPages = paginateContent(
      message,
      font,
      LAYOUT_FONT.content,
      layout,
    );

    const formattedDate = (
      date ? new Date(date) : new Date()
    ).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    contentPages.forEach((content, i) => {
      const isFirstPage = i === 0;

      const page = pdfDoc.addPage(PageSizes.A4);
      page.setFont(font);
      page.setFontSize(LAYOUT_FONT.content.size);
      page.setLineHeight(
        LAYOUT_FONT.content.size * LAYOUT_FONT.content.lineHeight,
      );
      page.setFontColor(rgb(0, 0, 0));

      // debug
      // renderGrid(page, layout);

      renderFoldMarks(page, layout.foldMarks);

      if (isFirstPage) {
        if (returnInfo) {
          renderTextBlock(
            returnInfo,
            page,
            layout.returnInfo,
            font,
            LAYOUT_FONT.returnInfo,
            "bottom-up",
          );
        }
        if (recipientAddress) {
          renderTextBlock(
            recipientAddress,
            page,
            layout.address,
            font,
            LAYOUT_FONT.address,
            "bottom-up",
          );
        }
        renderTextBlock(
          senderAddress,
          page,
          layout.info,
          font,
          LAYOUT_FONT.info,
        );
        renderTextBlock(
          formattedDate,
          page,
          layout.date,
          font,
          LAYOUT_FONT.date,
        );
        renderTextBlock(
          subject,
          page,
          layout.subject,
          fontBold,
          LAYOUT_FONT.subject,
        );
      }

      renderTextLines(
        page,
        isFirstPage
          ? layout.content
          : { ...layout.content, y: layout.letterheadHeight },
        font,
        content,
        LAYOUT_FONT.content.size,
        LAYOUT_FONT.content.size * LAYOUT_FONT.content.lineHeight,
      );
    });

    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((page, i) => {
      const text = `Seite ${i + 1} von ${totalPages}`;
      // const text = `Page ${i + 1} of ${totalPages}`;
      renderPageNumber(page, font, text);
    });

    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
