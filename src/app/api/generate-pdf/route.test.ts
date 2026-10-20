import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PdfLayoutError } from "@/lib/pdf/drawing";

const { generateLetterPDF } = vi.hoisted(() => ({
  generateLetterPDF: vi.fn(),
}));

vi.mock("@/lib/pdf/generate", () => ({ generateLetterPDF }));

import { POST } from "./route";

const validLetter = {
  letterType: "B",
  useReadyStamp: false,
  recipientAddress: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  infoBlock: "Max Mustermann\n12345 Berlin",
  date: "2026-10-20",
  subject: "Anfrage",
  message: "Guten Tag",
};

describe("POST /api/generate-pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-pdf", {
        method: "POST",
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    expect(generateLetterPDF).not.toHaveBeenCalled();
  });

  it("returns 422 when a text block cannot fit the page layout", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    generateLetterPDF.mockRejectedValue(
      new PdfLayoutError("Text block exceeds allowed height"),
    );

    const response = await POST(
      new Request("http://localhost/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLetter),
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "Text block exceeds allowed height",
    });
  });

  it("returns a generic 500 for unexpected generation failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    generateLetterPDF.mockRejectedValue(new Error("internal detail"));

    const response = await POST(
      new Request("http://localhost/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validLetter),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to generate PDF",
    });
  });
});
