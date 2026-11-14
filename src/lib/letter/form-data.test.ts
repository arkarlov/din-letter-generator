import { describe, expect, it } from "vitest";
import { formDataToLetterInput, formDataToObject } from "./form-data";

describe("formDataToObject", () => {
  it("expands dotted names into nested objects", () => {
    const formData = new FormData();
    formData.set("subject", "Anfrage");
    formData.set("recipient.kind", "house");
    formData.set("recipient.contactPerson.lastName", "Bauer");

    expect(formDataToObject(formData)).toEqual({
      subject: "Anfrage",
      recipient: { kind: "house", contactPerson: { lastName: "Bauer" } },
    });
  });

  it("drops empty nested values but keeps their rendered groups", () => {
    const formData = new FormData();
    formData.set("recipient.kind", "house");
    formData.set("recipient.addon", "");
    formData.set("recipient.contactPerson.lastName", "");

    expect(formDataToObject(formData)).toEqual({
      recipient: { kind: "house", contactPerson: {} },
    });
  });

  it("keeps empty top-level values for field validation", () => {
    const formData = new FormData();
    formData.set("subject", "");

    expect(formDataToObject(formData)).toEqual({ subject: "" });
  });
});

describe("formDataToLetterInput", () => {
  it.each(["useReadyStamp", "showGuides"] as const)(
    "converts the %s switch to a boolean",
    (field) => {
      const formData = new FormData();

      expect(formDataToLetterInput(formData)[field]).toBe(false);

      formData.set(field, "on");

      expect(formDataToLetterInput(formData)[field]).toBe(true);
    },
  );
});
