import { z } from "zod";
import type { LetterData } from "./schema";

export type LetterFieldErrors = Partial<Record<keyof LetterData, string>>;

export function getLetterFieldErrors(error: z.ZodError): LetterFieldErrors {
  const fieldErrors: LetterFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field as keyof LetterData]) {
      fieldErrors[field as keyof LetterData] = issue.message;
    }
  }

  return fieldErrors;
}
