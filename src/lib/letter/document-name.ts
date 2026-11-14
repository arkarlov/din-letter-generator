import type { RecipientAddress } from "./address";
import { toAddressLines } from "./address-lines";
import { formatTitleDate } from "./date";
import type { LetterData } from "./schema";
import { toPdfFileName } from "@/lib/document/file-name";

/** The first address line names the addressee: a person, company, or authority. */
export const recipientLabel = (recipient?: RecipientAddress) =>
  recipient ? toAddressLines(recipient)[0] : undefined;

type LetterNameInput = Pick<LetterData, "recipient" | "date" | "subject">;

const addressedTo = (recipient?: RecipientAddress) => {
  const label = recipientLabel(recipient);
  return label ? ` to ${label}` : "";
};

/** PDF title: "Letter to Beispiel AG dated 13 November 2026: Ihre Anfrage". */
export const letterTitle = ({ recipient, date, subject }: LetterNameInput) =>
  `Letter${addressedTo(recipient)} dated ${formatTitleDate(date)}: ${subject}`;

/**
 * File name with positional parts, grouped by recipient in a folder:
 * "Letter_BeispielAG_MaxMustermann_IhreAnfrage_2026-11-13.pdf".
 */
export const letterFileName = ({
  recipient,
  sender,
  subject,
  date,
}: LetterNameInput & Pick<LetterData, "sender">) =>
  toPdfFileName([
    "Letter",
    recipientLabel(recipient),
    sender.name,
    subject,
    date,
  ]);
