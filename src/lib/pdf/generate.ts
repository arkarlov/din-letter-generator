import { PDFDocument, PageSizes, StandardFonts } from "pdf-lib";

import {
  formatLetterDate,
  renderLetterPage,
  renderPageNumbers,
} from "./letter-renderer";
import { createLayout, LAYOUT_FONT } from "./layout";
import { paginateContent } from "./text-layout";
import type { LetterData } from "../letter/schema";

/**
 * Generate a PDF document with letter content
 * @param data - The letter data containing all required fields
 * @returns Uint8Array containing the PDF bytes
 * @throws Error if required fields are missing or invalid
 * @throws Error if text content exceeds layout constraints
 */
export async function generateLetterPDF(data: LetterData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { recipientAddress, infoBlock, subject, returnAddress } = data;

  const layout = createLayout(data.letterType);
  const formattedDate = formatLetterDate(data.date);
  const contentPages = paginateContent(
    data.message,
    font,
    LAYOUT_FONT.content,
    layout,
  );

  contentPages.forEach((content, i) => {
    const isFirstPage = i === 0;

    renderLetterPage({
      page: pdfDoc.addPage(PageSizes.A4),
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
    });
  });

  renderPageNumbers(pdfDoc, font);

  return pdfDoc.save();
}
