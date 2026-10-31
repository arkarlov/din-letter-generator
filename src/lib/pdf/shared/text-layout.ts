import type { PDFFont } from "pdf-lib";
import { mmToPt } from "./geometry";

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

export function fitFontSize(
  font: PDFFont,
  lines: string[],
  requestedSize: number,
  minSize: number,
  maxWidthMm: number,
) {
  const maxWidthPt = mmToPt(maxWidthMm);
  let size = requestedSize;

  while (
    size > minSize &&
    lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidthPt)
  ) {
    size = Math.max(minSize, size - 0.25);
  }

  return size;
}
