import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument, PDFPage, PageSizes } from "pdf-lib";
import type { EnvelopeData } from "@/lib/envelope/schema";
import type { LetterData } from "@/lib/letter/schema";
import { generateEnvelopePDF, generateLetterPDF } from "./generate";
import { PdfLayoutError } from "./shared/errors";
import { mmToPt } from "./shared/geometry";

const sender: LetterData["sender"] = {
  kind: "house",
  name: "Max Mustermann",
  street: "Musterstraße",
  number: "12",
  zip: "12345",
  city: "Berlin",
};

const recipient: NonNullable<LetterData["recipient"]> = {
  kind: "house",
  name: "Musterfirma GmbH",
  street: "Musterstraße",
  number: "1",
  zip: "12345",
  city: "Musterstadt",
};

const createLetter = (message: string): LetterData => ({
  letterType: "B",
  useReadyStamp: false,
  showGuides: false,
  sender,
  recipient,
  date: "2026-10-07",
  subject: "Anfrage",
  message,
});

const collectDrawnText = async (letter: LetterData) => {
  const drawText = vi.spyOn(PDFPage.prototype, "drawText");

  await generateLetterPDF(letter);

  return drawText.mock.calls.map(([text]) => text);
};

describe("generateLetterPDF", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates a valid single-page A4 PDF", async () => {
    const bytes = await generateLetterPDF(createLetter("Guten Tag."));
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(document.getPageCount()).toBe(1);
    expect(page.getSize().width).toBe(PageSizes.A4[0]);
    expect(page.getSize().height).toBe(PageSizes.A4[1]);
  });

  it("describes the letter in the document metadata", async () => {
    const bytes = await generateLetterPDF(createLetter("Guten Tag."));
    const document = await PDFDocument.load(bytes);

    expect(document.getTitle()).toBe(
      "Letter to Musterfirma GmbH dated 7 October 2026: Anfrage",
    );
    expect(document.getAuthor()).toBe("Max Mustermann");
    expect(document.getSubject()).toBe("Anfrage");
    expect(document.getCreator()).toBe("DIN 5008 Letter Generator");
    // Viewers show the title instead of the file name.
    expect(document.catalog.getViewerPreferences()?.getDisplayDocTitle()).toBe(
      true,
    );
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

  it("builds the return line and info block from the sender", async () => {
    const text = await collectDrawnText(createLetter("Guten Tag."));

    expect(text).toContain("Max Mustermann, Musterstraße 12, 12345 Berlin");
    expect(text).toEqual(
      expect.arrayContaining([
        "Max Mustermann",
        "Musterstraße 12",
        "12345 Berlin",
      ]),
    );
  });

  it("prefers the manual return line", async () => {
    const text = await collectDrawnText({
      ...createLetter("Guten Tag."),
      returnLineOverride: "M. Mustermann, 12345 Berlin",
    });

    expect(text).toContain("M. Mustermann, 12345 Berlin");
    expect(text).not.toContain("Max Mustermann, Musterstraße 12, 12345 Berlin");
  });

  it("replaces the sender address with a custom info block", async () => {
    const text = await collectDrawnText({
      ...createLetter("Guten Tag."),
      customInfoBlock: "Unser Zeichen: mm\nTelefon: 0341 1234567",
    });

    expect(text).toContain("Unser Zeichen: mm");
    expect(text).not.toContain("Musterstraße 12");
  });

  it("draws layout guides only on request", async () => {
    const drawRectangle = vi.spyOn(PDFPage.prototype, "drawRectangle");

    await generateLetterPDF(createLetter("Guten Tag."));
    expect(drawRectangle).not.toHaveBeenCalled();

    const text = await collectDrawnText({
      ...createLetter("Guten Tag."),
      showGuides: true,
    });

    expect(drawRectangle).toHaveBeenCalled();
    expect(text).toEqual(
      expect.arrayContaining(["Anschriftzone", "Informationsblock"]),
    );
  });

  it("leaves the address field empty for a ready stamp", async () => {
    const text = await collectDrawnText({
      ...createLetter("Guten Tag."),
      useReadyStamp: true,
      note: "Einschreiben",
    });

    expect(text).not.toContain("Max Mustermann, Musterstraße 12, 12345 Berlin");
    expect(text).not.toContain("Einschreiben");
    expect(text).not.toContain("Musterfirma GmbH");
  });
});

const validEnvelope: EnvelopeData = { sender, recipient, format: "DL" };

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
    const text = Array.from({ length: 10 }, () => "Musterfirma").join("\n");

    await expect(
      generateEnvelopePDF({
        ...validEnvelope,
        recipient: { kind: "free", text },
      }),
    ).rejects.toBeInstanceOf(PdfLayoutError);
  });

  it("embeds a recipient address duplicated in Latin and Cyrillic", async () => {
    const bytes = await generateEnvelopePDF({
      ...validEnvelope,
      recipient: {
        kind: "free",
        text: "Ivan Ivanov\nLeningradskiy Prospekt 39, Bldg. 1, Apt. 14\n125167 MOSCOW\nИван Иванов\n125167, г. Москва, Ленинградский пр-кт, д. 39, корп. 1, кв. 14\nRUSSIA",
      },
    });
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBe(1);
  });
});
