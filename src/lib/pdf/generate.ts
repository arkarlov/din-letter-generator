import { PDFDocument, PageSizes } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";

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
  const document = await PDFDocument.create();

  document.registerFontkit(fontkit);
  const fontBytes = await readFile(
    join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"),
  );
  const fontBoldBytes = await readFile(
    join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"),
  );
  const font = await document.embedFont(fontBytes, { subset: true });
  const fontBold = await document.embedFont(fontBoldBytes, { subset: true });

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
