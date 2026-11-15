import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, type PDFFont } from "pdf-lib";
import type { LetterData } from "@/lib/letter/schema";
import { PdfLayoutError } from "../shared/errors";
import { embedNotoSans } from "../shared/fonts";
import { prepareAddressField } from "./address-field";

const letter: Pick<LetterData, "sender" | "recipient"> = {
  sender: {
    kind: "house",
    name: "Max Mustermann",
    street: "Gartenweg 5",
    zip: "04177",
    city: "Leipzig",
  },
  recipient: { kind: "free", text: "Musterfirma GmbH\n12345 Musterstadt" },
};

let font: PDFFont;

beforeAll(async () => {
  font = await embedNotoSans(await PDFDocument.create());
});

const getLayoutError = (data: Parameters<typeof prepareAddressField>[0]) => {
  try {
    prepareAddressField(data, font);
  } catch (error) {
    return error;
  }
};

describe("prepareAddressField", () => {
  it("builds the return line from the sender", () => {
    expect(prepareAddressField(letter, font)).toEqual({
      returnLine: "Max Mustermann, Gartenweg 5, 04177 Leipzig",
      note: undefined,
      recipientLines: ["Musterfirma GmbH", "12345 Musterstadt"],
    });
  });

  it("uses the override and collapses it to one line", () => {
    const { returnLine } = prepareAddressField(
      { ...letter, returnLineOverride: "Max  Mustermann,\nLeipzig" },
      font,
    );

    expect(returnLine).toBe("Max Mustermann, Leipzig");
  });

  it.each([
    ["returnLineOverride", { returnLineOverride: "x".repeat(200) }],
    ["note", { note: "x".repeat(200) }],
    [
      "recipient",
      { recipient: { kind: "free", text: `Firma\n${"x".repeat(100)}` } },
    ],
  ] as const)("rejects a %s wider than the address field", (field, data) => {
    const error = getLayoutError({ ...letter, ...data });

    expect(error).toBeInstanceOf(PdfLayoutError);
    expect(error).toMatchObject({ field });
  });

  it("rejects characters the bundled font cannot encode", () => {
    const error = getLayoutError({
      ...letter,
      recipient: { kind: "free", text: "山田太郎\n東京" },
    });

    expect(error).toBeInstanceOf(PdfLayoutError);
    expect(error).toMatchObject({ field: "recipient" });
  });
});
