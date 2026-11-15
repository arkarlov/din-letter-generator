import type { PDFFont } from "pdf-lib";

import { getTextBlockHeight } from "../shared/drawing";
import { PdfLayoutError } from "../shared/errors";
import { ptToMM } from "../shared/geometry";
import { wrapText } from "../shared/text-layout";
import { FLOW_MM, LAYOUT_FONT } from "./layout";
import type { Layout, LayoutGeometry } from "./types";

const blockHeightMm = (
  font: PDFFont,
  zone: keyof typeof LAYOUT_FONT,
  lineCount: number,
) => {
  const { size, lineHeight } = LAYOUT_FONT[zone];
  return ptToMM(getTextBlockHeight(font, size, lineHeight, lineCount));
};

type LayoutFirstPageProps = {
  geometry: LayoutGeometry;
  font: PDFFont;
  fontBold: PDFFont;
  infoBlock: string;
  subject: string;
};

/**
 * Place the blocks below the information block, as DIN 5008 does:
 * - the date follows the info block after one blank line;
 * - the info block, date included, is at least 40 mm tall, and both sit at
 *   its bottom;
 * - the subject starts two blank lines (8.46 mm) below the address field or
 *   the info block, whichever ends lower;
 * - the text starts two blank lines below the last subject line.
 * @throws PdfLayoutError when the info block reaches the first fold mark
 */
export function layoutFirstPage({
  geometry,
  font,
  fontBold,
  infoBlock,
  subject,
}: LayoutFirstPageProps): Layout {
  const { info, recipient } = geometry;
  const infoFont = LAYOUT_FONT.info;
  const infoLines = wrapText(infoBlock, font, infoFont.size, info.widthMm);

  // Offsets from the top of the info text to the date and to its bottom.
  const dateOffsetMm = ptToMM((infoLines.length + 1) * infoFont.lineHeight);
  const dateHeightMm = blockHeightMm(font, "date", 1);
  const contentHeightMm = dateOffsetMm + dateHeightMm;

  // The block grows downwards only when info and date need more than the
  // minimum height. Otherwise the spare space stays above the info text,
  // which the renderer pushes down to the date. Zero once the block grows.
  const frameHeightMm = Math.max(FLOW_MM.infoBlockMinHeight, contentHeightMm);
  const frameBottomMm = info.yMm + frameHeightMm;
  const spareHeightMm = frameHeightMm - contentHeightMm;

  const [firstFoldMm] = geometry.foldMarksMm;
  if (frameBottomMm > firstFoldMm) {
    throw new PdfLayoutError(
      `The info block is too long: with the date it must end above the fold mark at ${firstFoldMm} mm.`,
      "customInfoBlock",
    );
  }

  const addressFieldBottomMm = recipient.yMm + (recipient.heightMm ?? 0);
  const subjectYMm =
    Math.max(addressFieldBottomMm, frameBottomMm) + FLOW_MM.blankLinesGap;

  const subjectLines = wrapText(
    subject,
    fontBold,
    LAYOUT_FONT.subject.size,
    geometry.subject.widthMm,
  );
  const subjectHeightMm = blockHeightMm(
    fontBold,
    "subject",
    subjectLines.length,
  );

  return {
    ...geometry,
    info: {
      ...info,
      heightMm: spareHeightMm + blockHeightMm(font, "info", infoLines.length),
    },
    date: {
      ...geometry.date,
      yMm: info.yMm + spareHeightMm + dateOffsetMm,
      heightMm: dateHeightMm,
    },
    subject: {
      ...geometry.subject,
      yMm: subjectYMm,
      heightMm: subjectHeightMm,
    },
    content: {
      ...geometry.content,
      yMm: subjectYMm + subjectHeightMm + FLOW_MM.blankLinesGap,
    },
  };
}
