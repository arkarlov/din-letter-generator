import { describe, expect, it } from "vitest";
import { attachmentHeader, toPdfFileName } from "./file-name";

describe("toPdfFileName", () => {
  it("writes each part in PascalCase and joins the parts with underscores", () => {
    expect(
      toPdfFileName([
        "Letter",
        "Bezirksamt Treptow-Köpenick",
        "max mustermann",
        "2026-11-13",
      ]),
    ).toBe("Letter_BezirksamtTreptow-Köpenick_MaxMustermann_2026-11-13.pdf");
  });

  it("keeps acronyms and separates adjacent numbers", () => {
    expect(toPdfFileName(["Beispiel GmbH", "Rechnung 12/2026"])).toBe(
      "BeispielGmbH_Rechnung12-2026.pdf",
    );
  });

  it("removes characters that file systems forbid and inner underscores", () => {
    expect(toPdfFileName(['A/B: "Test"? snake_case', "x.y"])).toBe(
      "ABTestSnakeCase_XY.pdf",
    );
  });

  it("limits each part, so the date at the end survives", () => {
    const name = toPdfFileName([
      "Letter",
      `Bezirksamt Köpenick ${"x".repeat(200)}`,
      "2026-11-13",
    ]);

    expect(name).toBe(
      // 40 characters: "BezirksamtKöpenickX" (19) plus 21 more.
      `Letter_BezirksamtKöpenickX${"x".repeat(21)}_2026-11-13.pdf`,
    );
  });

  it("drops empty parts", () => {
    expect(toPdfFileName(["Letter", undefined, " ", "2026-11-13"])).toBe(
      "Letter_2026-11-13.pdf",
    );
  });

  it("falls back to a generic name", () => {
    expect(toPdfFileName([" / "])).toBe("document.pdf");
  });
});

describe("attachmentHeader", () => {
  it("adds an ASCII fallback and the UTF-8 name", () => {
    expect(attachmentHeader("Brief an Müller (Straße).pdf")).toBe(
      'attachment; filename="Brief an Muller (Strasse).pdf"; ' +
        "filename*=UTF-8''Brief%20an%20M%C3%BCller%20%28Stra%C3%9Fe%29.pdf",
    );
  });
});
