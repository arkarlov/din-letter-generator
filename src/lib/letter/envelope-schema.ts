import { z } from "zod";
import { recipientAddressSchema, senderAddressSchema } from "./address";

export const envelopeFormatSchema = z.enum(["DL", "C6"]);
export type EnvelopeFormat = z.infer<typeof envelopeFormatSchema>;

export const envelopeSchema = z.object({
  sender: senderAddressSchema,
  recipient: recipientAddressSchema,
  format: envelopeFormatSchema.default("DL"),
});

export type EnvelopeData = z.infer<typeof envelopeSchema>;
