import { describe, expect, it } from "vitest";
import {
  formatDateInputValue,
  formatLetterDate,
  formatTitleDate,
} from "./date";

describe("formatDateInputValue", () => {
  it("formats the local calendar date for a date input", () => {
    const localDate = new Date(2026, 9, 20, 0, 30);

    expect(formatDateInputValue(localDate)).toBe("2026-10-20");
  });
});

describe("formatLetterDate", () => {
  it("formats an ISO calendar date without a timezone shift", () => {
    expect(formatLetterDate("2026-10-20")).toBe("20. Oktober 2026");
  });
});

describe("formatTitleDate", () => {
  it("formats an ISO calendar date in English", () => {
    expect(formatTitleDate("2026-10-20")).toBe("20 October 2026");
  });
});
