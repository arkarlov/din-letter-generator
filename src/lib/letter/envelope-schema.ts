import { z } from "zod";

const hasAtLeastTwoLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length >= 2;

const addressSchema = z
  .string()
  .trim()
  .min(1, { message: "Address is required" })
  .max(500, { message: "Address is too long" })
  .refine(hasAtLeastTwoLines, {
    message: "Address must contain at least 2 lines.",
  });

export const envelopeFormatSchema = z.enum(["DL", "C6"]);
export type EnvelopeFormat = z.infer<typeof envelopeFormatSchema>;

export const envelopeSchema = z.object({
  sender: addressSchema,
  recipient: addressSchema,
  format: envelopeFormatSchema.default("DL"),
});

export type EnvelopeData = z.infer<typeof envelopeSchema>;
