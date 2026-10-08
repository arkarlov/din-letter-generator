import z from "zod";
import { formDataToLetterInput } from "./form-data";

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
    recipientAddress: z.string().trim().optional(),
    returnAddress: z.string().trim().optional(),
    infoBlock: z.string().trim().refine(hasAtLeastTwoLines, {
      message: "Address must contain at least 2 lines.",
    }),
    date: z
      .string()
      .trim()
      .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" }),
    subject: z.string().trim().min(1, { message: "Subject is required" }),
    message: z.string().trim().min(1, { message: "Message is required" }),
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
