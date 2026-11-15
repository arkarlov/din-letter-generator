import z from "zod";
import { recipientAddressSchema, senderAddressSchema } from "./address";
import { toAddressLines } from "./address-lines";
import { formDataToLetterInput } from "./form-data";

const MAX_RECIPIENT_LINES = 6;

const isValidDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const letterObjectSchema = z
  .object({
    letterType: z.enum(["A", "B"]).default("B"),
    useReadyStamp: z.boolean().default(false),
    /** Debug aid: draw a millimetre grid and the layout zones. */
    showGuides: z.boolean().default(false),
    sender: senderAddressSchema,
    returnLineOverride: z
      .string()
      .trim()
      .max(200, { message: "Return line is too long" })
      .optional(),
    note: z
      .string()
      .trim()
      .max(100, { message: "Postal note is too long" })
      .optional(),
    recipient: recipientAddressSchema.optional(),
    customInfoBlock: z
      .string()
      .trim()
      .min(1, { message: "Info block is required" })
      .max(500, { message: "Info block is too long" })
      .optional(),
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
    if (data.useReadyStamp) return;

    if (!data.recipient) {
      ctx.addIssue({
        code: "custom",
        message: "Recipient address is required when useReadyStamp is false",
        path: ["recipient"],
      });
    } else if (toAddressLines(data.recipient).length > MAX_RECIPIENT_LINES) {
      ctx.addIssue({
        code: "custom",
        message: `Recipient address must not exceed ${MAX_RECIPIENT_LINES} lines`,
        path: ["recipient"],
      });
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
