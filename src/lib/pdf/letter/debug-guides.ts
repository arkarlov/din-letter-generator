import {
  grayscale,
  rgb,
  type Color,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import { getTextBlockHeight } from "../shared/drawing";
import { mmToPt, ptToMM } from "../shared/geometry";
import type { MmBlockZone } from "../shared/types";
import { LAYOUT_FONT, PAGE_GEOMETRY } from "./layout";
import type { Layout } from "./types";

/** The envelope window per DIN 5008. Text zones start 5 mm further right. */
const ADDRESS_FIELD_MM = { xMm: 20, widthMm: 85, heightMm: 45 };

const GRID_STEP_MM = 10;
const LABEL_SIZE = 5;
const RULER_SIZE = 4;

const COLORS = {
  grid: grayscale(0.88),
  ruler: grayscale(0.55),
  margin: rgb(0.18, 0.35, 0.58),
  address: rgb(0.77, 0.23, 0.17),
  info: rgb(0.18, 0.48, 0.31),
  text: rgb(0.18, 0.35, 0.58),
  letterhead: grayscale(0.45),
} satisfies Record<string, Color>;

type Zone = Required<MmBlockZone>;

/** Height of one line of glyphs in a zone that has no fixed height. */
const singleLineHeightMm = (font: PDFFont, zone: keyof typeof LAYOUT_FONT) => {
  const { size, lineHeight } = LAYOUT_FONT[zone];
  return ptToMM(getTextBlockHeight(font, size, lineHeight, 1));
};

const withHeight = (zone: MmBlockZone, heightMm: number): Zone => ({
  ...zone,
  heightMm: zone.heightMm ?? heightMm,
});

function renderGrid(page: PDFPage, font: PDFFont) {
  const { width, height } = page.getSize();

  for (let mm = GRID_STEP_MM; mm < PAGE_GEOMETRY.widthMm; mm += GRID_STEP_MM) {
    const x = mmToPt(mm);
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.25,
      color: COLORS.grid,
    });
    page.drawText(String(mm), {
      x: x + 1,
      y: height - RULER_SIZE - 1,
      size: RULER_SIZE,
      font,
      color: COLORS.ruler,
    });
  }

  for (let mm = GRID_STEP_MM; mm < PAGE_GEOMETRY.heightMm; mm += GRID_STEP_MM) {
    const y = height - mmToPt(mm);
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.25,
      color: COLORS.grid,
    });
    page.drawText(String(mm), {
      x: 1,
      y: y + 1,
      size: RULER_SIZE,
      font,
      color: COLORS.ruler,
    });
  }
}

function renderMargins(page: PDFPage) {
  const { height } = page.getSize();
  const edgesMm = [
    PAGE_GEOMETRY.leftMarginMm,
    PAGE_GEOMETRY.leftMarginMm + PAGE_GEOMETRY.contentWidthMm,
  ];

  edgesMm.forEach((mm) => {
    page.drawLine({
      start: { x: mmToPt(mm), y: 0 },
      end: { x: mmToPt(mm), y: height },
      thickness: 0.5,
      color: COLORS.margin,
      opacity: 0.4,
      dashArray: [2, 2],
    });
  });
}

function renderZone(
  page: PDFPage,
  font: PDFFont,
  zone: Zone,
  label: string,
  color: Color,
  dashed = false,
) {
  const { height } = page.getSize();
  const x = mmToPt(zone.xMm);
  const top = height - mmToPt(zone.yMm);
  const zoneWidth = mmToPt(zone.widthMm);

  page.drawRectangle({
    x,
    y: top - mmToPt(zone.heightMm),
    width: zoneWidth,
    height: mmToPt(zone.heightMm),
    color,
    opacity: dashed ? 0 : 0.06,
    borderColor: color,
    borderOpacity: 0.8,
    borderWidth: 0.5,
    borderDashArray: dashed ? [3, 2] : undefined,
  });

  // Zone labels go top right, where text rarely reaches. Dashed frames share
  // their top edge with a zone, so their labels go bottom right instead.
  const bottom = top - mmToPt(zone.heightMm);
  page.drawText(label, {
    x: x + zoneWidth - font.widthOfTextAtSize(label, LABEL_SIZE) - 1,
    y: dashed ? bottom + 2 : top - LABEL_SIZE - 1,
    size: LABEL_SIZE,
    font,
    color,
  });
}

type RenderLayoutGuidesProps = {
  page: PDFPage;
  layout: Layout;
  font: PDFFont;
  isFirstPage: boolean;
};

/**
 * Draw a millimetre grid and the outlines of all layout zones for debugging.
 * Call it before the letter content so the text stays on top.
 */
export function renderLayoutGuides({
  page,
  layout,
  font,
  isFirstPage,
}: RenderLayoutGuidesProps) {
  renderGrid(page, font);
  renderMargins(page);

  const contentTopMm = isFirstPage
    ? layout.content.yMm
    : layout.letterheadHeightMm;
  const contentBottomMm = PAGE_GEOMETRY.heightMm - PAGE_GEOMETRY.bottomMarginMm;

  renderZone(
    page,
    font,
    {
      ...layout.content,
      yMm: contentTopMm,
      heightMm: contentBottomMm - contentTopMm,
    },
    "Brieftext",
    COLORS.text,
  );

  if (!isFirstPage) return;

  renderZone(
    page,
    font,
    {
      xMm: 0,
      yMm: 0,
      widthMm: PAGE_GEOMETRY.widthMm,
      heightMm: layout.letterheadHeightMm,
    },
    "Briefkopf",
    COLORS.letterhead,
    true,
  );
  renderZone(
    page,
    font,
    { ...ADDRESS_FIELD_MM, yMm: layout.letterheadHeightMm },
    "Anschriftfeld (Fenster)",
    COLORS.address,
    true,
  );
  renderZone(
    page,
    font,
    withHeight(layout.sender, 0),
    "Zusatz- und Vermerkzone",
    COLORS.address,
  );
  renderZone(
    page,
    font,
    withHeight(layout.recipient, 0),
    "Anschriftzone",
    COLORS.address,
  );
  renderZone(
    page,
    font,
    withHeight(layout.info, 0),
    "Informationsblock",
    COLORS.info,
  );
  renderZone(
    page,
    font,
    withHeight(layout.date, singleLineHeightMm(font, "date")),
    "Datum",
    COLORS.info,
  );
  renderZone(
    page,
    font,
    withHeight(layout.subject, singleLineHeightMm(font, "subject")),
    "Betreff",
    COLORS.text,
  );
}
