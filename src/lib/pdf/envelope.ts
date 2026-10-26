import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { degrees, PDFDocument } from "pdf-lib";
import type { PDFFont } from "pdf-lib";
import type {
  EnvelopeData,
  EnvelopeFormat,
} from "@/lib/letter/envelope-schema";
import { PdfLayoutError, renderTextLines } from "./drawing";
import { mmToPt, ptToMM } from "./geometry";
import { wrapText } from "./text-layout";

const ENVELOPE_FORMATS = {
  DL: { widthMm: 220, heightMm: 110 },
  C6: { widthMm: 162, heightMm: 114 },
} satisfies Record<EnvelopeFormat, { widthMm: number; heightMm: number }>;
const MIN_PAGE_MARGIN_MM = 15;
const MAX_RECIPIENT_WIDTH_MM = 100;
const SENDER_MAX_WIDTH_MM = 90;
const FRANKING_ZONE_WIDTH_MM = 74;
const FRANKING_ZONE_HEIGHT_MM = 40;
const CODING_ZONE_HEIGHT_MM = 15;
const CODING_ZONE_CLEARANCE_MM = 3;
const READING_ZONE_TOP_MM = FRANKING_ZONE_HEIGHT_MM;
const RECIPIENT_RIGHT_ANCHOR_MM = 74;
const RECIPIENT_BASE_WIDTH_MM = 59;
const SENDER_TOP_MM = 15;
const SENDER_LEADING_MM = 6;
const MIN_FONT_SIZE = 7;

export const getEnvelopeAddressZones = (pageWidthMm: number) => ({
  sender: {
    xMm: MIN_PAGE_MARGIN_MM,
    yMm: SENDER_TOP_MM,
    widthMm: Math.min(
      SENDER_MAX_WIDTH_MM,
      pageWidthMm - MIN_PAGE_MARGIN_MM - FRANKING_ZONE_WIDTH_MM,
    ),
  },
  recipient: {
    xMm: pageWidthMm - MIN_PAGE_MARGIN_MM - MAX_RECIPIENT_WIDTH_MM,
    widthMm: MAX_RECIPIENT_WIDTH_MM,
  },
});

export const getRecipientAddressLeftMm = (
  pageWidthMm: number,
  textWidthMm: number,
) =>
  pageWidthMm -
  RECIPIENT_RIGHT_ANCHOR_MM -
  Math.max(0, textWidthMm - RECIPIENT_BASE_WIDTH_MM);

export const getRecipientAddressTopMm = (
  pageHeightMm: number,
  textHeightMm: number,
) => {
  const readingZoneBottomMm =
    pageHeightMm - CODING_ZONE_HEIGHT_MM - CODING_ZONE_CLEARANCE_MM;
  const readingZoneHeightMm = readingZoneBottomMm - READING_ZONE_TOP_MM;

  if (textHeightMm > readingZoneHeightMm) {
    throw new PdfLayoutError(
      "Recipient address does not fit in the reading zone.",
    );
  }

  return READING_ZONE_TOP_MM + (readingZoneHeightMm - textHeightMm) / 2;
};

const getAddressLines = (address: string) =>
  address
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const assertEncodable = (
  font: PDFFont,
  lines: string[],
  addressName: string,
) => {
  const supported = new Set(font.getCharacterSet());
  const unsupported = new Set<number>();

  for (const line of lines) {
    for (const character of Array.from(line)) {
      const codePoint = character.codePointAt(0);
      if (codePoint !== undefined && !supported.has(codePoint)) {
        unsupported.add(codePoint);
      }
    }
  }

  if (unsupported.size > 0) {
    throw new PdfLayoutError(
      `The ${addressName} address contains characters unsupported by the bundled Noto Sans font.`,
    );
  }
};

const fitFontSize = (
  font: PDFFont,
  lines: string[],
  requestedSize: number,
  maxWidthMm: number,
) => {
  let size = requestedSize;
  const maxWidthPt = mmToPt(maxWidthMm);

  while (
    size > MIN_FONT_SIZE &&
    lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidthPt)
  ) {
    size = Math.max(MIN_FONT_SIZE, size - 0.25);
  }

  return size;
};

export async function generateEnvelopePDF(
  data: EnvelopeData,
): Promise<Uint8Array> {
  const { widthMm, heightMm } = ENVELOPE_FORMATS[data.format];
  const document = await PDFDocument.create();
  document.setTitle(`Briefumschlag ${data.format} (DIN 5008)`);

  document.registerFontkit(fontkit);
  const fontBytes = await readFile(
    join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"),
  );
  const font = await document.embedFont(fontBytes, { subset: true });
  const senderLines = getAddressLines(data.sender);
  const recipientLines = getAddressLines(data.recipient);

  assertEncodable(font, senderLines, "sender");
  assertEncodable(font, recipientLines, "recipient");

  const page = document.addPage([mmToPt(widthMm), mmToPt(heightMm)]);
  const addressZones = getEnvelopeAddressZones(widthMm);

  const senderSize = fitFontSize(
    font,
    senderLines,
    12,
    addressZones.sender.widthMm,
  );
  const senderWrapped = wrapText(
    data.sender.trim(),
    font,
    senderSize,
    addressZones.sender.widthMm,
  );
  if (
    senderWrapped.length * SENDER_LEADING_MM >
    FRANKING_ZONE_HEIGHT_MM - SENDER_TOP_MM
  ) {
    throw new PdfLayoutError("Sender address does not fit in the sender zone.");
  }

  renderTextLines(
    page,
    addressZones.sender,
    font,
    senderWrapped,
    senderSize,
    mmToPt(SENDER_LEADING_MM),
  );

  const recipientSize = fitFontSize(
    font,
    recipientLines,
    12,
    addressZones.recipient.widthMm,
  );
  const recipientWrapped = wrapText(
    data.recipient.trim(),
    font,
    recipientSize,
    addressZones.recipient.widthMm,
  );
  const recipientTextWidthMm = Math.max(
    ...recipientWrapped.map((line) =>
      ptToMM(font.widthOfTextAtSize(line, recipientSize)),
    ),
  );
  const recipientLeftMm = getRecipientAddressLeftMm(
    widthMm,
    recipientTextWidthMm,
  );
  const recipientLeadingPt = mmToPt(6);
  const recipientTextHeightMm =
    ptToMM(font.heightAtSize(recipientSize)) +
    (recipientWrapped.length - 1) * 6;
  const firstRecipientYmm = getRecipientAddressTopMm(
    heightMm,
    recipientTextHeightMm,
  );

  renderTextLines(
    page,
    {
      ...addressZones.recipient,
      xMm: recipientLeftMm,
      yMm: firstRecipientYmm,
    },
    font,
    recipientWrapped,
    recipientSize,
    recipientLeadingPt,
  );

  page.setRotation(degrees(90));

  return document.save();
}
