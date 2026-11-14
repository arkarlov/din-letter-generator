import { toPdfFileName } from "@/lib/document/file-name";
import { formatDateInputValue, formatTitleDate } from "@/lib/letter/date";
import { recipientLabel } from "@/lib/letter/document-name";
import type { EnvelopeData } from "./schema";

/** An envelope has no date of its own, so its names use the creation day. */
type EnvelopeNameInput = Pick<EnvelopeData, "recipient">;

/** PDF title: "Envelope to Beispiel AG dated 14 November 2026". */
export const envelopeTitle = (
  { recipient }: EnvelopeNameInput,
  createdAt = new Date(),
) =>
  `Envelope to ${recipientLabel(recipient)} dated ${formatTitleDate(
    formatDateInputValue(createdAt),
  )}`;

/**
 * File name with positional parts, like the letter's:
 * "Envelope_BeispielAG_MaxMustermann_2026-11-14.pdf".
 */
export const envelopeFileName = (
  { recipient, sender }: EnvelopeNameInput & Pick<EnvelopeData, "sender">,
  createdAt = new Date(),
) =>
  toPdfFileName([
    "Envelope",
    recipientLabel(recipient),
    sender.name,
    formatDateInputValue(createdAt),
  ]);
