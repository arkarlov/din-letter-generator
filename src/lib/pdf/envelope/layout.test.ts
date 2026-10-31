import { describe, expect, it } from "vitest";
import { PdfLayoutError } from "../shared/errors";
import {
  createEnvelopeLayout,
  getRecipientAddressLeftMm,
  getRecipientAddressTopMm,
} from "./layout";

const dl = createEnvelopeLayout("DL");
const c6 = createEnvelopeLayout("C6");

describe("createEnvelopeLayout", () => {
  it("uses the DL and C6 envelope sizes", () => {
    expect([dl.widthMm, dl.heightMm]).toEqual([220, 110]);
    expect([c6.widthMm, c6.heightMm]).toEqual([162, 114]);
  });

  it("keeps sender, recipient, franking, and coding zones clear", () => {
    expect(dl.sender).toMatchObject({ xMm: 15, yMm: 15, widthMm: 90 });
    expect(dl.recipient).toEqual({ xMm: 105, widthMm: 100 });
    expect(c6.sender).toMatchObject({ xMm: 15, yMm: 15, widthMm: 73 });
    expect(c6.recipient).toEqual({ xMm: 47, widthMm: 100 });
  });

  it("limits the sender to the area above the reading zone", () => {
    expect(dl.sender.heightMm).toBe(25);
    expect(dl.readingZone).toEqual({ topMm: 40, bottomMm: 92 });
    expect(c6.readingZone).toEqual({ topMm: 40, bottomMm: 96 });
  });
});

describe("getRecipientAddressTopMm", () => {
  it("centers the recipient within the reading zone", () => {
    expect(getRecipientAddressTopMm(dl, 24)).toBe(54);
    expect(getRecipientAddressTopMm(c6, 24)).toBe(56);
  });

  it("rejects an address taller than the reading zone", () => {
    expect(() => getRecipientAddressTopMm(dl, 53)).toThrow(PdfLayoutError);
  });
});

describe("getRecipientAddressLeftMm", () => {
  it("anchors short recipient lines 74 mm from the right edge", () => {
    expect(getRecipientAddressLeftMm(dl, 32)).toBe(146);
    expect(getRecipientAddressLeftMm(c6, 32)).toBe(88);
  });

  it("shifts longer recipient lines left by their excess over 59 mm", () => {
    expect(getRecipientAddressLeftMm(c6, 59)).toBe(88);
    expect(getRecipientAddressLeftMm(c6, 80)).toBe(67);
    expect(getRecipientAddressLeftMm(c6, 80) + 80).toBe(147);
  });
});
