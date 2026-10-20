import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { renderTextBlock } from "./drawing";

let document: PDFDocument;
let font: PDFFont;

beforeAll(async () => {
  document = await PDFDocument.create();
  font = await document.embedFont(StandardFonts.Helvetica);
});

describe("renderTextBlock", () => {
  it("throws when text exceeds the zone height", () => {
    const page = document.addPage();

    expect(() =>
      renderTextBlock(
        "This block is too tall",
        page,
        { xMm: 25, yMm: 40, widthMm: 80, heightMm: 1 },
        font,
        { size: 10, lineHeight: 1 },
      ),
    ).toThrow("Text block exceeds allowed height");
  });
});
