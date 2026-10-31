import { describe, expect, it } from "vitest";
import { createLayout } from "./layout";

describe("createLayout", () => {
  it("positions Form A letter blocks higher than Form B", () => {
    const formA = createLayout("A");
    const formB = createLayout("B");

    expect(formA.letterheadHeightMm).toBe(27);
    expect(formB.letterheadHeightMm).toBe(45);
    expect(formA.sender.yMm).toBe(27);
    expect(formB.sender.yMm).toBe(45);
    expect(formA.recipient.yMm).toBe(44.7);
    expect(formB.recipient.yMm).toBe(62.7);
    expect(formA.content.yMm).toBe(110);
    expect(formB.content.yMm).toBe(128);
  });

  it("keeps the text and information columns aligned across forms", () => {
    const formA = createLayout("A");
    const formB = createLayout("B");

    expect(formA.sender.xMm).toBe(25);
    expect(formB.sender.xMm).toBe(25);
    expect(formA.info.xMm).toBe(125);
    expect(formB.info.xMm).toBe(125);
    expect(formA.content.widthMm).toBe(165);
    expect(formB.content.widthMm).toBe(165);
  });
});
