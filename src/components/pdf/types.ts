import { z } from "zod";

const hasAtLeastTwoLines = (value: string) =>
  value.split(/\r?\n/).filter((line) => line.trim()).length >= 2;

const pdfDataObjectSchema = z
  .object({
    infoBlock: z
      .string()
      .trim()
      .refine(hasAtLeastTwoLines, {
        message: "Address must contain at least 2 lines.",
      }),
    subject: z.string().trim().min(1, { message: "Subject is required" }),
    message: z.string().trim().min(1, { message: "Message is required" }),
    date: z
      .string()
      .trim()
      .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" }),
    recipientAddress: z.string().trim().optional(),
    returnAddress: z.string().trim().optional(),
    useReadyStamp: z.boolean().optional(),
    letterType: z.enum(["A", "B"]).default("B"),
  })
  .superRefine((obj, ctx) => {
    if (
      !obj.useReadyStamp &&
      (!obj.recipientAddress || obj.recipientAddress.trim() === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Recipient address is required when useReadyStamp is false",
        path: ["recipientAddress"],
      });
    } else if (
      !obj.useReadyStamp &&
      obj.recipientAddress &&
      !hasAtLeastTwoLines(obj.recipientAddress)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Address must contain at least 2 lines.",
        path: ["recipientAddress"],
      });
    }
  });

export const pdfDataSchema = z.preprocess((input) => {
  if (typeof FormData === "undefined" || !(input instanceof FormData)) {
    return input;
  }

  const formValues: Record<string, FormDataEntryValue> = {};
  input.forEach((value, key) => {
    formValues[key] = value;
  });

  return {
    ...formValues,
    useReadyStamp: input.has("useReadyStamp"),
  };
}, pdfDataObjectSchema);

export type PdfData = z.infer<typeof pdfDataSchema>;

export type MmBlockZone = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm?: number;
};

export type FontOptions = { size: number; lineHeight: number };

export type TextLayout = {
  sender: MmBlockZone;
  recipient: MmBlockZone;
  info: MmBlockZone;
  date: MmBlockZone;
  subject: MmBlockZone;
  content: MmBlockZone;
};
export type FontLayout = {
  [K in keyof TextLayout]: FontOptions;
};
export type Layout = TextLayout & {
  letterheadHeightMm: number;
  foldMarksMm: readonly number[];
};

export type LetterType = "A" | "B";

export type VerticalDirection = "top-down" | "bottom-up";
