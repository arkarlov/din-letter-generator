import { describe, expect, it } from "vitest";
import { getFieldErrors } from "./field-errors";
import { letterSchema } from "./schema";

const sender = {
  kind: "house",
  name: "Max Mustermann",
  street: "Musterstraße",
  number: "12",
  zip: "12345",
  city: "Berlin",
};

const recipient = {
  kind: "house",
  name: "Musterfirma GmbH",
  street: "Musterstraße",
  number: "1",
  zip: "12345",
  city: "Musterstadt",
};

const validLetter = {
  sender,
  recipient,
  date: "2026-10-07",
  subject: "Anfrage",
  message: "Guten Tag",
};

const toFormData = (fields: Record<string, string>) => {
  const formData = new FormData();
  for (const [field, value] of Object.entries(fields)) {
    formData.set(field, value);
  }

  return formData;
};

const validFormFields = {
  "sender.kind": "house",
  "sender.name": "Max Mustermann",
  "sender.addon": "",
  "sender.street": "Musterstraße",
  "sender.number": "12",
  "sender.zip": "12345",
  "sender.city": "Berlin",
  "sender.country": "",
  "recipient.kind": "house",
  "recipient.name": "Musterfirma GmbH",
  "recipient.street": "Musterstraße",
  "recipient.number": "1",
  "recipient.zip": "12345",
  "recipient.city": "Musterstadt",
  returnLineOverride: "",
  note: "",
  date: "2026-10-07",
  subject: "Anfrage",
  message: "Guten Tag",
};

describe("letterSchema", () => {
  it("validates FormData submitted by the form", () => {
    const result = letterSchema.safeParse(toFormData(validFormFields));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useReadyStamp).toBe(false);
      expect(result.data.letterType).toBe("B");
      expect(result.data.sender.name).toBe("Max Mustermann");
      expect(result.data.recipient).toMatchObject({ city: "Musterstadt" });
    }
  });

  it("reports every empty required field by its full name", () => {
    const result = letterSchema.safeParse(
      toFormData({
        ...validFormFields,
        "sender.name": "",
        "recipient.street": "",
        subject: "",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result.error)).toEqual({
        "sender.name": "Name is required",
        "recipient.street": "Street is required",
        subject: "Subject is required",
      });
    }
  });

  it("converts the ready-stamp checkbox and permits no recipient", () => {
    const fields: Record<string, string> = {
      ...validFormFields,
      useReadyStamp: "on",
    };
    for (const field of Object.keys(fields)) {
      if (field.startsWith("recipient.")) delete fields[field];
    }

    const result = letterSchema.safeParse(toFormData(fields));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.useReadyStamp).toBe(true);
      expect(result.data.recipient).toBeUndefined();
    }
  });

  it("applies defaults and trims text fields", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      subject: "  Anfrage  ",
      returnLineOverride: "  Max Mustermann  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.letterType).toBe("B");
      expect(result.data.useReadyStamp).toBe(false);
      expect(result.data.subject).toBe("Anfrage");
      expect(result.data.returnLineOverride).toBe("Max Mustermann");
    }
  });

  it("leaves the info block to the sender address by default", () => {
    const result = letterSchema.safeParse(toFormData(validFormFields));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customInfoBlock).toBeUndefined();
    }
  });

  it("requires text in a custom info block, even when left empty", () => {
    for (const customInfoBlock of ["", "  \n\n  "]) {
      const result = letterSchema.safeParse(
        toFormData({ ...validFormFields, customInfoBlock }),
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFieldErrors(result.error)).toEqual({
          customInfoBlock: "Info block is required",
        });
      }
    }
  });

  it("accepts a single-line custom info block", () => {
    const result = letterSchema.safeParse({
      ...validLetter,
      customInfoBlock: "Telefon: 030 1234567",
    });

    expect(result.success).toBe(true);
  });

  it("requires a recipient unless using a ready stamp", () => {
    const missingRecipient = letterSchema.safeParse({
      ...validLetter,
      recipient: undefined,
    });
    const readyStampWithoutRecipient = letterSchema.safeParse({
      ...validLetter,
      recipient: undefined,
      useReadyStamp: true,
    });

    expect(missingRecipient.success).toBe(false);
    expect(readyStampWithoutRecipient.success).toBe(true);
  });

  it("limits the recipient address to six lines", () => {
    const toLetter = (lineCount: number) => ({
      ...validLetter,
      recipient: {
        kind: "free",
        text: Array.from({ length: lineCount }, () => "Zeile").join("\n"),
      },
    });
    const sevenLines = letterSchema.safeParse(toLetter(7));

    expect(letterSchema.safeParse(toLetter(6)).success).toBe(true);
    expect(sevenLines.success).toBe(false);
    if (!sevenLines.success) {
      expect(sevenLines.error.issues[0]?.path).toEqual(["recipient"]);
    }
  });

  it("requires a recipient name or contact person", () => {
    const withoutName = { ...recipient, name: undefined };
    const noName = letterSchema.safeParse({
      ...validLetter,
      recipient: withoutName,
    });
    const contactOnly = letterSchema.safeParse({
      ...validLetter,
      recipient: { ...withoutName, contactPerson: { lastName: "Bauer" } },
    });

    expect(noName.success).toBe(false);
    if (!noName.success) {
      expect(noName.error.issues[0]?.path).toEqual(["recipient", "name"]);
    }
    expect(contactOnly.success).toBe(true);
  });

  it("requires the last name when the contact person is left empty", () => {
    // The switch renders these inputs; leaving them all empty must not pass.
    const result = letterSchema.safeParse(
      toFormData({
        ...validFormFields,
        "recipient.contactPerson.salutation": "",
        "recipient.contactPerson.title": "",
        "recipient.contactPerson.firstName": "",
        "recipient.contactPerson.lastName": "",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result.error)).toEqual({
        "recipient.contactPerson.lastName": "Last name is required",
      });
    }
  });

  it("requires the last name of a started contact person", () => {
    const result = letterSchema.safeParse(
      toFormData({
        ...validFormFields,
        "recipient.contactPerson.salutation": "frau",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getFieldErrors(result.error)).toEqual({
        "recipient.contactPerson.lastName": "Last name is required",
      });
    }
  });

  it("requires a sender name and accepts only a street address", () => {
    const noName = letterSchema.safeParse({
      ...validLetter,
      sender: { ...sender, name: "" },
    });
    const freeText = letterSchema.safeParse({
      ...validLetter,
      sender: { kind: "free", text: "Max Mustermann\n12345 Berlin" },
    });

    const poBox = letterSchema.safeParse({
      ...validLetter,
      sender: {
        kind: "pobox",
        name: "Max Mustermann",
        poBox: "10 20 30",
        zip: "12345",
        city: "Berlin",
      },
    });

    expect(noName.success).toBe(false);
    expect(freeText.success).toBe(false);
    expect(poBox.success).toBe(false);
  });

  it("checks the postal code format only for German addresses", () => {
    const domestic = letterSchema.safeParse({
      ...validLetter,
      recipient: { ...recipient, zip: "1234" },
    });
    const foreign = letterSchema.safeParse({
      ...validLetter,
      recipient: { ...recipient, zip: "1234", country: "Österreich" },
    });

    expect(domestic.success).toBe(false);
    expect(foreign.success).toBe(true);
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

  it("rejects invalid calendar dates and oversized letter content", () => {
    const invalidDate = letterSchema.safeParse({
      ...validLetter,
      date: "2026-02-30",
    });
    const oversizedSubject = letterSchema.safeParse({
      ...validLetter,
      subject: "a".repeat(201),
    });
    const tooManyMessageLines = letterSchema.safeParse({
      ...validLetter,
      message: Array.from({ length: 501 }, () => "line").join("\n"),
    });

    expect(invalidDate.success).toBe(false);
    expect(oversizedSubject.success).toBe(false);
    expect(tooManyMessageLines.success).toBe(false);
  });
});
