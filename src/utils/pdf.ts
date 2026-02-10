import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  grayscale,
  degrees,
  type PDFPage,
  type PDFFont,
  PDFPageDrawTextOptions,
  rgb,
} from "pdf-lib";

export type BlockZone = {
  x: number;
  y: number;
  width: number;
};

export type FormLayout = {
  letterheadHeight: number;
  address: BlockZone;
  info: BlockZone;
  date: BlockZone;
  subject: BlockZone;
  content: BlockZone;
  foldMarks: number[];
};

export type LetterForm = "A" | "B";

export const FORM_LAYOUTS: Record<LetterForm, FormLayout> = {
  A: {
    letterheadHeight: 27,
    address: {
      x: 25,
      y: 44.7,
      width: 80,
    },
    info: {
      x: 125,
      y: 32,
      width: 75,
    },
    date: {
      x: 125,
      y: 75,
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
    // foldMarks: [87, 192],
    foldMarks: [87, 190],
  },
  B: {
    letterheadHeight: 45,
    address: {
      x: 25,
      y: 62.7,
      width: 80,
    },
    info: {
      x: 125,
      y: 50,
      width: 75,
    },
    date: {
      x: 125,
      y: 93,
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

const mmToPt = (mm: number) => mm * 2.83465;
const ptToMm = (pt: number) => pt / 2.83465;

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
    x: mmToPt(options.x),
    y: height - mmToPt(options.y) - ascent,
    maxWidth: options.maxWidth && mmToPt(options.maxWidth),
  });
};

type AddressData = {
  name: string;
  line1: string;
  line2?: string;
  line3?: string;
};

function drawAddressBlock(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  data: AddressData,
) {
  const size = 10;
  const lineHeight = size;
  let yOffset = 0;

  const { x, y, width } = layout;

  const drawLine = (text?: string) => {
    if (!text) return;

    drawPageText(page, text, {
      x: x,
      y: y + yOffset,
      maxWidth: width,
      font,
      size,
      lineHeight,
    });

    yOffset += ptToMm(lineHeight);
  };

  drawLine(data.name);
  drawLine(data.line1);
  drawLine(data.line2);
  drawLine(data.line3);
}

function drawInfoBlock(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  date: string,
) {
  const size = 11;
  const lineHeight = size;

  const { x, y, width } = layout;

  drawPageText(page, date, {
    x: x,
    y: y,
    maxWidth: width,
    font,
    size,
    lineHeight,
  });
}

function drawDate(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  date?: string,
) {
  const { x, y, width } = layout;
  const currentDate = new Date().toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  drawPageText(page, date ?? currentDate, {
    x: x,
    y: y,
    maxWidth: width,
    font,
    size: 11,
    lineHeight: 11,
  });
}
function drawSubject(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  text: string,
) {
  const size = 12;
  const lineHeight = size;

  const { x, y, width } = layout;

  drawPageText(page, text, {
    x: x,
    y: y,
    maxWidth: width,
    font,
    size,
    lineHeight,
  });
}

function drawContent(
  page: PDFPage,
  layout: BlockZone,
  font: PDFFont,
  text: string,
) {
  const size = 12;
  const lineHeight = size * 1.15;

  const { x, y, width } = layout;

  drawPageText(page, text, {
    x: x,
    y: y,
    maxWidth: width,
    font,
    size,
    lineHeight,
  });
}

function drawFoldMarks(page: PDFPage, layout: FormLayout["foldMarks"]) {
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
  const { height } = page.getSize();
  const text = `Seite ${pageNumber} von ${totalPages}`;

  const size = 8;
  const textWidth = font.widthOfTextAtSize(text, size);
  const fontHeight = font.sizeAtHeight(size);

  const rightEdgeMm = 25 + 165;

  drawPageText(page, text, {
    x: rightEdgeMm - ptToMm(textWidth),
    y: ptToMm(height) - (7 + ptToMm(fontHeight)),
    font,
    size,
    lineHeight: size,
  });
}

const drawGrid = (page: PDFPage, layout: FormLayout) => {
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

export async function generatePDF(data: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.setFont(font);
  page.setFontSize(12);
  page.setLineHeight(12 * 1.15);
  page.setFontColor(rgb(0, 0, 0));

  const layout = FORM_LAYOUTS["A"];

  // debug
  drawGrid(page, layout);

  drawFoldMarks(page, layout.foldMarks);
  drawAddressBlock(page, layout.address, font, {
    name: data.recipientName,
    line1: data.addressLine1,
    line2: data.addressLine2,
    line3: data.addressLine3,
  });
  drawInfoBlock(page, layout.info, font, "Name Sername");
  drawDate(page, layout.date, font);
  drawSubject(page, layout.subject, fontBold, "Subject");
  drawContent(page, layout.content, font, data.message);

  const totalPages = pdfDoc.getPageCount();

  pdfDoc.getPages().forEach((page, i) => {
    drawPageNumber(page, font, i + 1, totalPages);
  });

  const pdfBytes = await pdfDoc.save();

  return pdfBytes;
}
