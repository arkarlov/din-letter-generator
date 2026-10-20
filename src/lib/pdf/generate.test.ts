import { describe, expect, it } from "vitest";
import { PDFDocument, PageSizes } from "pdf-lib";
import { generateLetterPDF } from "./generate";
import type { LetterData } from "../letter/schema";

const createLetter = (message: string): LetterData => ({
  letterType: "B",
  useReadyStamp: false,
  recipientAddress: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  returnAddress: "Max Mustermann\n12345 Berlin",
  infoBlock: "Max Mustermann\n12345 Berlin",
  date: "2026-10-07",
  subject: "Anfrage",
  message,
});

describe("generateLetterPDF", () => {
  it("generates a valid single-page A4 PDF", async () => {
    const bytes = await generateLetterPDF(createLetter("Guten Tag."));
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(document.getPageCount()).toBe(1);
    expect(page.getSize().width).toBe(PageSizes.A4[0]);
    expect(page.getSize().height).toBe(PageSizes.A4[1]);
  });

  it("creates additional pages when the message exceeds the first page", async () => {
    const message = Array.from(
      { length: 100 },
      (_, index) => `Briefzeile ${index + 1}`,
    ).join("\n");

    const bytes = await generateLetterPDF(createLetter(message));
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getPages()).toHaveLength(document.getPageCount());
  });
});
