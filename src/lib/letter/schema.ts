import z from "zod";
import { formDataToLetterInput } from "./form-data";

const isValidDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const hasAtLeastTwoLines = (value: string) => {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length >= 2;
};

const letterObjectSchema = z
  .object({
    letterType: z.enum(["A", "B"]).default("B"),
    useReadyStamp: z.boolean().default(false),
    recipientAddress: z
      .string()
      .trim()
      .max(500, { message: "Recipient address is too long" })
      .optional(),
    returnAddress: z
      .string()
      .trim()
      .max(500, { message: "Return address is too long" })
      .optional(),
    infoBlock: z
      .string()
      .trim()
      .refine(hasAtLeastTwoLines, {
        message: "Address must contain at least 2 lines.",
      })
      .max(500, { message: "Info block is too long" }),
    date: z
      .string()
      .trim()
      .refine(isValidDateOnly, { message: "Invalid date" }),
    subject: z
      .string()
      .trim()
      .min(1, { message: "Subject is required" })
      .max(200, { message: "Subject is too long" }),
    message: z
      .string()
      .trim()
      .min(1, { message: "Message is required" })
      .max(20_000, { message: "Message is too long" })
      .refine((value) => value.split(/\r?\n/).length <= 500, {
        message: "Message contains too many lines",
      }),
  })
  .superRefine((data, ctx) => {
    if (!data.useReadyStamp) {
      if (!data.recipientAddress || data.recipientAddress.trim() === "") {
        ctx.addIssue({
          code: "custom",
          message: "Recipient address is required when useReadyStamp is false",
          path: ["recipientAddress"],
        });
      } else if (!hasAtLeastTwoLines(data.recipientAddress)) {
        ctx.addIssue({
          code: "custom",
          message: "Address must contain at least 2 lines.",
          path: ["recipientAddress"],
        });
      }
    }
  });

export const letterSchema = z.preprocess((input) => {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return input;
  }

  return formDataToLetterInput(input);
}, letterObjectSchema);

export type LetterData = z.infer<typeof letterSchema>;
export type LetterType = LetterData["letterType"];
