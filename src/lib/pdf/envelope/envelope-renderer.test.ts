import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";
import { PdfLayoutError } from "../shared/errors";
import { embedNotoSans } from "../shared/fonts";
import { mmToPt } from "../shared/geometry";
import { renderEnvelopePage } from "./envelope-renderer";
import { createEnvelopeLayout } from "./layout";

const layout = createEnvelopeLayout("DL");
const address = "Max Mustermann\nMusterstraße 12\n12345 Berlin";

let font: PDFFont;
let page: PDFPage;

beforeAll(async () => {
  const document = await PDFDocument.create();
  font = await embedNotoSans(document);
  page = document.addPage([mmToPt(layout.widthMm), mmToPt(layout.heightMm)]);
});

const render = (sender: string, recipient: string) =>
  renderEnvelopePage({ page, layout, font, sender, recipient });

describe("renderEnvelopePage", () => {
  it("rotates the page by 90 degrees", () => {
    render(address, address);

    expect(page.getRotation().angle).toBe(90);
  });

  it("rejects a sender address taller than the sender zone", () => {
    const sender = Array.from({ length: 5 }, () => "Absender").join("\n");

    expect(() => render(sender, address)).toThrow(
      "Sender address does not fit in the sender zone.",
    );
  });

  it("rejects characters the bundled font cannot encode", () => {
    expect(() => render(address, "株式会社\n東京都")).toThrow(
      "The recipient address contains characters unsupported",
    );
    expect(() => render(address, "株式会社\n東京都")).toThrow(PdfLayoutError);
  });
});
