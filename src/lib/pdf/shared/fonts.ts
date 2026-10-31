import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import type { PDFDocument, PDFFont } from "pdf-lib";

import { PdfLayoutError } from "./errors";

const NOTO_SANS_FILES = {
  regular: "NotoSans-Regular.ttf",
  bold: "NotoSans-Bold.ttf",
} as const;

export async function embedNotoSans(
  document: PDFDocument,
  weight: keyof typeof NOTO_SANS_FILES = "regular",
) {
  document.registerFontkit(fontkit);
  const fontBytes = await readFile(
    join(process.cwd(), "public/fonts", NOTO_SANS_FILES[weight]),
  );

  return document.embedFont(fontBytes, { subset: true });
}

export const assertEncodable = (
  font: PDFFont,
  lines: string[],
  label: string,
) => {
  const supported = new Set(font.getCharacterSet());
  const hasUnsupported = lines.some((line) =>
    Array.from(line).some((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && !supported.has(codePoint);
    }),
  );

  if (hasUnsupported) {
    throw new PdfLayoutError(
      `The ${label} contains characters unsupported by the bundled Noto Sans font.`,
    );
  }
};
