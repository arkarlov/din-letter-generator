import { z } from "zod";

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required` })
    .max(maxLength, { message: `${label} is too long` })
    // Empty form inputs are dropped, so a missing value must still reach the
    // length check. That keeps every field error visible in a single pass.
    .prefault("");

const optionalText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength, { message: `${label} is too long` })
    .optional();

const hasAtLeastTwoLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length >= 2;

export const isDomestic = (country?: string) =>
  !country || /^(deutschland|germany)$/i.test(country.trim());

const postalFields = {
  addon: optionalText("Address addition", 50),
  zip: requiredText("Postal code", 12),
  city: requiredText("City", 50),
  country: optionalText("Country", 50),
};

const houseFields = {
  kind: z.literal("house"),
  /** Street and house number in one line, in the destination's own order. */
  street: requiredText("Street", 50),
};

const poBoxFields = {
  kind: z.literal("pobox"),
  poBox: requiredText("PO box", 10),
};

const senderFields = {
  name: requiredText("Name", 50),
};

const contactPersonSchema = z.object({
  salutation: z.enum(["frau", "herr"]).optional(),
  title: optionalText("Title", 30),
  firstName: optionalText("First name", 50),
  lastName: requiredText("Last name", 50),
});

const recipientFields = {
  name: optionalText("Name", 50),
  contactPerson: contactPersonSchema.optional(),
};

const freeAddressSchema = z.object({
  kind: z.literal("free"),
  text: requiredText("Address", 500).refine(hasAtLeastTwoLines, {
    message: "Address must contain at least 2 lines.",
  }),
});

const validatePostalCode = (
  address: { zip: string; country?: string },
  ctx: z.RefinementCtx,
) => {
  if (address.zip && isDomestic(address.country)) {
    if (!/^\d{5}$/.test(address.zip)) {
      ctx.addIssue({
        code: "custom",
        message: "German postal code must have 5 digits",
        path: ["zip"],
      });
    }
  }
};

export const senderAddressSchema = z
  .object({ ...senderFields, ...postalFields, ...houseFields })
  .superRefine(validatePostalCode);

export const recipientAddressSchema = z
  .discriminatedUnion("kind", [
    z.object({ ...recipientFields, ...postalFields, ...houseFields }),
    z.object({ ...recipientFields, ...postalFields, ...poBoxFields }),
    freeAddressSchema,
  ])
  .superRefine((address, ctx) => {
    if (address.kind === "free") return;

    validatePostalCode(address, ctx);

    if (!address.name && !address.contactPerson) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a name or a contact person",
        path: ["name"],
      });
    }
  });

export type SenderAddress = z.infer<typeof senderAddressSchema>;
export type RecipientAddress = z.infer<typeof recipientAddressSchema>;
export type ContactPerson = z.infer<typeof contactPersonSchema>;
