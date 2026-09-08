import { ParsedMessage } from "@/types/chat";
import { RetrievalOptions, ScoredMessage } from "@/types/qa";
import {
  estimateTokenCount,
  formatMessageLine,
} from "../chunking/chat-chunker";
import { parseISO, isAfter, isBefore, isEqual } from "date-fns";

const STOP_WORDS = new Set([
  "a",
  "about",
  "above",
  "after",
  "again",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "below",
  "between",
  "both",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "during",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "mention",
  "mentioned",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "said",
  "same",
  "say",
  "see",
  "she",
  "should",
  "so",
  "some",
  "such",
  "tell",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
]);

const MONTH_NAMES: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

export const DEFAULT_RETRIEVAL_OPTIONS: Required<
  Omit<RetrievalOptions, "dateRange">
> = {
  maxResults: 20,
  maxTokens: 4000,
  includeContextNeighbors: true,
};

/**
 * Tokenizes text into lowercase words, removing punctuation and common stopwords.
 */
export function tokenizeQuery(text: string): string[] {
  if (!text) return [];
  const rawWords = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/);

  return rawWords.filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Extracts possible date/month hints from a natural language query (e.g. "August 16" -> "08-16").
 */
export function extractDateHints(query: string): string[] {
  const hints: string[] = [];
  const lower = query.toLowerCase();

  // Pattern: "August 15" or "Aug 15th"
  const monthDayMatch = lower.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
  );
  if (monthDayMatch) {
    const monthNum = MONTH_NAMES[monthDayMatch[1].toLowerCase()];
    const dayNum = parseInt(monthDayMatch[2], 10).toString().padStart(2, "0");
    if (monthNum && dayNum) {
      hints.push(`-${monthNum}-${dayNum}`);
    }
  }

  // Pattern: "15/08" or "15-08" or "2026-08-15"
  const numericDateMatch = lower.match(
    /\b(\d{1,4})[./\-](\d{1,2})(?:[./\-](\d{1,4}))?\b/,
  );
  if (numericDateMatch) {
    hints.push(numericDateMatch[0]);
  }

  return hints;
}

/**
 * Scores a single message based on keyword matching, phrase co-occurrence, and sender matches.
 */
export function scoreMessage(
  message: ParsedMessage,
  queryTokens: string[],
  rawQuery: string,
  dateHints: string[],
): ScoredMessage {
  let score = 0;
  const matchReasons: string[] = [];
  const lowerContent = message.content.toLowerCase();
  const lowerSender = message.sender.toLowerCase();

  // 1. Keyword match scoring
  for (const token of queryTokens) {
    if (lowerContent.includes(token)) {
      score += 3;
      matchReasons.push(`content-token:${token}`);
    }
    if (lowerSender.includes(token)) {
      score += 5; // Direct sender name query (e.g. "What did Alice say?")
      matchReasons.push(`sender-match:${token}`);
    }
  }

  // 2. Exact phrase bonus (if query has 2+ words)
  const cleanedQuery = rawQuery.trim().toLowerCase();
  if (queryTokens.length >= 2 && lowerContent.includes(cleanedQuery)) {
    score += 10;
    matchReasons.push("exact-phrase-match");
  }

  // 3. Consecutive 2-word phrase matches
  for (let i = 0; i < queryTokens.length - 1; i++) {
    const bigram = `${queryTokens[i]} ${queryTokens[i + 1]}`;
    if (lowerContent.includes(bigram)) {
      score += 4;
      matchReasons.push(`bigram-match:${bigram}`);
    }
  }

  // 4. Date hint bonus
  for (const hint of dateHints) {
    if (
      message.timestamp.includes(hint) ||
      message.rawTimestamp.includes(hint)
    ) {
      score += 8;
      matchReasons.push(`date-hint:${hint}`);
    }
  }

  return {
    message,
    score,
    matchReasons,
  };
}

/**
 * Retrieves the most relevant messages for a natural-language question.
 */
export function retrieveRelevantMessages(
  messages: ParsedMessage[],
  query: string,
  customOptions?: RetrievalOptions,
): ParsedMessage[] {
  if (
    !messages ||
    messages.length === 0 ||
    !query ||
    query.trim().length === 0
  ) {
    return [];
  }

  const options = {
    ...DEFAULT_RETRIEVAL_OPTIONS,
    ...customOptions,
  };

  // Step 1: Optional Date Range Pre-filter
  let candidatePool = messages;
  if (customOptions?.dateRange?.start || customOptions?.dateRange?.end) {
    const startBound = customOptions.dateRange.start
      ? parseISO(customOptions.dateRange.start)
      : null;
    const endBound = customOptions.dateRange.end
      ? parseISO(customOptions.dateRange.end)
      : null;

    candidatePool = messages.filter((msg) => {
      try {
        const msgDate = parseISO(msg.timestamp);
        if (
          startBound &&
          isBefore(msgDate, startBound) &&
          !isEqual(msgDate, startBound)
        )
          return false;
        if (
          endBound &&
          isAfter(msgDate, endBound) &&
          !isEqual(msgDate, endBound)
        )
          return false;
        return true;
      } catch {
        return true;
      }
    });
  }

  const queryTokens = tokenizeQuery(query);
  const dateHints = extractDateHints(query);

  // If query consists solely of stopwords, fallback to raw words
  const effectiveTokens =
    queryTokens.length > 0
      ? queryTokens
      : query
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 0);

  // Step 2: Score all candidate messages
  const scoredMessages: ScoredMessage[] = candidatePool
    .map((msg) => scoreMessage(msg, effectiveTokens, query, dateHints))
    .filter((scored) => scored.score > 0);

  // Sort descending by score
  scoredMessages.sort((a, b) => b.score - a.score);

  // If no direct keyword matches were found, fallback to recent conversation sample
  if (scoredMessages.length === 0) {
    const fallbackCount = Math.min(options.maxResults, candidatePool.length);
    return candidatePool.slice(-fallbackCount);
  }

  // Step 3: Collect top scored messages and expand with context neighbors if requested
  const messageIndexMap = new Map<string, number>();
  messages.forEach((msg, idx) => messageIndexMap.set(msg.id, idx));

  const selectedIndices = new Set<number>();
  const topHits = scoredMessages.slice(0, options.maxResults);

  for (const hit of topHits) {
    const origIdx = messageIndexMap.get(hit.message.id);
    if (origIdx !== undefined) {
      selectedIndices.add(origIdx);

      if (options.includeContextNeighbors) {
        // Include previous message for conversational context
        if (origIdx > 0) selectedIndices.add(origIdx - 1);
        // Include next message for response context
        if (origIdx < messages.length - 1) selectedIndices.add(origIdx + 1);
      }
    }
  }

  // Step 4: Sort chronologically and apply token/message budget constraints
  const chronologicalIndices = Array.from(selectedIndices).sort(
    (a, b) => a - b,
  );

  const finalMessages: ParsedMessage[] = [];
  let totalEstimatedTokens = 0;

  for (const idx of chronologicalIndices) {
    const msg = messages[idx];
    const msgTokens = estimateTokenCount(formatMessageLine(msg));

    if (
      finalMessages.length >= options.maxResults ||
      totalEstimatedTokens + msgTokens > options.maxTokens
    ) {
      // If we already have a reasonable set, break
      if (finalMessages.length >= 5) {
        break;
      }
    }

    finalMessages.push(msg);
    totalEstimatedTokens += msgTokens;
  }

  return finalMessages;
}
