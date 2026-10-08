import { describe, expect, it } from "vitest";
import { getLetterFieldErrors } from "./field-errors";
import { letterSchema } from "./schema";

const validLetter = {
  recipientAddress: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  infoBlock: "Max Mustermann\n12345 Berlin",
  date: "2026-10-07",
  subject: "Anfrage",
  message: "Guten Tag",
};

describe("letterSchema", () => {
  it("validates FormData submitted by the form", () => {
    const formData = new FormData();
    for (const [field, value] of Object.entries(validLetter)) {
      formData.set(field, value);
    }

    const result = letterSchema.safeParse(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useReadyStamp).toBe(false);
      expect(result.data.letterType).toBe("B");
    }
  });

  it("reports FormData validation issues against their fields", () => {
    const formData = new FormData();
    formData.set("recipientAddress", "Musterfirma GmbH");
    formData.set("infoBlock", "Max Mustermann");
    formData.set("date", "2026-10-07");
    formData.set("subject", "");
    formData.set("message", "Guten Tag");

    const result = letterSchema.safeParse(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["recipientAddress", "infoBlock", "subject"]),
      );
      expect(getLetterFieldErrors(result.error)).toMatchObject({
        recipientAddress: expect.any(String),
        infoBlock: expect.any(String),
        subject: "Subject is required",
      });
    }
  });

  it("converts the ready-stamp checkbox and permits no recipient", () => {
    const formData = new FormData();
    formData.set("infoBlock", validLetter.infoBlock);
    formData.set("date", validLetter.date);
    formData.set("subject", validLetter.subject);
    formData.set("message", validLetter.message);
    formData.set("useReadyStamp", "on");

    const result = letterSchema.safeParse(formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useReadyStamp).toBe(true);
      expect(result.data.recipientAddress).toBeUndefined();
    }
  });

  it("applies defaults and trims text fields", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      subject: "  Anfrage  ",
      returnAddress: "  Max Mustermann  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.letterType).toBe("B");
      expect(result.data.useReadyStamp).toBe(false);
      expect(result.data.subject).toBe("Anfrage");
      expect(result.data.returnAddress).toBe("Max Mustermann");
    }
  });

  it("requires at least two non-empty lines in the info block", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      infoBlock: "Max Mustermann\n\n  ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["infoBlock"] }),
        ]),
      );
    }
  });

  it("requires a multiline recipient unless using a ready stamp", () => {
    const missingRecipient = letterSchema.safeParse({
      ...validLetter,
      recipientAddress: undefined,
    });
    const oneLineRecipient = letterSchema.safeParse({
      ...validLetter,
      recipientAddress: "Musterfirma GmbH",
    });
    const readyStampWithoutRecipient = letterSchema.safeParse({
      ...validLetter,
      recipientAddress: undefined,
      useReadyStamp: true,
    });

    expect(missingRecipient.success).toBe(false);
    expect(oneLineRecipient.success).toBe(false);
    expect(readyStampWithoutRecipient.success).toBe(true);
  });

  it("reports invalid date, subject, and message fields", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      date: "not-a-date",
      subject: "   ",
      message: "   ",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["date"] }),
          expect.objectContaining({ path: ["subject"] }),
          expect.objectContaining({ path: ["message"] }),
        ]),
      );
    }
  });
});

describe("getLetterFieldErrors", () => {
  it("maps schema issues to their first field message", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      infoBlock: "Single line",
      subject: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getLetterFieldErrors(result.error)).toEqual({
        infoBlock: "Address must contain at least 2 lines.",
        subject: "Subject is required",
      });
    }
  });
});
