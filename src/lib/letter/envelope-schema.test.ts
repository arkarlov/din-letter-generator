import { describe, expect, it } from "vitest";
import { envelopeSchema } from "./envelope-schema";

const sender = {
  kind: "house",
  name: "Max Mustermann",
  street: "Musterstraße",
  number: "12",
  zip: "12345",
  city: "Berlin",
};

describe("envelopeSchema", () => {
  it("accepts structured and free text addresses", () => {
    const result = envelopeSchema.safeParse({
      sender,
      recipient: {
        kind: "free",
        text: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("DL");
    }
  });

  it("rejects a free text address with fewer than two non-empty lines", () => {
    const result = envelopeSchema.safeParse({
      sender,
      recipient: { kind: "free", text: "Musterfirma GmbH" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["recipient", "text"]);
    }
  });

  it("reports a missing sender field by its path", () => {
    const result = envelopeSchema.safeParse({
      sender: { ...sender, city: "" },
      recipient: sender,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["sender", "city"]);
    }
  });
});
