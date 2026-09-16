import { z } from "zod";

export const pdfDataSchema = z
  .object({
    senderInfo: z.string().min(1, { message: "Sender address is required" }),
    subject: z.string().min(1, { message: "Subject is required" }),
    message: z.string().min(1, { message: "Message is required" }),
    date: z
      .string()
      .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" }),
    recipientAddress: z.string().optional(),
    senderAddress: z.string().optional(),
    useReadyStamp: z.boolean().optional(),
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
    }
  });

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
