import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, type PDFFont } from "pdf-lib";
import { PdfLayoutError } from "./errors";
import { assertEncodable, embedNotoSans } from "./fonts";

let font: PDFFont;

beforeAll(async () => {
  font = await embedNotoSans(await PDFDocument.create());
});

describe("assertEncodable", () => {
  it("accepts Latin and Cyrillic text", () => {
    expect(() =>
      assertEncodable(font, ["Musterstraße 1", "Иван Иванов"], "address"),
    ).not.toThrow();
  });

  it("rejects characters missing from the font and names the label", () => {
    expect(() => assertEncodable(font, ["東京都"], "sender address")).toThrow(
      new PdfLayoutError(
        "The sender address contains characters unsupported by the bundled Noto Sans font.",
      ),
    );
  });
});
