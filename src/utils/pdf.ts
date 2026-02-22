import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  grayscale,
  type PDFPage,
  type PDFFont,
  PDFPageDrawTextOptions,
  rgb,
} from "pdf-lib";

export type BlockZone = {
  x: number;
  y: number;
  width: number;
  height?: number;
};
type FontOptions = { size: number; lineHeight: number };

export type Layout = {
  returnInfo: BlockZone;
  address: BlockZone;
  info: BlockZone;
  date: BlockZone;
  subject: BlockZone;
  content: BlockZone;
};
type LayoutMarks = { letterheadHeight: number; foldMarks: number[] };
type LayoutFont = {
  [K in keyof Layout]: FontOptions;
};

export type LetterType = "A" | "B";

type VerticalDirection = "top-down" | "bottom-up";

/**
 * Data structure for PDF generation
 */
export interface PdfData {
  date: string | Date;
  recipientAddress: string;
  senderAddress: string;
  subject: string;
  message: string;
  returnInfo: string;
}

export const LAYOUTS: Record<LetterType, Layout & LayoutMarks> = {
  A: {
    letterheadHeight: 27,
    returnInfo: {
      x: 25,
      y: 27,
      width: 80,
      height: 17.7,
    },
    address: {
      x: 25,
      y: 44.7,
      width: 80,
      height: 27.3,
    },
    info: {
      x: 125,
      y: 32,
      width: 75,
      height: 45,
    },
    date: {
      x: 125,
      y: 80,
      width: 75,
    },
    subject: {
      x: 25,
      y: 90,
      width: 165,
    },
    content: {
      x: 25,
      y: 110,
      width: 165,
    },
    foldMarks: [87, 192],
  },
  B: {
    letterheadHeight: 45,
    returnInfo: {
      x: 25,
      y: 45,
      width: 80,
      height: 17.7,
    },
    address: {
      x: 25,
      y: 62.7,
      width: 80,
      height: 27.3,
    },
    info: {
      x: 125,
      y: 50,
      width: 75,
      height: 45,
    },
    date: {
      x: 125,
      y: 98,
      width: 75,
    },
    subject: {
      x: 25,
      y: 106,
      width: 165,
    },
    content: {
      x: 25,
      y: 125,
      width: 165,
    },
    foldMarks: [105, 210],
  },
};

const LAYOUT_FONT: LayoutFont = {
  returnInfo: { size: 8, lineHeight: 1 },
  address: { size: 10, lineHeight: 1.1 },
  info: { size: 11, lineHeight: 1.15 },
  date: { size: 11, lineHeight: 1 },
  subject: { size: 12, lineHeight: 1 },
  content: { size: 12, lineHeight: 1.5 },
};

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
  maxWidthPt: number,
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

function renderTextLines(
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

function renderFoldMarks(page: PDFPage, layout: LayoutMarks["foldMarks"]) {
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

function drawPageNumber(
  page: PDFPage,
  font: PDFFont,
  pageNumber: number,
  totalPages: number,
) {
  const text = `Seite ${pageNumber} von ${totalPages}`;
  // const text = `Page ${pageNumber} of ${totalPages}`;

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

function renderTextBlock(
  text: string,
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  fontOptions: FontOptions,
  direction: VerticalDirection = "top-down",
) {
  const { size, lineHeight } = fontOptions;

  const lines = getLayoutTextLines(text, font, size, mmToPt(layout.width));

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

export const renderGrid = (page: PDFPage, layout: Layout & LayoutMarks) => {
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
      y: page.getSize().height - mmToPt(layout.address.y + 27.3),
    },
    thickness: 1,
  });
  // address-bottom
  page.drawLine({
    start: {
      x: mmToPt(25),
      y: page.getSize().height - mmToPt(layout.address.y + 27.3),
    },
    end: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.address.y + 27.3),
    },
    thickness: 1,
  });
  // add-botom
  page.drawLine({
    start: {
      x: mmToPt(25),
      y: page.getSize().height - mmToPt(layout.address.y),
    },
    end: {
      x: mmToPt(105),
      y: page.getSize().height - mmToPt(layout.address.y),
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

/**
 * Generate a PDF document with letter content
 * @param data - The letter data containing all required fields
 * @returns Uint8Array containing the PDF bytes
 * @throws Error if required fields are missing or invalid
 * @throws Error if text content exceeds layout constraints
 * @example
 * const pdfBytes = await generatePDF({
 *   date: new Date(),
 *   recipientAddress: '123 Main St',
 *   senderAddress: '456 Oak Ave',
 *   subject: 'Invoice',
 *   message: 'Dear Customer...',
 *   returnInfo: 'Return to Sender'
 * });
 */
export async function generatePDF(data: PdfData): Promise<Uint8Array> {
  // Validate required fields
  const requiredFields: (keyof PdfData)[] = [
    "date",
    "recipientAddress",
    "senderAddress",
    "subject",
    "message",
    "returnInfo",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.setFont(font);
    page.setFontSize(12);
    page.setLineHeight(12 * 1.15);
    page.setFontColor(rgb(0, 0, 0));

    const layout = LAYOUTS["A"];

    const {
      date,
      recipientAddress,
      senderAddress,
      subject,
      message,
      returnInfo,
    } = data;

    const formattedDate = new Date(date).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // debug
    // renderGrid(page, layout);

    renderFoldMarks(page, layout.foldMarks);

    renderTextBlock(
      returnInfo,
      page,
      layout.returnInfo,
      font,
      LAYOUT_FONT.returnInfo,
      "bottom-up",
    );
    renderTextBlock(
      recipientAddress,
      page,
      layout.address,
      font,
      LAYOUT_FONT.address,
      "bottom-up",
    );
    renderTextBlock(senderAddress, page, layout.info, font, LAYOUT_FONT.info);
    renderTextBlock(formattedDate, page, layout.date, font, LAYOUT_FONT.date);
    renderTextBlock(
      subject,
      page,
      layout.subject,
      fontBold,
      LAYOUT_FONT.subject,
    );
    renderTextBlock(message, page, layout.content, font, LAYOUT_FONT.content);

    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((page, i) => {
      drawPageNumber(page, font, i + 1, totalPages);
    });

    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
