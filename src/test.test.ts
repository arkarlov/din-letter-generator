import { describe, it, expect } from "vitest";
import { pdfDataSchema } from "@/components/pdf/types";

const validLetter = {
  infoBlock: "Max Mustermann\n12345 Berlin",
  subject: "Anfrage",
  message: "Guten Tag",
  date: "2026-10-07",
};

describe("pdfDataSchema", () => {
  it("requires at least two non-empty lines in the info block", () => {
    const result = pdfDataSchema.safeParse({
      ...validLetter,
      infoBlock: "Max Mustermann",
      recipientAddress: "Musterfirma\n12345 Berlin",
    });

    expect(result.success).toBe(false);
  });

  it("requires a multiline recipient unless a ready stamp is used", () => {
    const withoutRecipient = pdfDataSchema.safeParse(validLetter);
    const withSingleLineRecipient = pdfDataSchema.safeParse({
      ...validLetter,
      recipientAddress: "Musterfirma",
    });
    const withReadyStamp = pdfDataSchema.safeParse({
      ...validLetter,
      useReadyStamp: true,
    });

    expect(withoutRecipient.success).toBe(false);
    expect(withSingleLineRecipient.success).toBe(false);
    expect(withReadyStamp.success).toBe(true);
  });
});

describe("pdfDataSchema with FormData", () => {
  it("reports FormData validation errors with field paths", () => {
    const formData = new FormData();
    formData.set("infoBlock", "Max Mustermann\n12345 Berlin");
    formData.set("subject", "");
    formData.set("message", "Guten Tag");
    formData.set("date", "2026-10-07");
    formData.set("recipientAddress", "Musterfirma");

    const result = pdfDataSchema.safeParse(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["subject"] }),
          expect.objectContaining({ path: ["recipientAddress"] }),
        ]),
      );
    }
  });

  it("normalizes a ready-stamp checkbox and validates FormData directly", () => {
    const formData = new FormData();
    formData.set("infoBlock", "Max Mustermann\n12345 Berlin");
    formData.set("subject", "Anfrage");
    formData.set("message", "Guten Tag");
    formData.set("date", "2026-10-07");
    formData.set("useReadyStamp", "on");

    const result = pdfDataSchema.safeParse(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useReadyStamp).toBe(true);
      expect(result.data.letterType).toBe("B");
    }
  });
});
