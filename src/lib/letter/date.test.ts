import { describe, expect, it } from "vitest";
import { formatDateInputValue } from "./date";

describe("formatDateInputValue", () => {
  it("formats the local calendar date for a date input", () => {
    const localDate = new Date(2026, 9, 20, 0, 30);

    expect(formatDateInputValue(localDate)).toBe("2026-10-20");
  });
});
