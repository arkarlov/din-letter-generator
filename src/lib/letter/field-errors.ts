import { z } from "zod";

/** Keyed by the field's full name, for example `recipient.street`. */
export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".");
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
