import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import { createLayout } from "./layout";
import { paginateContent, paginateTextLines } from "./pagination";

let font: PDFFont;

beforeAll(async () => {
  const document = await PDFDocument.create();
  font = await document.embedFont(StandardFonts.Helvetica);
});

describe("paginateTextLines", () => {
  it("splits lines into pages of at most pageMaxLines", () => {
    const lines = ["1", "2", "3", "4", "5"];

    expect(paginateTextLines({ lines, pageMaxLines: 2 })).toEqual([
      ["1", "2"],
      ["3", "4"],
      ["5"],
    ]);
  });

  it("returns no pages for no lines", () => {
    expect(paginateTextLines({ lines: [], pageMaxLines: 2 })).toEqual([]);
  });

  it("rejects a page capacity that would prevent pagination from advancing", () => {
    expect(() =>
      paginateTextLines({ lines: ["content"], pageMaxLines: 0 }),
    ).toThrow("Page capacity must be a positive integer");
  });
});

describe("paginateContent", () => {
  it("wraps and paginates content using the first-page and continuation areas", () => {
    const lines = Array.from({ length: 100 }, () => "DIN Brieftext");
    const pages = paginateContent(
      lines.join("\n"),
      font,
      { size: 11, lineHeight: 16.5 },
      createLayout("A"),
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].length).toBeLessThan(pages[1].length);
    expect(pages.flat()).toEqual(lines);
  });

  it("returns one empty page for empty content", () => {
    expect(
      paginateContent(
        "",
        font,
        { size: 11, lineHeight: 16.5 },
        createLayout("A"),
      ),
    ).toEqual([[""]]);
  });

  it("rejects a first page without room for any line", () => {
    const layout = createLayout("A");

    expect(() =>
      paginateContent(
        "Text",
        font,
        { size: 11, lineHeight: 16.5 },
        { ...layout, content: { ...layout.content, yMm: 290 } },
      ),
    ).toThrow("Page capacity must be a positive integer");
  });
});
