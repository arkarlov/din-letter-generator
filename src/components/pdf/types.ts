import { z } from "zod";

export const pdfDataSchema = z.object({
  senderAddress: z.string().min(1, { message: "Sender address is required" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  message: z.string().min(1, { message: "Message is required" }),
  date: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" })
    .optional(),
  recipientAddress: z.string().optional(),
  returnInfo: z.string().optional(),
});

export type PdfData = z.infer<typeof pdfDataSchema>;

export type BlockZone = {
  x: number;
  y: number;
  width: number;
  height?: number;
};
export type FontOptions = { size: number; lineHeight: number };

export type TextLayout = {
  returnInfo: BlockZone;
  address: BlockZone;
  info: BlockZone;
  date: BlockZone;
  subject: BlockZone;
  content: BlockZone;
};
export type FontLayout = {
  [K in keyof TextLayout]: FontOptions;
};
export type Layout = TextLayout & {
  letterheadHeight: number;
  foldMarks: number[];
};

export type LetterType = "A" | "B";

export type VerticalDirection = "top-down" | "bottom-up";
