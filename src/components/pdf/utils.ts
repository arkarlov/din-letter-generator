import {
  grayscale,
  type PDFPage,
  type PDFFont,
  PDFPageDrawTextOptions,
} from "pdf-lib";
import {
  BlockZone,
  FontOptions,
  Layout,
  TextLayout,
  VerticalDirection,
} from "./types";

const mmToPt = (mm: number) => mm * 2.83465;
const ptToMM = (pt: number) => pt / 2.83465;

const drawPageText = (
  page: PDFPage,
  text: string,
  options: PDFPageDrawTextOptions &
    Required<Pick<PDFPageDrawTextOptions, "font" | "size" | "x" | "y">>,
) => {
  const { height } = page.getSize();
  const ascent = options.font.heightAtSize(options.size);

  page.drawText(text, {
    ...options,
    y: height - options.y - ascent,
  });
};

function getLayoutTextLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidthMM: number,
) {
  const paragraphs = text.split(/\r?\n/);

  const lines: string[] = [];

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

      const maxWidthPt = mmToPt(maxWidthMM);

      if (width <= maxWidthPt) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
  }

  return lines;
}

export function renderTextLines(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  lines: string[],
  fontSize: number,
  lineHeightPt: number,
) {
  lines.forEach((line, index) => {
    drawPageText(page, line, {
      x: mmToPt(layout.x),
      y: mmToPt(layout.y) + index * lineHeightPt,
      maxWidth: mmToPt(layout.width),
      font,
      size: fontSize,
    });
  });
}

export function renderFoldMarks(page: PDFPage, layout: Layout["foldMarks"]) {
  const { height } = page.getSize();
  const color = grayscale(0.7);
  const hole = height / 2;

  layout.forEach((mm) => {
    const y = height - mmToPt(mm);
    page.drawLine({
      start: { x: mmToPt(5), y },
      end: { x: mmToPt(10), y },
      thickness: 1,
      color,
    });
  });

  // hole mark
  page.drawLine({
    start: { x: mmToPt(5), y: hole },
    end: { x: mmToPt(12), y: hole },
    thickness: 1,
    color,
  });
}

export function renderPageNumber(page: PDFPage, font: PDFFont, text: string) {
  const size = 8;
  const textWidth = font.widthOfTextAtSize(text, size);
  const ascent = font.heightAtSize(size);

  const rightEdgeMm = 25 + 165;

  page.drawText(text, {
    x: mmToPt(rightEdgeMm) - textWidth,
    y: mmToPt(7) + ascent / 2,
    font,
    size,
    lineHeight: size,
  });
}

export function renderTextBlock(
  text: string,
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  fontOptions: FontOptions,
  direction: VerticalDirection = "top-down",
) {
  const { size, lineHeight } = fontOptions;

  const lines = getLayoutTextLines(text, font, size, layout.width);

  const lineHeightPt = size * lineHeight;
  const totalHeightMm = lines.length * ptToMM(lineHeightPt);

  if (layout.height && totalHeightMm > layout.height) {
    throw new Error("Return info exceeds allowed height");
  }

  let startYmm = layout.y;

  if (layout.height && direction === "bottom-up") {
    startYmm = layout.y + (layout.height - totalHeightMm);
  }

  renderTextLines(
    page,
    { ...layout, y: startYmm },
    font,
    lines,
    size,
    lineHeightPt,
  );
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
  const pages: string[][] = [];

  pages.push(lines.slice(0, firstPageMaxLines));

  let i = firstPageMaxLines;

  while (i < lines.length) {
    pages.push(lines.slice(i, i + nextPageMaxLines));
    i += nextPageMaxLines;
  }

  return pages;
}

export const paginateContent = (
  content: string,
  font: PDFFont,
  fontOptions: FontOptions,
  layout: Layout,
) => {
  const contentLines = getLayoutTextLines(
    content,
    font,
    fontOptions.size,
    layout.content.width,
  );
  const lineHeightPt = fontOptions.size * fontOptions.lineHeight;

  const firstPageHeightPt = getPageHeightPt(layout.content.y);
  const firstPageMaxLines = Math.floor(firstPageHeightPt / lineHeightPt);

  const nextPageHeightPt = getPageHeightPt(layout.letterheadHeight);
  const nextPageMaxLines = Math.floor(nextPageHeightPt / lineHeightPt);

  return paginateTextLines({
    lines: contentLines,
    firstPageMaxLines,
    nextPageMaxLines,
  });
};

export const getPageHeightPt = (topMm: number, bottomMm: number = 25) =>
  mmToPt(297 - topMm - bottomMm);

export const renderGrid = (page: PDFPage, layout: TextLayout & Layout) => {
  // frame 5mm
  page.drawRectangle({
    x: mmToPt(5),
    y: mmToPt(5),
    width: page.getSize().width - mmToPt(10),
    height: page.getSize().height - mmToPt(10),
    borderWidth: 1,
    borderColor: grayscale(0.5),
    color: grayscale(1),
  });

  // header
  page.drawLine({
    start: { x: 0, y: page.getSize().height - mmToPt(layout.letterheadHeight) },
    end: {
      x: page.getSize().width,
      y: page.getSize().height - mmToPt(layout.letterheadHeight),
    },
    thickness: 1,
  });
  // content
  page.drawLine({
    start: { x: 0, y: page.getSize().height - mmToPt(layout.subject.y) },
    end: {
      x: page.getSize().width,
      y: page.getSize().height - mmToPt(layout.subject.y),
    },
    thickness: 1,
  });
  // bottom
  page.drawLine({
    start: { x: 0, y: mmToPt(7) },
    end: { x: page.getSize().width, y: mmToPt(7) },
    thickness: 1,
  });
  // footer
  page.drawLine({
    start: { x: 0, y: mmToPt(25) },
    end: { x: page.getSize().width, y: mmToPt(25) },
    thickness: 1,
  });
  // left
  page.drawLine({
    start: { x: mmToPt(25), y: 0 },
    end: { x: mmToPt(25), y: page.getSize().height },
    thickness: 1,
  });
  // right
  page.drawLine({
    start: { x: page.getSize().width - mmToPt(20), y: 0 },
    end: { x: page.getSize().width - mmToPt(20), y: page.getSize().height },
    thickness: 1,
  });
  // right-2
  page.drawLine({
    start: { x: page.getSize().width - mmToPt(10), y: 0 },
    end: { x: page.getSize().width - mmToPt(10), y: page.getSize().height },
    thickness: 1,
  });
  // address-r
  page.drawLine({
    start: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.letterheadHeight),
    },
    end: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.recipient.y + 27.3),
    },
    thickness: 1,
  });
  // address-bottom
  page.drawLine({
    start: {
      x: mmToPt(25),
      y: page.getSize().height - mmToPt(layout.recipient.y + 27.3),
    },
    end: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.recipient.y + 27.3),
    },
    thickness: 1,
  });
  // add-botom
  page.drawLine({
    start: {
      x: mmToPt(25),
      y: page.getSize().height - mmToPt(layout.recipient.y + 27.3),
    },
    end: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.recipient.y + 27.3),
    },
    thickness: 1,
  });
  // info-left
  page.drawLine({
    start: { x: mmToPt(125), y: page.getSize().height - mmToPt(layout.info.y) },
    end: {
      x: mmToPt(125),
      y: page.getSize().height - mmToPt(layout.subject.y),
    },
    thickness: 1,
  });
  // info-top
  page.drawLine({
    start: { x: mmToPt(125), y: page.getSize().height - mmToPt(layout.info.y) },
    end: {
      x: page.getSize().width - mmToPt(10),
      y: page.getSize().height - mmToPt(layout.info.y),
    },
    thickness: 1,
  });
  // info-bottom
  page.drawLine({
    start: {
      x: mmToPt(125),
      y: page.getSize().height - mmToPt(layout.subject.y),
    },
    end: {
      x: page.getSize().width - mmToPt(10),
      y: page.getSize().height - mmToPt(layout.subject.y),
    },
    thickness: 1,
  });
};
