import { beforeAll, describe, expect, it, vi } from "vitest";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { getTextBlockHeight, renderTextBlock } from "./drawing";
import { mmToPt } from "./geometry";

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
        { size: 10, lineHeight: 10 },
      ),
    ).toThrow("Text block exceeds allowed height");
  });

  it("keeps the glyphs of a bottom-up block inside the zone", () => {
    const page = document.addPage();
    const drawText = vi.spyOn(page, "drawText");
    const zone = { xMm: 25, yMm: 40, widthMm: 80, heightMm: 20 };
    const font10 = { size: 10, lineHeight: 11 };

    renderTextBlock("Erste\nLetzte", page, zone, font, font10, "bottom-up");

    const lastBaseline = drawText.mock.calls[1]?.[1]?.y ?? NaN;
    const descent =
      font.heightAtSize(10) - font.heightAtSize(10, { descender: false });
    const zoneBottom = page.getHeight() - mmToPt(zone.yMm + zone.heightMm);

    expect(lastBaseline - descent).toBeCloseTo(zoneBottom);
  });

  it("counts the full glyph height of the last line", () => {
    expect(getTextBlockHeight(font, 10, 11, 0)).toBe(0);
    expect(getTextBlockHeight(font, 10, 11, 3)).toBeCloseTo(
      2 * 11 + font.heightAtSize(10),
    );
  });
});
