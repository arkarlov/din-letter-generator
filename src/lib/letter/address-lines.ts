import {
  isDomestic,
  type ContactPerson,
  type RecipientAddress,
  type SenderAddress,
} from "./address";

const SALUTATION_LABELS = {
  frau: "Frau",
  herr: "Herrn",
} satisfies Record<NonNullable<ContactPerson["salutation"]>, string>;

export const normalizeLine = (line: string) => line.replace(/\s+/g, " ").trim();

const normalizeLines = (lines: (string | undefined)[]) =>
  lines.map((line) => normalizeLine(line ?? "")).filter(Boolean);

const toContactLine = ({
  salutation,
  title,
  firstName,
  lastName,
}: ContactPerson) =>
  [salutation && SALUTATION_LABELS[salutation], title, firstName, lastName]
    .filter(Boolean)
    .join(" ");

export function toAddressLines(
  address: SenderAddress | RecipientAddress,
): string[] {
  if (address.kind === "free") {
    return normalizeLines(address.text.split(/\r?\n/));
  }

  const domestic = isDomestic(address.country);
  const toForeignCase = (value: string) =>
    domestic ? value : value.toLocaleUpperCase("de-DE");
  const contactPerson =
    "contactPerson" in address ? address.contactPerson : undefined;

  return normalizeLines([
    address.name,
    address.addon,
    contactPerson && toContactLine(contactPerson),
    address.kind === "house"
      ? `${address.street} ${address.number ?? ""}`
      : `Postfach ${address.poBox}`,
    `${address.zip} ${toForeignCase(address.city)}`,
    domestic ? undefined : toForeignCase(address.country ?? ""),
  ]);
}

export const buildReturnLine = (sender: SenderAddress) =>
  toAddressLines(sender).join(", ");
