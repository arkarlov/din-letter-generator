import { describe, expect, it } from "vitest";
import { formatLetterDate } from "./letter-renderer";

describe("formatLetterDate", () => {
  it("formats an ISO calendar date without a timezone shift", () => {
    expect(formatLetterDate("2026-10-20")).toBe("20. Oktober 2026");
  });
});
