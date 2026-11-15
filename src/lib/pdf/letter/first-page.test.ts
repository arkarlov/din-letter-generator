import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, type PDFFont } from "pdf-lib";
import { getTextBlockHeight } from "../shared/drawing";
import { PdfLayoutError } from "../shared/errors";
import { embedNotoSans } from "../shared/fonts";
import { ptToMM } from "../shared/geometry";
import { wrapText } from "../shared/text-layout";
import { layoutFirstPage } from "./first-page";
import { createLayout, FLOW_MM, LAYOUT_FONT } from "./layout";

let font: PDFFont;
let fontBold: PDFFont;

beforeAll(async () => {
  const document = await PDFDocument.create();
  font = await embedNotoSans(document);
  fontBold = await embedNotoSans(document, "bold");
});

const lines = (count: number) =>
  Array.from({ length: count }, (_, index) => `Zeile ${index + 1}`).join("\n");

const layout = (
  letterType: "A" | "B",
  infoBlock = lines(3),
  subject = "Ihre Anfrage",
) =>
  layoutFirstPage({
    geometry: createLayout(letterType),
    font,
    fontBold,
    infoBlock,
    subject,
  });

const glyphHeightMm = (zone: keyof typeof LAYOUT_FONT, lineCount: number) => {
  const { size, lineHeight } = LAYOUT_FONT[zone];
  const zoneFont = zone === "subject" ? fontBold : font;
  return ptToMM(getTextBlockHeight(zoneFont, size, lineHeight, lineCount));
};

describe("layoutFirstPage", () => {
  it.each([
    ["A", 80.46],
    ["B", 98.46],
  ] as const)(
    "puts the subject of Form %s two blank lines below a short info block",
    (letterType, subjectYMm) => {
      expect(layout(letterType).subject.yMm).toBeCloseTo(subjectYMm);
    },
  );

  it("places the date one blank line below a long info block", () => {
    // A grown block has no spare space, so its text starts at the zone top.
    const { info, date } = layout("B", lines(9));

    expect(date.yMm).toBeCloseTo(
      info.yMm + ptToMM(10 * LAYOUT_FONT.info.lineHeight),
    );
  });

  const frameBottomOf = ({ date }: ReturnType<typeof layout>) =>
    date.yMm + glyphHeightMm("date", 1);

  it("fills a short info block up to the minimum height above the date", () => {
    const geometry = createLayout("B");
    const result = layout("B", lines(3));
    const { info, date } = result;

    expect(info.yMm).toBe(geometry.info.yMm);
    expect(frameBottomOf(result)).toBeCloseTo(
      geometry.info.yMm + FLOW_MM.infoBlockMinHeight,
    );
    // The zone ends where bottom-up text must end: one blank line above the date.
    expect(info.yMm + (info.heightMm ?? 0)).toBeCloseTo(
      date.yMm -
        ptToMM(2 * LAYOUT_FONT.info.lineHeight) +
        glyphHeightMm("info", 1),
    );
  });

  it("grows a long info block downwards and moves the subject with it", () => {
    const geometry = createLayout("B");
    const result = layout("B", lines(9));
    const { info, subject } = result;

    expect(info.yMm).toBe(geometry.info.yMm);
    expect(info.heightMm).toBe(glyphHeightMm("info", 9));
    expect(frameBottomOf(result)).toBeGreaterThan(
      geometry.info.yMm + FLOW_MM.infoBlockMinHeight,
    );
    expect(subject.yMm).toBeCloseTo(
      frameBottomOf(result) + FLOW_MM.blankLinesGap,
    );
  });

  it("starts the text two blank lines below the last subject line", () => {
    const subject = "Ihre Anfrage nach Büromöbeln ".repeat(6).trim();
    const { subject: subjectZone, content } = layout("B", lines(3), subject);
    const subjectLineCount = wrapText(
      subject,
      fontBold,
      LAYOUT_FONT.subject.size,
      subjectZone.widthMm,
    ).length;
    const subjectHeightMm = glyphHeightMm("subject", subjectLineCount);

    expect(subjectLineCount).toBeGreaterThan(1);
    expect(subjectZone.heightMm).toBeCloseTo(subjectHeightMm);
    expect(content.yMm).toBeCloseTo(
      subjectZone.yMm + subjectHeightMm + FLOW_MM.blankLinesGap,
    );
  });

  it("rejects an info block that reaches the first fold mark", () => {
    expect(() => layout("B", lines(10))).not.toThrow();

    try {
      layout("B", lines(11));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(PdfLayoutError);
      expect(error).toMatchObject({ field: "customInfoBlock" });
    }
  });
});
