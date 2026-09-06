export type DateOrder = "DMY" | "MDY" | "YMD";

/**
 * Normalizes unicode whitespace (e.g. narrow no-break space \u202F, non-breaking space \u00A0) to standard space.
 */
export function cleanWhitespace(str: string): string {
  return str.replace(/[\u202F\u00A0\u2000-\u200B]/g, " ").trim();
}

/**
 * Detects whether the date format in the file is likely DMY, MDY, or YMD.
 * Scans sample date strings from the text.
 */
export function detectDateOrder(
  rawDates: Array<{ part1: number; part2: number; part3: number }>,
): DateOrder {
  let hasFirstAbove12 = false;
  let hasSecondAbove12 = false;
  let hasYearFirst = false;

  for (const { part1, part2, part3 } of rawDates) {
    if (part1 > 1000) {
      hasYearFirst = true;
      break;
    }
    if (part1 > 12) {
      hasFirstAbove12 = true;
    }
    if (part2 > 12) {
      hasSecondAbove12 = true;
    }
  }

  if (hasYearFirst) return "YMD";
  if (hasFirstAbove12) return "DMY";
  if (hasSecondAbove12) return "MDY";

  // Default to DMY as it is standard in the majority of WhatsApp locales outside the US
  return "DMY";
}

/**
 * Converts 2-digit year to 4-digit year (e.g., 26 -> 2026, 99 -> 1999).
 */
function normalizeYear(year: number): number {
  if (year < 100) {
    return year < 70 ? 2000 + year : 1900 + year;
  }
  return year;
}

/**
 * Parses time string (24h or 12h with am/pm) into hours, minutes, seconds.
 */
export function parseTimeParts(
  timeStr: string,
): { hours: number; minutes: number; seconds: number } | null {
  const cleaned = cleanWhitespace(timeStr);
  const timeRegex =
    /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([aApP]\.?[mM]\.?))?$/;
  const match = cleaned.match(timeRegex);

  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const meridiem = match[4]?.toLowerCase().replace(/\./g, "");

  if (meridiem) {
    if (meridiem === "pm" && hours < 12) {
      hours += 12;
    } else if (meridiem === "am" && hours === 12) {
      hours = 0;
    }
  }

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return { hours, minutes, seconds };
}

/**
 * Normalizes raw date and time strings into a standardized ISO 8601 string.
 */
export function normalizeWhatsAppDateTime(
  dateStr: string,
  timeStr: string,
  dateOrder: DateOrder = "DMY",
): string | null {
  const cleanedDate = cleanWhitespace(dateStr);
  const datePartsMatch = cleanedDate.match(
    /^(\d{1,4})[./\-](\d{1,2})[./\-](\d{1,4})$/,
  );

  if (!datePartsMatch) return null;

  const p1 = parseInt(datePartsMatch[1], 10);
  const p2 = parseInt(datePartsMatch[2], 10);
  const p3 = parseInt(datePartsMatch[3], 10);

  let year: number;
  let month: number;
  let day: number;

  if (p1 > 1000) {
    // YMD: 2026-08-15
    year = p1;
    month = p2;
    day = p3;
  } else if (dateOrder === "MDY" || (p2 > 12 && p1 <= 12)) {
    // MDY: 08/15/2026
    month = p1;
    day = p2;
    year = normalizeYear(p3);
  } else {
    // DMY: 15/08/2026
    day = p1;
    month = p2;
    year = normalizeYear(p3);
  }

  // Basic calendar bounds check
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const timeParts = parseTimeParts(timeStr);
  if (!timeParts) return null;

  try {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const padYear = year.toString().padStart(4, "0");

    // Create Date in UTC
    const isoString = `${padYear}-${pad(month)}-${pad(day)}T${pad(timeParts.hours)}:${pad(timeParts.minutes)}:${pad(timeParts.seconds)}.000Z`;
    const dateObj = new Date(isoString);

    if (isNaN(dateObj.getTime())) return null;

    return isoString;
  } catch {
    return null;
  }
}
