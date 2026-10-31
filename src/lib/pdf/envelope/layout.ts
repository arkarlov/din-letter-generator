import type { EnvelopeFormat } from "@/lib/letter/envelope-schema";
import { PdfLayoutError } from "../shared/errors";
import type { MmBlockZone } from "../shared/types";

const ENVELOPE_FORMATS = {
  DL: { widthMm: 220, heightMm: 110 },
  C6: { widthMm: 162, heightMm: 114 },
} satisfies Record<EnvelopeFormat, { widthMm: number; heightMm: number }>;

const MIN_PAGE_MARGIN_MM = 15;
const FRANKING_ZONE = { widthMm: 74, heightMm: 40 };
const CODING_ZONE = { heightMm: 15, clearanceMm: 3 };
const SENDER = { topMm: 15, maxWidthMm: 90 };
const RECIPIENT = { maxWidthMm: 100, rightAnchorMm: 74, baseWidthMm: 59 };

// lineHeight is a fixed pitch (≈ 6 mm) that stays the same when the size shrinks
export const ENVELOPE_FONT = { size: 12, minSize: 7, lineHeight: 17 };

export type EnvelopeLayout = {
  widthMm: number;
  heightMm: number;
  sender: MmBlockZone;
  recipient: Pick<MmBlockZone, "xMm" | "widthMm">;
  readingZone: { topMm: number; bottomMm: number };
};

export const createEnvelopeLayout = (
  format: EnvelopeFormat,
): EnvelopeLayout => {
  const { widthMm, heightMm } = ENVELOPE_FORMATS[format];

  return {
    widthMm,
    heightMm,
    sender: {
      xMm: MIN_PAGE_MARGIN_MM,
      yMm: SENDER.topMm,
      widthMm: Math.min(
        SENDER.maxWidthMm,
        widthMm - MIN_PAGE_MARGIN_MM - FRANKING_ZONE.widthMm,
      ),
      heightMm: FRANKING_ZONE.heightMm - SENDER.topMm,
    },
    recipient: {
      xMm: widthMm - MIN_PAGE_MARGIN_MM - RECIPIENT.maxWidthMm,
      widthMm: RECIPIENT.maxWidthMm,
    },
    readingZone: {
      topMm: FRANKING_ZONE.heightMm,
      bottomMm: heightMm - CODING_ZONE.heightMm - CODING_ZONE.clearanceMm,
    },
  };
};

export const getRecipientAddressLeftMm = (
  layout: EnvelopeLayout,
  textWidthMm: number,
) =>
  layout.widthMm -
  RECIPIENT.rightAnchorMm -
  Math.max(0, textWidthMm - RECIPIENT.baseWidthMm);

export const getRecipientAddressTopMm = (
  layout: EnvelopeLayout,
  textHeightMm: number,
) => {
  const { topMm, bottomMm } = layout.readingZone;
  const readingZoneHeightMm = bottomMm - topMm;

  if (textHeightMm > readingZoneHeightMm) {
    throw new PdfLayoutError(
      "Recipient address does not fit in the reading zone.",
    );
  }

  return topMm + (readingZoneHeightMm - textHeightMm) / 2;
};
