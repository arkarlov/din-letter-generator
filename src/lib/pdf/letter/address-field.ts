import type { PDFFont } from "pdf-lib";

import {
  buildReturnLine,
  normalizeLine,
  toAddressLines,
} from "@/lib/letter/address-lines";
import type { LetterData } from "@/lib/letter/schema";
import { PdfLayoutError } from "../shared/errors";
import { assertEncodable } from "../shared/fonts";
import { mmToPt } from "../shared/geometry";
import { LAYOUT_FONT, PAGE_GEOMETRY } from "./layout";

export type AddressField = {
  returnLine: string;
  note?: string;
  recipientLines: string[];
};

const assertFitsWidth = (
  font: PDFFont,
  lines: string[],
  size: number,
  label: string,
  field: string,
) => {
  const maxWidthPt = mmToPt(PAGE_GEOMETRY.leftColumnWidthMm);

  if (lines.some((line) => font.widthOfTextAtSize(line, size) > maxWidthPt)) {
    throw new PdfLayoutError(
      `The ${label} is wider than the address field (${PAGE_GEOMETRY.leftColumnWidthMm} mm).`,
      field,
    );
  }
};

/**
 * Build the text of the envelope window and check it against the address field.
 * Lines are never wrapped here: an extra line would change the address itself.
 * @throws PdfLayoutError naming the form field that does not fit
 */
export function prepareAddressField(
  data: Pick<
    LetterData,
    "sender" | "returnLineOverride" | "note" | "recipient"
  >,
  font: PDFFont,
): AddressField {
  const returnLine = normalizeLine(
    data.returnLineOverride || buildReturnLine(data.sender),
  );
  const note = data.note ? normalizeLine(data.note) : undefined;
  const recipientLines = data.recipient ? toAddressLines(data.recipient) : [];

  assertEncodable(font, [returnLine], "return line", "returnLineOverride");
  assertFitsWidth(
    font,
    [returnLine],
    LAYOUT_FONT.sender.size,
    "return line",
    "returnLineOverride",
  );

  if (note) {
    assertEncodable(font, [note], "postal note", "note");
    assertFitsWidth(
      font,
      [note],
      LAYOUT_FONT.sender.size,
      "postal note",
      "note",
    );
  }

  assertEncodable(font, recipientLines, "recipient address", "recipient");
  assertFitsWidth(
    font,
    recipientLines,
    LAYOUT_FONT.recipient.size,
    "recipient address",
    "recipient",
  );

  return { returnLine, note, recipientLines };
}
