import type { EnvelopeData } from "../letter/envelope-schema";
import type { LetterData } from "../letter/schema";

export class PdfRequestError extends Error {
  /** Name of the form field the server rejected, when one is known. */
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "PdfRequestError";
    this.field = field;
  }
}

const parseResponseError = async (
  response: Response,
): Promise<PdfRequestError> => {
  try {
    const body = await response.json();

    return new PdfRequestError(body.error || "Unknown error", body.field);
  } catch {
    return new PdfRequestError(response.statusText || "Unknown error");
  }
};

export const requestLetterPdf = async (payload: LetterData) => {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  return response.blob();
};

export const requestEnvelopePdf = async (payload: EnvelopeData) => {
  const response = await fetch("/api/generate-envelope-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseResponseError(response);
  }

  return response.blob();
};
