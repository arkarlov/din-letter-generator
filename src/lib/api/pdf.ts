import { LetterData } from "../letter/schema";

const parseResponseError = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();

    return body.error || "Unknown error";
  } catch {
    return response.statusText || "Unknown error";
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
    const errorMessage = await parseResponseError(response);

    throw new Error(errorMessage);
  }

  return response.blob();
};
