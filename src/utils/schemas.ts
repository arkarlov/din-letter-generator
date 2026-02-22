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
