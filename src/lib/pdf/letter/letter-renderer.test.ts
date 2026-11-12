import { describe, expect, it, vi } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { mmToPt } from "../shared/geometry";
import { createLayout, LAYOUT_FONT } from "./layout";
import { formatLetterDate, renderLetterHeader } from "./letter-renderer";

describe("formatLetterDate", () => {
  it("formats an ISO calendar date without a timezone shift", () => {
    expect(formatLetterDate("2026-10-20")).toBe("20. Oktober 2026");
  });
});

describe("renderLetterHeader", () => {
  it("puts the return line and recipient at their zone tops and the note at the bottom", async () => {
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);
    const page = document.addPage();
    const drawText = vi.spyOn(page, "drawText");
    const layout = createLayout("B");

    renderLetterHeader({
      page,
      layout,
      font,
      fontBold: font,
      addressField: {
        returnLine: "Return",
        note: "Note",
        recipientLines: ["First", "Last"],
      },
      infoBlock: "Info",
      formattedDate: "1. Januar 2026",
      subject: "Subject",
    });

    const baselineOf = (text: string) =>
      drawText.mock.calls.find(([drawn]) => drawn === text)?.[1]?.y;
    const ascentOf = (size: number) =>
      font.heightAtSize(size, { descender: false });
    const descentOf = (size: number) =>
      font.heightAtSize(size) - ascentOf(size);
    // Baseline whose ascender touches the zone top.
    const hangingFrom = (yMm: number, size: number) =>
      page.getHeight() - mmToPt(yMm) - ascentOf(size);
    // Baseline whose descender touches the zone bottom.
    const standingOn = (yMm: number, size: number) =>
      page.getHeight() - mmToPt(yMm) + descentOf(size);
    const bottomOf = ({
      yMm,
      heightMm = 0,
    }: {
      yMm: number;
      heightMm?: number;
    }) => yMm + heightMm;
    const { sender: small, recipient: large } = LAYOUT_FONT;

    expect(baselineOf("Return")).toBeCloseTo(
      hangingFrom(layout.sender.yMm, small.size),
    );
    expect(baselineOf("Note")).toBeCloseTo(
      standingOn(bottomOf(layout.sender), small.size),
    );
    expect(baselineOf("First")).toBeCloseTo(
      hangingFrom(layout.recipient.yMm, large.size),
    );
    expect(baselineOf("Last")).toBeCloseTo(
      hangingFrom(layout.recipient.yMm, large.size) - large.lineHeight,
    );
  });
});
