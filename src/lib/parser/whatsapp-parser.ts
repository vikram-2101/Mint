import { ParsedMessage, ChatMetadata, ParseResult } from "@/types/chat";
import {
  cleanWhitespace,
  detectDateOrder,
  normalizeWhatsAppDateTime,
  DateOrder,
} from "./date-normalizer";

// Regex for Android style: "15/08/2026, 14:30 - Sender: Message" or "15/08/2026, 2:30 pm - Sender: Message"
const ANDROID_LINE_REGEX =
  /^(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F\u00A0]*[aApP]\.?[mM]\.?)?)\s*-\s*([\s\S]*)$/;

// Regex for iOS style: "[15/08/2026, 14:30:45] Sender: Message"
const IOS_LINE_REGEX =
  /^\[(\d{1,4}[./\-]\d{1,2}[./\-]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F\u00A0]*[aApP]\.?[mM]\.?)?)\]\s*([\s\S]*)$/;

// Patterns identifying media omission
const MEDIA_PATTERNS = [
  /<media omitted>/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /sticker omitted/i,
  /document omitted/i,
  /gif omitted/i,
  /contact card omitted/i,
  /<attached:\s*[^>]+>/i,
  /‎<attached:\s*[^>]+>/i,
  /null omitted/i,
];

// Patterns for group subject/name detection
const GROUP_SUBJECT_PATTERNS = [
  /created group ["“'](.+?)["”']/i,
  /changed the subject to ["“'](.+?)["”']/i,
  /changed the subject from ["“'].+?["”'] to ["“'](.+?)["”']/i,
  /changed the group name to ["“'](.+?)["”']/i,
];

interface RawHeaderMatch {
  dateStr: string;
  timeStr: string;
  remainder: string;
  isIos: boolean;
}

function matchLineHeader(line: string): RawHeaderMatch | null {
  // Strip Left-to-Right Mark (\u200E) or Right-to-Left Mark (\u200F) at the start
  const sanitized = line.replace(/^[\u200E\u200F]+/, "");

  const iosMatch = sanitized.match(IOS_LINE_REGEX);
  if (iosMatch) {
    return {
      dateStr: iosMatch[1],
      timeStr: iosMatch[2],
      remainder: iosMatch[3],
      isIos: true,
    };
  }

  const androidMatch = sanitized.match(ANDROID_LINE_REGEX);
  if (androidMatch) {
    return {
      dateStr: androidMatch[1],
      timeStr: androidMatch[2],
      remainder: androidMatch[3],
      isIos: false,
    };
  }

  return null;
}

/**
 * Checks if content indicates media omitted
 */
export function checkHasMedia(content: string): boolean {
  return MEDIA_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Main parser function for WhatsApp exported chat text.
 */
export function parseWhatsAppChat(
  rawText: string,
  customDateOrder?: DateOrder,
): ParseResult {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return {
      messages: [],
      metadata: {
        totalMessages: 0,
        systemMessagesCount: 0,
        userMessagesCount: 0,
        participantCount: 0,
        participants: [],
        startDate: null,
        endDate: null,
      },
    };
  }

  const lines = rawText.split(/\r?\n/);

  // Step 1: Pre-scan sample dates to detect date format order (DMY vs MDY vs YMD)
  const sampleDateParts: Array<{
    part1: number;
    part2: number;
    part3: number;
  }> = [];
  for (const line of lines.slice(0, 100)) {
    const match = matchLineHeader(line);
    if (match) {
      const parts = cleanWhitespace(match.dateStr).match(
        /^(\d{1,4})[./\-](\d{1,2})[./\-](\d{1,4})$/,
      );
      if (parts) {
        sampleDateParts.push({
          part1: parseInt(parts[1], 10),
          part2: parseInt(parts[2], 10),
          part3: parseInt(parts[3], 10),
        });
      }
    }
  }

  const dateOrder: DateOrder =
    customDateOrder || detectDateOrder(sampleDateParts);

  // Step 2: Line-by-line parsing with multiline buffering
  const messages: ParsedMessage[] = [];
  let detectedGroupName: string | undefined;

  interface CurrentMessageBuffer {
    rawTimestamp: string;
    timestamp: string;
    sender: string;
    contentLines: string[];
    isSystem: boolean;
  }

  let currentBuffer: CurrentMessageBuffer | null = null;
  let messageCounter = 0;

  function commitBuffer() {
    if (!currentBuffer) return;

    messageCounter++;
    const fullContent = currentBuffer.contentLines.join("\n").trim();
    const hasMedia = checkHasMedia(fullContent);

    // Try extracting group name if it's a system message
    if (currentBuffer.isSystem) {
      for (const pattern of GROUP_SUBJECT_PATTERNS) {
        const match = fullContent.match(pattern);
        if (match && match[1]) {
          detectedGroupName = match[1].trim();
          break;
        }
      }
    }

    messages.push({
      id: `msg-${messageCounter}`,
      rawTimestamp: currentBuffer.rawTimestamp,
      timestamp: currentBuffer.timestamp,
      sender: currentBuffer.sender,
      content: fullContent,
      isSystem: currentBuffer.isSystem,
      hasMedia,
    });

    currentBuffer = null;
  }

  for (const line of lines) {
    const header = matchLineHeader(line);

    if (header) {
      // Commit previous message before starting new one
      commitBuffer();

      const rawTimestamp = `${header.dateStr}, ${header.timeStr}`;
      const normalizedTimestamp =
        normalizeWhatsAppDateTime(header.dateStr, header.timeStr, dateOrder) ||
        new Date().toISOString();

      const colonIndex = header.remainder.indexOf(": ");

      let sender: string;
      let initialContent: string;
      let isSystem: boolean;

      if (colonIndex !== -1) {
        sender = header.remainder.substring(0, colonIndex).trim();
        initialContent = header.remainder.substring(colonIndex + 2);
        isSystem = false;
      } else {
        sender = "System";
        initialContent = header.remainder.trim();
        isSystem = true;
      }

      currentBuffer = {
        rawTimestamp,
        timestamp: normalizedTimestamp,
        sender,
        contentLines: [initialContent],
        isSystem,
      };
    } else if (currentBuffer) {
      // Continuation line for multiline message
      currentBuffer.contentLines.push(line);
    }
  }

  // Commit last remaining buffer
  commitBuffer();

  // Step 3: Compute chat metadata
  const participantsSet = new Set<string>();
  let systemCount = 0;
  let userCount = 0;
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.isSystem) {
      systemCount++;
    } else {
      userCount++;
      if (msg.sender) {
        participantsSet.add(msg.sender);
      }
    }

    if (i === 0) {
      startDate = msg.timestamp;
    }
    endDate = msg.timestamp;
  }

  const participants = Array.from(participantsSet).sort();

  const metadata: ChatMetadata = {
    groupName: detectedGroupName,
    totalMessages: messages.length,
    systemMessagesCount: systemCount,
    userMessagesCount: userCount,
    participantCount: participants.length,
    participants,
    startDate,
    endDate,
  };

  return {
    messages,
    metadata,
  };
}
