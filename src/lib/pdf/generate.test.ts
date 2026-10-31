import { describe, expect, it } from "vitest";
import { PDFDocument, PageSizes } from "pdf-lib";
import type { EnvelopeData } from "@/lib/letter/envelope-schema";
import type { LetterData } from "@/lib/letter/schema";
import { generateEnvelopePDF, generateLetterPDF } from "./generate";
import { PdfLayoutError } from "./shared/errors";
import { mmToPt } from "./shared/geometry";

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

  it("sets the document title from the letter form", async () => {
    const bytes = await generateLetterPDF(createLetter("Guten Tag."));
    const document = await PDFDocument.load(bytes);

    expect(document.getTitle()).toBe("Brief Form B (DIN 5008)");
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

const validEnvelope: EnvelopeData = {
  sender: "Max Mustermann\nMusterstraße 12\n12345 Berlin",
  recipient: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  format: "DL",
};

describe("generateEnvelopePDF", () => {
  it("generates a single DL-sized page rotated by 90 degrees", async () => {
    const bytes = await generateEnvelopePDF(validEnvelope);
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(document.getPageCount()).toBe(1);
    expect(page.getWidth()).toBe(mmToPt(220));
    expect(page.getHeight()).toBe(mmToPt(110));
    expect(page.getRotation().angle).toBe(90);
  });

  it("generates a C6-sized page rotated by 90 degrees", async () => {
    const bytes = await generateEnvelopePDF({ ...validEnvelope, format: "C6" });
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(page.getWidth()).toBe(mmToPt(162));
    expect(page.getHeight()).toBe(mmToPt(114));
    expect(page.getRotation().angle).toBe(90);
  });

  it("rejects recipient addresses that enter the upper franking zone", async () => {
    const recipient = Array.from({ length: 10 }, () => "Musterfirma").join(
      "\n",
    );

    await expect(
      generateEnvelopePDF({ ...validEnvelope, recipient }),
    ).rejects.toBeInstanceOf(PdfLayoutError);
  });

  it("embeds a recipient address duplicated in Latin and Cyrillic", async () => {
    const bytes = await generateEnvelopePDF({
      ...validEnvelope,
      recipient:
        "Ivan Ivanov\nLeningradskiy Prospekt 39, Bldg. 1, Apt. 14\n125167 MOSCOW\nИван Иванов\n125167, г. Москва, Ленинградский пр-кт, д. 39, корп. 1, кв. 14\nRUSSIA",
    });
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBe(1);
  });
});
