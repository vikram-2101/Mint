import { ParsedMessage, DateFilterOptions } from "@/types/chat";
import {
  subHours,
  subDays,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
} from "date-fns";

/**
 * Filters parsed WhatsApp messages based on preset or custom date ranges.
 * If a preset like last24h or last7d is used, it filters relative to the latest message in the chat.
 */
export function filterMessagesByDateRange(
  messages: ParsedMessage[],
  options: DateFilterOptions,
): ParsedMessage[] {
  if (!messages || messages.length === 0) return [];

  const preset = options.preset || "all";
  if (preset === "all" && !options.startDate && !options.endDate) {
    return messages;
  }

  // Find the anchor date (latest message timestamp)
  const lastMessage = messages[messages.length - 1];
  const anchorDate = lastMessage ? parseISO(lastMessage.timestamp) : new Date();

  let startBound: Date | null = null;
  let endBound: Date | null = null;

  switch (preset) {
    case "last24h":
      startBound = subHours(anchorDate, 24);
      endBound = anchorDate;
      break;
    case "last7d":
      startBound = subDays(anchorDate, 7);
      endBound = anchorDate;
      break;
    case "last30d":
      startBound = subDays(anchorDate, 30);
      endBound = anchorDate;
      break;
    case "custom":
    default:
      if (options.startDate) {
        startBound =
          typeof options.startDate === "string"
            ? parseISO(options.startDate)
            : options.startDate;
      }
      if (options.endDate) {
        endBound =
          typeof options.endDate === "string"
            ? parseISO(options.endDate)
            : options.endDate;
      }
      break;
  }

  return messages.filter((msg) => {
    try {
      const msgDate = parseISO(msg.timestamp);

      if (
        startBound &&
        isBefore(msgDate, startBound) &&
        !isEqual(msgDate, startBound)
      ) {
        return false;
      }

      if (
        endBound &&
        isAfter(msgDate, endBound) &&
        !isEqual(msgDate, endBound)
      ) {
        return false;
      }

      return true;
    } catch {
      // In case of invalid date, keep message by default to prevent data loss
      return true;
    }
  });
}
