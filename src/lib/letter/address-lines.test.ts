import { describe, expect, it } from "vitest";
import type { RecipientAddress, SenderAddress } from "./address";
import { buildReturnLine, toAddressLines } from "./address-lines";

const sender: SenderAddress = {
  kind: "house",
  name: "Max Mustermann",
  street: "Gartenweg",
  number: "5",
  zip: "04177",
  city: "Leipzig",
};

describe("toAddressLines", () => {
  it("builds a house address", () => {
    expect(toAddressLines(sender)).toEqual([
      "Max Mustermann",
      "Gartenweg 5",
      "04177 Leipzig",
    ]);
  });

  it("omits a missing house number", () => {
    const [, street] = toAddressLines({ ...sender, number: undefined });

    expect(street).toBe("Gartenweg");
  });

  it("builds a PO box address", () => {
    const address: RecipientAddress = {
      kind: "pobox",
      name: "Stadtwerke GmbH",
      poBox: "10 20 30",
      zip: "04009",
      city: "Leipzig",
    };

    expect(toAddressLines(address)).toEqual([
      "Stadtwerke GmbH",
      "Postfach 10 20 30",
      "04009 Leipzig",
    ]);
  });

  it("places the addition and contact person below the company", () => {
    const address: RecipientAddress = {
      kind: "house",
      name: "Beispiel AG",
      addon: "Einkauf",
      contactPerson: {
        salutation: "frau",
        title: "Dr.",
        firstName: "Jana",
        lastName: "Schulz",
      },
      street: "Hafenweg",
      number: "4",
      zip: "20457",
      city: "Hamburg",
    };

    expect(toAddressLines(address)).toEqual([
      "Beispiel AG",
      "Einkauf",
      "Frau Dr. Jana Schulz",
      "Hafenweg 4",
      "20457 Hamburg",
    ]);
  });

  it("uses the postal form of the male salutation", () => {
    const address: RecipientAddress = {
      kind: "house",
      contactPerson: { salutation: "herr", lastName: "Bauer" },
      street: "Hauptstraße",
      number: "12",
      zip: "04109",
      city: "Leipzig",
    };

    expect(toAddressLines(address)[0]).toBe("Herrn Bauer");
  });

  it("writes the foreign city and country in uppercase", () => {
    const address: RecipientAddress = {
      kind: "house",
      name: "Bruno Bertoni",
      street: "Via Italia",
      number: "212",
      zip: "20100",
      city: "Milano",
      country: "Italien",
    };

    expect(toAddressLines(address)).toEqual([
      "Bruno Bertoni",
      "Via Italia 212",
      "20100 MILANO",
      "ITALIEN",
    ]);
  });

  it("treats Deutschland as a domestic address", () => {
    const lines = toAddressLines({ ...sender, country: "Deutschland" });

    expect(lines).toEqual(["Max Mustermann", "Gartenweg 5", "04177 Leipzig"]);
  });

  it("normalizes free text lines", () => {
    const address: RecipientAddress = {
      kind: "free",
      text: "  Musterfirma   GmbH \r\n\n  12345 Musterstadt\n",
    };

    expect(toAddressLines(address)).toEqual([
      "Musterfirma GmbH",
      "12345 Musterstadt",
    ]);
  });
});

describe("buildReturnLine", () => {
  it("joins the sender address into one line", () => {
    expect(buildReturnLine(sender)).toBe(
      "Max Mustermann, Gartenweg 5, 04177 Leipzig",
    );
  });

  it("keeps a c/o addition", () => {
    expect(buildReturnLine({ ...sender, addon: "c/o Erika Muster" })).toBe(
      "Max Mustermann, c/o Erika Muster, Gartenweg 5, 04177 Leipzig",
    );
  });
});
