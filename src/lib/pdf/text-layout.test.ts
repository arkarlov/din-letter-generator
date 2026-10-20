import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { createLayout } from "./layout";
import { mmToPt, ptToMM } from "./geometry";
import { paginateContent, paginateTextLines, wrapText } from "./text-layout";

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

describe("paginateTextLines", () => {
  it("fills the first and following pages to their capacities", () => {
    const lines = ["1", "2", "3", "4", "5"];

    expect(
      paginateTextLines({
        lines,
        firstPageMaxLines: 2,
        nextPageMaxLines: 2,
      }),
    ).toEqual([["1", "2"], ["3", "4"], ["5"]]);
  });

  it("rejects a page capacity that would prevent pagination from advancing", () => {
    expect(() =>
      paginateTextLines({
        lines: ["content"],
        firstPageMaxLines: 1,
        nextPageMaxLines: 0,
      }),
    ).toThrow("Page capacities must be positive integers");
  });
});

describe("paginateContent", () => {
  it("wraps and paginates content using the first-page and continuation areas", () => {
    const lines = Array.from({ length: 100 }, () => "DIN Brieftext");
    const pages = paginateContent(
      lines.join("\n"),
      font,
      { size: 11, lineHeight: 1.5 },
      createLayout("A"),
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].length).toBeLessThan(pages[1].length);
    expect(pages.flat()).toEqual(lines);
  });
});
