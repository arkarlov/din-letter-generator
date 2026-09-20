import type { PdfData } from "./pdf/types";

const DEBUG_RECIPIENT_ADDRESS = `Frau Schmidt
Company Ltd.
Business Street 5
54321 Munich`;

const DEBUG_INFO_BLOCK = `Personal N:
8837789

John Doe
Example Street 12
4 OG, links,
12345 Berlin

Tel: +492341232515
e-mail: john@example.com`;

const DEBUG_RETURN_ADDRESS = "John Doe, Example Street 12, 12345 Berlin";

const isDev =
  typeof process !== "undefined" &&
  process.env &&
  process.env.NODE_ENV === "development";

function getStringValue(formData: FormData, key: string) {
  const val = formData.get(key);
  if (val instanceof File) {
    throw new Error(`${key} must be a string`);
  }
  return String(val ?? "").trim();
}

export const parseFormData = (formData: FormData): PdfData => {
  const useReadyStamp = formData.has("useReadyStamp");

  const subject = getStringValue(formData, "subject");
  if (!subject) {
    throw new Error("Subject is required");
  }

  const message = getStringValue(formData, "message");
  if (!message) {
    throw new Error("Message is required");
  }

  const date = getStringValue(formData, "date");
  if (!date) {
    throw new Error("Date is required");
  }

  const infoBlock = getStringValue(formData, "infoBlock");
  if (!infoBlock && !isDev) {
    throw new Error("Info block is required");
  }

  const recipientAddress = useReadyStamp
    ? undefined
    : getStringValue(formData, "recipientAddress");

  if (!recipientAddress && !useReadyStamp && !isDev) {
    throw new Error("Recipient address is required when not using ready stamp");
  }

  const returnAddress = getStringValue(formData, "returnAddress");

  // In development, fall back to debug constants to make it easier to iterate locally.
  const payload: PdfData = {
    useReadyStamp,
    recipientAddress:
      recipientAddress || (isDev ? DEBUG_RECIPIENT_ADDRESS : undefined),
    infoBlock: infoBlock || (isDev ? DEBUG_INFO_BLOCK : ""),
    subject,
    message,
    date,
    returnAddress: returnAddress || (isDev ? DEBUG_RETURN_ADDRESS : ""),
  };

  return payload;
};
