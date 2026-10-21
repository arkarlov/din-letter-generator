import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { POST } from "./route";

const validEnvelope = {
  sender: "Max Mustermann\nMusterstraße 12\n12345 Berlin",
  recipient: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  format: "DL",
};

describe("POST /api/generate-envelope-pdf", () => {
  it("returns 400 when an address has fewer than two lines", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-envelope-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validEnvelope, sender: "Max Mustermann" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns a printable PDF attachment", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-envelope-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validEnvelope),
      }),
    );
    const document = await PDFDocument.load(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain(
      'filename="envelope.pdf"',
    );
    expect(document.getPageCount()).toBe(1);
    expect(document.getPage(0).getRotation().angle).toBe(0);
  });

  it("accepts the C6 format", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-envelope-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validEnvelope, format: "C6" }),
      }),
    );
    const document = await PDFDocument.load(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(document.getPage(0).getWidth()).toBeCloseTo((162 * 72) / 25.4, 2);
    expect(document.getPage(0).getHeight()).toBeCloseTo((114 * 72) / 25.4, 2);
  });

  it("accepts a recipient address duplicated in Latin and Cyrillic", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-envelope-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validEnvelope,
          recipient:
            "Ivan Ivanov\nLeningradskiy Prospekt 39, Bldg. 1, Apt. 14\n125167 MOSCOW\nИван Иванов\n125167, г. Москва, Ленинградский пр-кт, д. 39, корп. 1, кв. 14\nRUSSIA",
        }),
      }),
    );
    const document = await PDFDocument.load(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(document.getPageCount()).toBe(1);
  });
});
