import { degrees, type PDFFont, type PDFPage } from "pdf-lib";

import { renderTextLines } from "../shared/drawing";
import { PdfLayoutError } from "../shared/errors";
import { assertEncodable } from "../shared/fonts";
import { ptToMM } from "../shared/geometry";
import { fitFontSize, wrapText } from "../shared/text-layout";
import {
  ENVELOPE_FONT,
  getRecipientAddressLeftMm,
  getRecipientAddressTopMm,
  type EnvelopeLayout,
} from "./layout";

type RenderEnvelopePageProps = {
  page: PDFPage;
  layout: EnvelopeLayout;
  font: PDFFont;
  sender: string;
  recipient: string;
};

const getAddressLines = (address: string) =>
  address
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const prepareAddress = (
  address: string,
  font: PDFFont,
  maxWidthMm: number,
  label: string,
) => {
  const lines = getAddressLines(address);
  assertEncodable(font, lines, label);

  const size = fitFontSize(
    font,
    lines,
    ENVELOPE_FONT.size,
    ENVELOPE_FONT.minSize,
    maxWidthMm,
  );

  return { size, lines: wrapText(lines.join("\n"), font, size, maxWidthMm) };
};

export function renderEnvelopePage({
  page,
  layout,
  font,
  sender,
  recipient,
}: RenderEnvelopePageProps) {
  const { lineHeight } = ENVELOPE_FONT;
  const lineHeightMm = ptToMM(lineHeight);

  const senderBlock = prepareAddress(
    sender,
    font,
    layout.sender.widthMm,
    "sender address",
  );
  if (
    layout.sender.heightMm !== undefined &&
    senderBlock.lines.length * lineHeightMm > layout.sender.heightMm
  ) {
    throw new PdfLayoutError("Sender address does not fit in the sender zone.");
  }
  renderTextLines(
    page,
    layout.sender,
    font,
    senderBlock.lines,
    senderBlock.size,
    lineHeight,
  );

  const recipientBlock = prepareAddress(
    recipient,
    font,
    layout.recipient.widthMm,
    "recipient address",
  );
  const textWidthMm = Math.max(
    ...recipientBlock.lines.map((line) =>
      ptToMM(font.widthOfTextAtSize(line, recipientBlock.size)),
    ),
  );
  const textHeightMm =
    ptToMM(font.heightAtSize(recipientBlock.size)) +
    (recipientBlock.lines.length - 1) * lineHeightMm;

  renderTextLines(
    page,
    {
      ...layout.recipient,
      xMm: getRecipientAddressLeftMm(layout, textWidthMm),
      yMm: getRecipientAddressTopMm(layout, textHeightMm),
    },
    font,
    recipientBlock.lines,
    recipientBlock.size,
    lineHeight,
  );

  page.setRotation(degrees(90));
}
