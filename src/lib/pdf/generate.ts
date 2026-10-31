import { PDFDocument, PageSizes } from "pdf-lib";

import type { EnvelopeData } from "@/lib/letter/envelope-schema";
import type { LetterData } from "@/lib/letter/schema";
import { renderEnvelopePage } from "./envelope/envelope-renderer";
import { createEnvelopeLayout } from "./envelope/layout";
import { createLayout, LAYOUT_FONT } from "./letter/layout";
import {
  formatLetterDate,
  renderLetterPage,
  renderPageNumbers,
} from "./letter/letter-renderer";
import { paginateContent } from "./letter/pagination";
import { embedNotoSans } from "./shared/fonts";
import { mmToPt } from "./shared/geometry";

/**
 * Generate a PDF document with letter content
 * @param data - The letter data containing all required fields
 * @returns Uint8Array containing the PDF bytes
 * @throws Error if required fields are missing or invalid
 * @throws Error if text content exceeds layout constraints
 */
export async function generateLetterPDF(data: LetterData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Brief Form ${data.letterType} (DIN 5008)`);

  const font = await embedNotoSans(document);
  const fontBold = await embedNotoSans(document, "bold");

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
      page: document.addPage(PageSizes.A4),
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

  renderPageNumbers(document, font);

  return document.save();
}

/**
 * Generate a single-page envelope PDF with sender and recipient addresses
 * @param data - The envelope data (addresses and format)
 * @returns Uint8Array containing the PDF bytes
 * @throws PdfLayoutError if an address does not fit its zone or uses
 * characters the bundled font cannot encode
 */
export async function generateEnvelopePDF(
  data: EnvelopeData,
): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`Briefumschlag ${data.format} (DIN 5008)`);

  const font = await embedNotoSans(document);
  const layout = createEnvelopeLayout(data.format);

  renderEnvelopePage({
    page: document.addPage([mmToPt(layout.widthMm), mmToPt(layout.heightMm)]),
    layout,
    font,
    sender: data.sender,
    recipient: data.recipient,
  });

  return document.save();
}
