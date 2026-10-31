import type { PDFFont } from "pdf-lib";

import { mmToPt } from "../shared/geometry";
import { wrapText } from "../shared/text-layout";
import type { FontOptions } from "../shared/types";
import { PAGE_GEOMETRY } from "./layout";
import type { Layout } from "./types";

const assertPageCapacity = (maxLines: number) => {
  if (!Number.isInteger(maxLines) || maxLines <= 0) {
    throw new RangeError("Page capacity must be a positive integer");
  }
};

export function paginateTextLines({
  lines,
  pageMaxLines,
}: {
  lines: string[];
  pageMaxLines: number;
}) {
  assertPageCapacity(pageMaxLines);

  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += pageMaxLines) {
    pages.push(lines.slice(index, index + pageMaxLines));
  }

  return pages;
}

const getPageHeightPt = (
  topMm: number,
  bottomMm = PAGE_GEOMETRY.bottomMarginMm,
) => mmToPt(PAGE_GEOMETRY.heightMm - topMm - bottomMm);

export const paginateContent = (
  content: string,
  font: PDFFont,
  fontOptions: FontOptions,
  layout: Layout,
) => {
  const contentLines = wrapText(
    content,
    font,
    fontOptions.size,
    layout.content.widthMm,
  );
  const { lineHeight } = fontOptions;
  const firstPageHeightPt = getPageHeightPt(layout.content.yMm);
  const firstPageMaxLines = Math.floor(firstPageHeightPt / lineHeight);
  const nextPageHeightPt = getPageHeightPt(layout.letterheadHeightMm);
  const nextPageMaxLines = Math.floor(nextPageHeightPt / lineHeight);

  assertPageCapacity(firstPageMaxLines);

  return [
    contentLines.slice(0, firstPageMaxLines),
    ...paginateTextLines({
      lines: contentLines.slice(firstPageMaxLines),
      pageMaxLines: nextPageMaxLines,
    }),
  ];
};
