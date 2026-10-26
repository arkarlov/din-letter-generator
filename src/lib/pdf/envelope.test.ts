import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { EnvelopeData } from "@/lib/letter/envelope-schema";
import { PdfLayoutError } from "./drawing";
import {
  generateEnvelopePDF,
  getEnvelopeAddressZones,
  getRecipientAddressLeftMm,
  getRecipientAddressTopMm,
} from "./envelope";
import { mmToPt } from "./geometry";

const validEnvelope: EnvelopeData = {
  sender: "Max Mustermann\nMusterstraße 12\n12345 Berlin",
  recipient: "Musterfirma GmbH\nMusterstraße 1\n12345 Musterstadt",
  format: "DL",
};

describe("generateEnvelopePDF", () => {
  it("generates a single unrotated DL-sized PDF with both addresses", async () => {
    const bytes = await generateEnvelopePDF(validEnvelope);
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(document.getPageCount()).toBe(1);
    expect(page.getWidth()).toBe(mmToPt(220));
    expect(page.getHeight()).toBe(mmToPt(110));
    expect(page.getRotation().angle).toBe(90);
  });

  it("generates an unrotated C6 PDF", async () => {
    const bytes = await generateEnvelopePDF({ ...validEnvelope, format: "C6" });
    const document = await PDFDocument.load(bytes);
    const [page] = document.getPages();

    expect(page.getWidth()).toBe(mmToPt(162));
    expect(page.getHeight()).toBe(mmToPt(114));
    expect(page.getRotation().angle).toBe(90);
  });

  it("keeps sender, recipient, franking, and coding zones clear", () => {
    const dlZones = getEnvelopeAddressZones(220);
    const c6Zones = getEnvelopeAddressZones(162);

    expect(dlZones.sender).toMatchObject({ xMm: 15, yMm: 15, widthMm: 90 });
    expect(dlZones.recipient).toEqual({ xMm: 105, widthMm: 100 });
    expect(c6Zones.sender).toMatchObject({ xMm: 15, yMm: 15, widthMm: 73 });
    expect(c6Zones.recipient).toEqual({ xMm: 47, widthMm: 100 });
  });

  it("centers the recipient within the reading zone", () => {
    const textHeightMm = 24;
    const dlTopMm = getRecipientAddressTopMm(110, textHeightMm);
    const c6TopMm = getRecipientAddressTopMm(114, textHeightMm);

    expect(dlTopMm).toBe(54);
    expect(c6TopMm).toBe(56);
  });

  it("anchors short recipient lines 74 mm from the right edge", () => {
    expect(getRecipientAddressLeftMm(220, 32)).toBe(146);
    expect(getRecipientAddressLeftMm(162, 32)).toBe(88);
  });

  it("shifts longer recipient lines left by their excess over 59 mm", () => {
    expect(getRecipientAddressLeftMm(162, 59)).toBe(88);
    expect(getRecipientAddressLeftMm(162, 80)).toBe(67);
    expect(getRecipientAddressLeftMm(162, 80) + 80).toBe(147);
  });

  it("rejects recipient addresses that enter the upper franking zone", async () => {
    const recipient = Array.from({ length: 10 }, () => "Musterfirma").join(
      "\n",
    );

    await expect(
      generateEnvelopePDF({ ...validEnvelope, recipient }),
    ).rejects.toBeInstanceOf(PdfLayoutError);
  });

  it("embeds a recipient address duplicated in Latin and Cyrillic", async () => {
    const bytes = await generateEnvelopePDF({
      ...validEnvelope,
      recipient:
        "Ivan Ivanov\nLeningradskiy Prospekt 39, Bldg. 1, Apt. 14\n125167 MOSCOW\nИван Иванов\n125167, г. Москва, Ленинградский пр-кт, д. 39, корп. 1, кв. 14\nRUSSIA",
    });
    const document = await PDFDocument.load(bytes);

    expect(document.getPageCount()).toBe(1);
  });
});
