import type { PDFFont } from "pdf-lib";
import type { FontOptions, Layout } from "./types";
import { mmToPt } from "./geometry";
import { PAGE_GEOMETRY } from "./layout";

function splitWordToFit(
  word: string,
  font: PDFFont,
  fontSize: number,
  maxWidthPt: number,
) {
  const chunks: string[] = [];
  let currentChunk = "";

  for (const character of Array.from(word)) {
    const candidate = currentChunk + character;

    if (
      currentChunk &&
      font.widthOfTextAtSize(candidate, fontSize) > maxWidthPt
    ) {
      chunks.push(currentChunk);
      currentChunk = character;
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidthMm: number,
) {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];
  const maxWidthPt = mmToPt(maxWidthMm);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidthPt) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);

        const wordChunks =
          font.widthOfTextAtSize(word, fontSize) <= maxWidthPt
            ? [word]
            : splitWordToFit(word, font, fontSize, maxWidthPt);

        lines.push(...wordChunks.slice(0, -1));
        currentLine = wordChunks.at(-1) ?? "";
      }
    }

    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

export function paginateTextLines({
  lines,
  firstPageMaxLines,
  nextPageMaxLines,
}: {
  lines: string[];
  firstPageMaxLines: number;
  nextPageMaxLines: number;
}) {
  if (
    !Number.isInteger(firstPageMaxLines) ||
    firstPageMaxLines <= 0 ||
    !Number.isInteger(nextPageMaxLines) ||
    nextPageMaxLines <= 0
  ) {
    throw new RangeError("Page capacities must be positive integers");
  }

  const pages: string[][] = [];
  pages.push(lines.slice(0, firstPageMaxLines));

  let index = firstPageMaxLines;
  while (index < lines.length) {
    pages.push(lines.slice(index, index + nextPageMaxLines));
    index += nextPageMaxLines;
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
  const lineHeightPt = fontOptions.size * fontOptions.lineHeight;
  const firstPageHeightPt = getPageHeightPt(layout.content.yMm);
  const firstPageMaxLines = Math.floor(firstPageHeightPt / lineHeightPt);
  const nextPageHeightPt = getPageHeightPt(layout.letterheadHeightMm);
  const nextPageMaxLines = Math.floor(nextPageHeightPt / lineHeightPt);

  return paginateTextLines({
    lines: contentLines,
    firstPageMaxLines,
    nextPageMaxLines,
  });
};
