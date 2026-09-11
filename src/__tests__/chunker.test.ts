import { describe, it, expect } from "vitest";
import {
  chunkMessages,
  formatMessageLine,
  formatMessagesForPrompt,
  estimateTokenCount,
} from "@/lib/chunking/chat-chunker";
import { ParsedMessage } from "@/types/chat";

function createMockMessages(count: number): ParsedMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i + 1}`,
    rawTimestamp: "15/08/2026, 10:00",
    timestamp: new Date(2026, 7, 15, 10, i, 0).toISOString(),
    sender: i % 2 === 0 ? "Alice" : "Bob",
    content: `This is message number ${i + 1} with some interesting discussion.`,
    isSystem: false,
    hasMedia: false,
  }));
}

describe("Chat Chunker", () => {
  it("should format single message line correctly", () => {
    const msg: ParsedMessage = {
      id: "msg-42",
      rawTimestamp: "15/08/2026, 14:30",
      timestamp: "2026-08-15T14:30:00.000Z",
      sender: "Alice",
      content: "Hello world!",
      isSystem: false,
      hasMedia: false,
    };

    const line = formatMessageLine(msg);
    expect(line).toBe("[ID: msg-42] [2026-08-15 14:30:00] Alice: Hello world!");
  });

  it("should format system message line correctly", () => {
    const msg: ParsedMessage = {
      id: "msg-1",
      rawTimestamp: "15/08/2026, 10:00",
      timestamp: "2026-08-15T10:00:00.000Z",
      sender: "System",
      content: "Messages are encrypted",
      isSystem: true,
      hasMedia: false,
    };

    const line = formatMessageLine(msg);
    expect(line).toBe(
      "[ID: msg-1] [2026-08-15 10:00:00] [System]: Messages are encrypted",
    );
  });

  it("should estimate token count realistically", () => {
    const text = "1234567890123456"; // 16 chars
    expect(estimateTokenCount(text)).toBe(4);
    expect(estimateTokenCount("")).toBe(0);
  });

  it("should return empty chunks for empty message array", () => {
    expect(chunkMessages([])).toEqual([]);
  });

  it("should return a single chunk if message count is small", () => {
    const messages = createMockMessages(50);
    const chunks = chunkMessages(messages, { maxMessagesPerChunk: 100 });

    expect(chunks.length).toBe(1);
    expect(chunks[0].messages.length).toBe(50);
    expect(chunks[0].startMessageId).toBe("msg-1");
    expect(chunks[0].endMessageId).toBe("msg-50");
  });

  it("should create multiple overlapping chunks when exceeding message limits", () => {
    const messages = createMockMessages(100);
    // 100 messages with chunk size 40 and overlap 10
    const chunks = chunkMessages(messages, {
      maxMessagesPerChunk: 40,
      overlapMessages: 10,
    });

    expect(chunks.length).toBeGreaterThan(1);
    // Chunk 0: msgs 1 to 40
    expect(chunks[0].startMessageId).toBe("msg-1");
    expect(chunks[0].endMessageId).toBe("msg-40");

    // Chunk 1 starts at index 30 (40 - 10 overlap) -> msg-31
    expect(chunks[1].startMessageId).toBe("msg-31");

    // All chunks should have valid formattedText
    for (const chunk of chunks) {
      expect(chunk.formattedText.length).toBeGreaterThan(0);
      expect(chunk.estimatedTokens).toBeGreaterThan(0);
    }
  });

  it("should respect maxTokensPerChunk constraints", () => {
    const messages = createMockMessages(20);
    // Force tiny token budget
    const chunks = chunkMessages(messages, {
      maxMessagesPerChunk: 100,
      maxTokensPerChunk: 100, // Very small token budget
      overlapMessages: 2,
    });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.estimatedTokens).toBeLessThanOrEqual(250);
    }
  });
});
