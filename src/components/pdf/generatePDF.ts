import { PDFDocument, PageSizes, StandardFonts } from "pdf-lib";
import { paginateContent } from "./utils";
import { PdfData, pdfDataSchema } from "./types";
import { createLayout, LAYOUT_FONT } from "./config";
import {
  formatLetterDate,
  renderLetterPage,
  renderPageNumbers,
} from "./helpers";

/**
 * Generate a PDF document with letter content
 * @param data - The letter data containing all required fields
 * @returns Uint8Array containing the PDF bytes
 * @throws Error if required fields are missing or invalid
 * @throws Error if text content exceeds layout constraints
 */
export async function generatePDF(data: PdfData): Promise<Uint8Array> {
  // Validate input using the zod schema so types and cross-field rules are enforced
  const parsed = pdfDataSchema.parse(data);

  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const layout = createLayout("B");

    const {
      date,
      recipientAddress,
      infoBlock,
      subject,
      message,
      returnAddress,
    } = parsed;

    const contentPages = paginateContent(
      message,
      font,
      LAYOUT_FONT.content,
      layout,
    );

    const formattedDate = formatLetterDate(date);

    contentPages.forEach((content, i) => {
      const isFirstPage = i === 0;

      const page = pdfDoc.addPage(PageSizes.A4);
      renderLetterPage({
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
      });
    });

    renderPageNumbers(pdfDoc, font);

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
