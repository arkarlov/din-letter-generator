import { describe, expect, it } from "vitest";
import { envelopeFileName, envelopeTitle } from "@/lib/envelope/document-name";
import type { RecipientAddress } from "./address";
import { letterFileName, letterTitle } from "./document-name";

const company: RecipientAddress = {
  kind: "house",
  name: "Bezirksamt Treptow-Köpenick",
  contactPerson: { salutation: "frau", lastName: "Karadag" },
  street: "Alt-Köpenick",
  number: "21",
  zip: "12555",
  city: "Berlin",
};

const sender = {
  kind: "house" as const,
  name: "Max Mustermann",
  street: "Gartenweg",
  number: "5",
  zip: "04177",
  city: "Leipzig",
};

const letter = {
  recipient: company,
  sender,
  date: "2026-11-13",
  subject: "Antrag auf Kita-Gutschein",
};

describe("letter names", () => {
  it("names the addressee, the date, and the subject", () => {
    expect(letterTitle(letter)).toBe(
      "Letter to Bezirksamt Treptow-Köpenick dated 13 November 2026: Antrag auf Kita-Gutschein",
    );
    expect(letterFileName(letter)).toBe(
      "Letter_BezirksamtTreptow-Köpenick_MaxMustermann_AntragAufKita-Gutschein_2026-11-13.pdf",
    );
  });

  it("uses the contact person when there is no company", () => {
    const recipient: RecipientAddress = {
      ...company,
      name: undefined,
      contactPerson: { salutation: "herr", lastName: "Bauer" },
    };

    expect(letterTitle({ ...letter, recipient })).toBe(
      "Letter to Herrn Bauer dated 13 November 2026: Antrag auf Kita-Gutschein",
    );
  });

  it("leaves the addressee out for a ready stamp", () => {
    expect(letterTitle({ ...letter, recipient: undefined })).toBe(
      "Letter dated 13 November 2026: Antrag auf Kita-Gutschein",
    );
    expect(letterFileName({ ...letter, recipient: undefined })).toBe(
      "Letter_MaxMustermann_AntragAufKita-Gutschein_2026-11-13.pdf",
    );
  });

  it("removes characters a file name cannot hold", () => {
    expect(letterFileName({ ...letter, subject: "Rechnung 12/2026" })).toBe(
      "Letter_BezirksamtTreptow-Köpenick_MaxMustermann_Rechnung12-2026_2026-11-13.pdf",
    );
  });
});

describe("envelope names", () => {
  it("names the addressee and the creation day", () => {
    const createdAt = new Date(2026, 10, 14, 9, 30);

    expect(envelopeTitle({ recipient: company }, createdAt)).toBe(
      "Envelope to Bezirksamt Treptow-Köpenick dated 14 November 2026",
    );
    expect(envelopeFileName({ recipient: company, sender }, createdAt)).toBe(
      "Envelope_BezirksamtTreptow-Köpenick_MaxMustermann_2026-11-14.pdf",
    );
  });
});
