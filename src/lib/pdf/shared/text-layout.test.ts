import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { mmToPt, ptToMM } from "./geometry";
import { fitFontSize, wrapText } from "./text-layout";

let font: PDFFont;

beforeAll(async () => {
  const document = await PDFDocument.create();
  font = await document.embedFont(StandardFonts.Helvetica);
});

describe("wrapText", () => {
  it("wraps words to fit the available width", () => {
    const fontSize = 11;
    const maxWidthMm = ptToMM(font.widthOfTextAtSize("Hallo", fontSize));

    expect(wrapText("Hallo Welt", font, fontSize, maxWidthMm)).toEqual([
      "Hallo",
      "Welt",
    ]);
  });

  it("breaks an unspaced token that is wider than the text column", () => {
    const word = "SehrlangeEinzelneZeile";
    const maxWidthMm = 20;
    const lines = wrapText(word, font, 11, maxWidthMm);

    expect(lines.join("")).toBe(word);
    expect(
      lines.every(
        (line) => font.widthOfTextAtSize(line, 11) <= mmToPt(maxWidthMm),
      ),
    ).toBe(true);
  });

  it("preserves paragraph breaks and blank lines", () => {
    expect(wrapText("Erste Zeile\n\nZweite Zeile", font, 11, 165)).toEqual([
      "Erste Zeile",
      "",
      "Zweite Zeile",
    ]);
  });
});

describe("fitFontSize", () => {
  const lines = ["Musterstraße 12, 12345 Musterstadt"];

  it("keeps the requested size when the lines already fit", () => {
    expect(fitFontSize(font, lines, 12, 7, 200)).toBe(12);
  });

  it("shrinks the size until the widest line fits", () => {
    const requestedWidthMm = ptToMM(font.widthOfTextAtSize(lines[0], 12));
    const size = fitFontSize(font, lines, 12, 7, requestedWidthMm - 5);

    expect(size).toBeLessThan(12);
    expect(font.widthOfTextAtSize(lines[0], size)).toBeLessThanOrEqual(
      mmToPt(requestedWidthMm - 5),
    );
  });

  it("never goes below the minimum size", () => {
    expect(fitFontSize(font, lines, 12, 7, 1)).toBe(7);
  });
});
