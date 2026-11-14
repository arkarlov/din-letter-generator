/** Each part is cut on its own, so a long subject never pushes out the date. */
const MAX_PART_LENGTH = 40;
const PART_SEPARATOR = "_";

const capitalize = (word: string) => {
  const [first = "", ...rest] = Array.from(word);
  // Only the first letter changes, so "GmbH" or "AG" keep their case.
  return first.toLocaleUpperCase("de-DE") + rest.join("");
};

/**
 * One part in PascalCase: "Antrag auf Kita-Gutschein 12/2026" →
 * "AntragAufKita-Gutschein12-2026". Words split at anything but letters,
 * digits, and hyphens, which also removes every character that file systems
 * forbid. Hyphens stay, so "Treptow-Köpenick" and "2026-11-13" keep theirs.
 * Adjacent numbers get a hyphen, so "12/2026" does not become "122026".
 */
const toFileNamePart = (part: string) => {
  const words = part
    .split(/[^\p{L}\p{N}-]+/u)
    .map((word) => word.replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  const joined = words.reduce((name, word) => {
    const divider = /\p{N}$/u.test(name) && /^\p{N}/u.test(word) ? "-" : "";
    return name + divider + capitalize(word);
  }, "");

  return Array.from(joined)
    .slice(0, MAX_PART_LENGTH)
    .join("")
    .replace(/-+$/, "");
};

/**
 * Join name parts into a safe PDF file name:
 * "Letter_BeispielAG_MaxMustermann_IhreAnfrage_2026-11-13.pdf". Each part
 * is length-limited and empty parts are dropped. Umlauts stay, since every
 * current system stores them.
 */
export function toPdfFileName(parts: (string | undefined)[]): string {
  const name = parts
    .map((part) => toFileNamePart(part ?? ""))
    .filter(Boolean)
    .join(PART_SEPARATOR);

  return `${name || "document"}.pdf`;
}

/**
 * `Content-Disposition` header for a download whose name may contain
 * umlauts: an ASCII fallback plus the UTF-8 name as RFC 6266 / 5987 define.
 */
export function attachmentHeader(fileName: string): string {
  const asciiFallback = fileName
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
