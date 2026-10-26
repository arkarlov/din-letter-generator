import { describe, expect, it } from "vitest";
import { envelopeSchema } from "./envelope-schema";

describe("envelopeSchema", () => {
  it("accepts sender and recipient addresses with multiple lines", () => {
    const result = envelopeSchema.safeParse({
      sender: "Max Mustermann\nMusterstraße 12\n12345 Berlin",
      recipient: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBe("DL");
    }
  });

  it("rejects an address with fewer than two non-empty lines", () => {
    const result = envelopeSchema.safeParse({
      sender: "Max Mustermann",
      recipient: "Musterfirma GmbH\nMusterstraße 1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["sender"]);
    }
  });
});
