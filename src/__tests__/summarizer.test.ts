import { describe, it, expect, vi } from "vitest";
import {
  buildSinglePassSummaryPrompt,
  buildChunkSummaryPrompt,
  buildFinalSynthesisPrompt,
} from "@/lib/llm/prompts";
import {
  parseAndValidateSummary,
  parseAndValidateChunkSummary,
  summarizeChat,
} from "@/lib/llm/summarizer";
import { extractJsonFromResponse } from "@/lib/llm/gemini-client";
import { ChatMetadata, ParsedMessage } from "@/types/chat";
import { ChatDigestSummary, ChunkSummary } from "@/types/summary";

const MOCK_METADATA: ChatMetadata = {
  groupName: "Palm Grove Residents",
  totalMessages: 10,
  systemMessagesCount: 2,
  userMessagesCount: 8,
  participantCount: 4,
  participants: ["Alice", "Bob", "Charlie", "David"],
  startDate: "2026-08-15T10:00:00.000Z",
  endDate: "2026-08-16T09:20:00.000Z",
};

const MOCK_MESSAGES: ParsedMessage[] = Array.from({ length: 10 }, (_, i) => ({
  id: `msg-${i + 1}`,
  rawTimestamp: "15/08/2026, 10:00",
  timestamp: "2026-08-15T10:00:00.000Z",
  sender: i % 2 === 0 ? "Alice" : "Bob",
  content: `Message ${i + 1}`,
  isSystem: false,
  hasMedia: false,
}));

const VALID_SUMMARY_JSON: ChatDigestSummary = {
  metadata: {
    groupName: "Palm Grove Residents",
    dateRange: {
      start: "2026-08-15T10:00:00.000Z",
      end: "2026-08-16T09:20:00.000Z",
    },
    totalMessagesAnalyzed: 10,
    participantCount: 4,
  },
  overview:
    "Residents discussed building parking rules and gym opening hours. Alice confirmed new visitor policies starting September 1st.",
  keyDiscussions: [
    {
      topic: "Visitor Parking Permits",
      summary:
        "Discussion regarding parking regulations and permit requirements.",
      sourceMessageIds: ["msg-4", "msg-6"],
    },
  ],
  decisionsAndAnnouncements: [
    {
      text: "Visitor permits start on September 1st.",
      sourceMessageIds: ["msg-7"],
    },
  ],
  issuesAndQuestions: [
    {
      topic: "Visitor permit handling",
      details: "Who is responsible for permit distribution?",
      status: "resolved",
      sourceMessageIds: ["msg-4"],
    },
  ],
  unresolvedTopics: [],
  importantDatesAndActions: [
    {
      date: "September 1st",
      description: "Visitor permits take effect",
      sourceMessageIds: ["msg-7"],
    },
  ],
};

const VALID_CHUNK_SUMMARY: ChunkSummary = {
  chunkIndex: 0,
  mainTopics: ["Parking", "Guidelines"],
  discussions: [
    {
      topic: "Parking Rules",
      summary: "Alice shared new guidelines.",
      sourceMessageIds: ["msg-3"],
    },
  ],
  decisions: [
    {
      text: "Keep noise down after 10 PM",
      sourceMessageIds: ["msg-3"],
    },
  ],
  issues: [],
  dates: [],
  unresolved: [],
};

describe("LLM Prompts & Extractors", () => {
  it("should extract pure JSON from markdown code blocks", () => {
    const rawFenced = '```json\n{"foo": "bar"}\n```';
    expect(extractJsonFromResponse(rawFenced)).toBe('{"foo": "bar"}');

    const rawPlain = '{"hello": "world"}';
    expect(extractJsonFromResponse(rawPlain)).toBe('{"hello": "world"}');
  });

  it("should build single pass summary prompt containing metadata and instructions", () => {
    const prompt = buildSinglePassSummaryPrompt(
      "chat text here",
      MOCK_METADATA,
    );
    expect(prompt).toContain('Group Name: "Palm Grove Residents"');
    expect(prompt).toContain("sourceMessageIds");
    expect(prompt).toContain("CHAT TRANSCRIPT:\nchat text here");
  });

  it("should build chunk summary prompt and final synthesis prompt", () => {
    const chunkPrompt = buildChunkSummaryPrompt("chunk text", 0, 3);
    expect(chunkPrompt).toContain("CHUNK 1 of 3");

    const synthPrompt = buildFinalSynthesisPrompt(
      [VALID_CHUNK_SUMMARY],
      MOCK_METADATA,
    );
    expect(synthPrompt).toContain("INTERMEDIATE CHUNK SUMMARIES:");
  });
});

describe("Summary Schema Validation", () => {
  it("should validate and parse compliant summary JSON", () => {
    const parsed = parseAndValidateSummary(JSON.stringify(VALID_SUMMARY_JSON));
    expect(parsed.overview).toBe(VALID_SUMMARY_JSON.overview);
    expect(parsed.decisionsAndAnnouncements[0].sourceMessageIds).toEqual([
      "msg-7",
    ]);
  });

  it("should throw validation error on malformed summary JSON", () => {
    const invalidJson = JSON.stringify({
      overview: "Missing metadata and arrays",
    });
    expect(() => parseAndValidateSummary(invalidJson)).toThrow();
  });

  it("should validate and parse chunk summary", () => {
    const parsed = parseAndValidateChunkSummary(
      JSON.stringify(VALID_CHUNK_SUMMARY),
    );
    expect(parsed.chunkIndex).toBe(0);
    expect(parsed.mainTopics).toEqual(["Parking", "Guidelines"]);
  });
});

describe("Summarizer Pipeline Orchestrator", () => {
  it("should execute single-pass pipeline when message count fits in one chunk", async () => {
    const mockGenerate = vi
      .fn()
      .mockResolvedValue(JSON.stringify(VALID_SUMMARY_JSON));

    const result = await summarizeChat(MOCK_MESSAGES, MOCK_METADATA, {
      customGenerateFn: mockGenerate,
      chunkOptions: { maxMessagesPerChunk: 50 },
    });

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(result.overview).toContain("Residents discussed");
    expect(result.decisionsAndAnnouncements.length).toBe(1);
  });

  it("should execute hierarchical map-reduce pipeline when chunk count > 1", async () => {
    // 10 messages with chunk size 4 -> 3 chunks (chunk 0, chunk 1, chunk 2) + 1 reduce pass = 4 calls
    const mockGenerate = vi.fn().mockImplementation((prompt: string) => {
      if (prompt.includes("CHUNK TRANSCRIPT:")) {
        return Promise.resolve(JSON.stringify(VALID_CHUNK_SUMMARY));
      }
      return Promise.resolve(JSON.stringify(VALID_SUMMARY_JSON));
    });

    const result = await summarizeChat(MOCK_MESSAGES, MOCK_METADATA, {
      customGenerateFn: mockGenerate,
      chunkOptions: { maxMessagesPerChunk: 4, overlapMessages: 1 },
    });

    expect(mockGenerate).toHaveBeenCalledTimes(4); // 3 chunk maps + 1 reduce synthesis
    expect(result.overview).toBe(VALID_SUMMARY_JSON.overview);
  });

  it("should throw error when message array is empty", async () => {
    await expect(summarizeChat([], MOCK_METADATA)).rejects.toThrow(
      "No messages available to summarize.",
    );
  });
});
