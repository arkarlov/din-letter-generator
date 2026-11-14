export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const formatLongDate = (date: string, locale: string) =>
  new Date(`${date}T00:00:00.000Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

/** "2026-10-20" → "20. Oktober 2026", without a timezone shift. */
export const formatLetterDate = (date: string) => formatLongDate(date, "de-DE");

/** "2026-10-20" → "20 October 2026", for English document titles. */
export const formatTitleDate = (date: string) => formatLongDate(date, "en-GB");
