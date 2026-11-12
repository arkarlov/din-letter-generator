import { PDFDocument, PageSizes } from "pdf-lib";

import type { EnvelopeData } from "@/lib/letter/envelope-schema";
import { toAddressLines } from "@/lib/letter/address-lines";
import type { LetterData } from "@/lib/letter/schema";
import { renderEnvelopePage } from "./envelope/envelope-renderer";
import { createEnvelopeLayout } from "./envelope/layout";
import { prepareAddressField } from "./letter/address-field";
import { renderLayoutGuides } from "./letter/debug-guides";
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

  const { subject } = data;
  const infoBlock =
    data.customInfoBlock ?? toAddressLines(data.sender).join("\n");
  // A ready stamp already carries both addresses, so the window stays empty.
  const addressField = data.useReadyStamp
    ? undefined
    : prepareAddressField(data, font);

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
    const page = document.addPage(PageSizes.A4);

    if (data.showGuides) {
      renderLayoutGuides({ page, layout, font, isFirstPage });
    }

    renderLetterPage({
      page,
      layout,
      font,
      fontBold,
      content,
      isFirstPage,
      addressField,
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
    sender: toAddressLines(data.sender).join("\n"),
    recipient: toAddressLines(data.recipient).join("\n"),
  });

  return document.save();
}
