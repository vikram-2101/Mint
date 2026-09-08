import { ParsedMessage } from "@/types/chat";

export interface ChunkOptions {
  maxMessagesPerChunk?: number;
  maxTokensPerChunk?: number;
  overlapMessages?: number;
}

export interface ChatChunk {
  index: number;
  messages: ParsedMessage[];
  formattedText: string;
  startMessageId: string;
  endMessageId: string;
  startTimestamp: string;
  endTimestamp: string;
  estimatedTokens: number;
}

export const DEFAULT_CHUNK_OPTIONS: Required<ChunkOptions> = {
  maxMessagesPerChunk: 350,
  maxTokensPerChunk: 16000,
  overlapMessages: 20,
};

/**
 * Estimates token count for a string using standard ~4 characters/token heuristic.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Formats a single parsed message for LLM prompt ingestion, embedding message ID for citation traceability.
 */
export function formatMessageLine(msg: ParsedMessage): string {
  const timeFormatted = msg.timestamp.replace("T", " ").replace(/\.000Z$/, "");
  const senderFormatted = msg.isSystem ? "[System]" : msg.sender;
  return `[ID: ${msg.id}] [${timeFormatted}] ${senderFormatted}: ${msg.content}`;
}

/**
 * Formats an array of messages into a single prompt string.
 */
export function formatMessagesForPrompt(messages: ParsedMessage[]): string {
  return messages.map(formatMessageLine).join("\n");
}

/**
 * Splits parsed messages into overlapping chunks if conversation exceeds chunk boundaries.
 */
export function chunkMessages(
  messages: ParsedMessage[],
  customOptions?: ChunkOptions,
): ChatChunk[] {
  if (!messages || messages.length === 0) {
    return [];
  }

  const options: Required<ChunkOptions> = {
    ...DEFAULT_CHUNK_OPTIONS,
    ...customOptions,
  };

  const chunks: ChatChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < messages.length) {
    const chunkMsgs: ParsedMessage[] = [];
    let currentTokens = 0;
    let i = startIndex;

    while (i < messages.length) {
      const msg = messages[i];
      const msgFormatted = formatMessageLine(msg);
      const msgTokens = estimateTokenCount(msgFormatted);

      // Check if adding this message exceeds either the message or token limit
      if (
        chunkMsgs.length > 0 &&
        (chunkMsgs.length >= options.maxMessagesPerChunk ||
          currentTokens + msgTokens > options.maxTokensPerChunk)
      ) {
        break;
      }

      chunkMsgs.push(msg);
      currentTokens += msgTokens;
      i++;
    }

    if (chunkMsgs.length === 0) {
      // Safety guard for an unusually huge single message
      chunkMsgs.push(messages[startIndex]);
      i = startIndex + 1;
    }

    const firstMsg = chunkMsgs[0];
    const lastMsg = chunkMsgs[chunkMsgs.length - 1];
    const formattedText = formatMessagesForPrompt(chunkMsgs);

    chunks.push({
      index: chunkIndex,
      messages: chunkMsgs,
      formattedText,
      startMessageId: firstMsg.id,
      endMessageId: lastMsg.id,
      startTimestamp: firstMsg.timestamp,
      endTimestamp: lastMsg.timestamp,
      estimatedTokens: estimateTokenCount(formattedText),
    });

    chunkIndex++;

    // If we've reached the end of the messages, break
    if (i >= messages.length) {
      break;
    }

    // Advance startIndex by chunk size minus overlap
    const step = Math.max(1, chunkMsgs.length - options.overlapMessages);
    startIndex += step;
  }

  return chunks;
}
