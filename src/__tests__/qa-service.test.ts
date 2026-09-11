import { describe, it, expect, vi } from "vitest";
import { buildQAPrompt } from "@/lib/llm/qa-prompts";
import { answerChatQuestion } from "@/lib/llm/qa-service";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { ANDROID_24H_CHAT } from "./fixtures/chats";
import { LLMAskOutput } from "@/types/qa";

describe("Q&A Prompt Builder", () => {
  const parsed = parseWhatsAppChat(ANDROID_24H_CHAT);

  it("should construct prompt with strict rules and excerpt", () => {
    const prompt = buildQAPrompt(
      "What was decided about visitor parking?",
      parsed.messages,
    );
    expect(prompt).toContain("STRICT GROUNDING & ACCURACY RULES");
    expect(prompt).toContain("CONVERSATION EXCERPT:");
    expect(prompt).toContain(
      "USER QUESTION:\nWhat was decided about visitor parking?",
    );
  });

  it("should include conversation history when provided", () => {
    const history = [
      { role: "user" as const, content: "Who created the group?" },
      { role: "assistant" as const, content: "Alice created the group." },
    ];
    const prompt = buildQAPrompt(
      "What else did she say?",
      parsed.messages,
      history,
    );
    expect(prompt).toContain("RECENT Q&A HISTORY:");
    expect(prompt).toContain("User: Who created the group?");
    expect(prompt).toContain("Assistant: Alice created the group.");
  });
});

describe("Q&A Service & Source Validation Guard", () => {
  const parsed = parseWhatsAppChat(ANDROID_24H_CHAT);

  it("should return validated answer with verified verbatim source messages", async () => {
    const mockOutput: LLMAskOutput = {
      answer:
        "Visitor permits will become mandatory starting September 1st, and residents must register at the security desk before Friday.",
      sources: [{ messageId: "msg-7" }],
    };

    const mockGenerate = vi.fn().mockResolvedValue(JSON.stringify(mockOutput));

    const response = await answerChatQuestion(
      parsed.messages,
      "What was decided about visitor parking permits?",
      {
        customGenerateFn: mockGenerate,
      },
    );

    expect(response.answer).toBe(mockOutput.answer);
    expect(response.sources.length).toBe(1);
    expect(response.sources[0].id).toBe("msg-7");
    expect(response.sources[0].sender).toBe("Alice");
    expect(response.sources[0].content).toContain(
      "visitor permits will start from September 1st",
    );
    expect(response.queryMetadata?.retrievedCount).toBeGreaterThan(0);
  });

  it("should discard hallucinated message IDs that do not exist in the chat", async () => {
    const mockOutput: LLMAskOutput = {
      answer: "A new rule was established.",
      sources: [
        { messageId: "msg-7" }, // Valid ID
        { messageId: "msg-9999" }, // Hallucinated ID
      ],
    };

    const mockGenerate = vi.fn().mockResolvedValue(JSON.stringify(mockOutput));

    const response = await answerChatQuestion(
      parsed.messages,
      "What are the rules?",
      {
        customGenerateFn: mockGenerate,
      },
    );

    expect(response.sources.length).toBe(1);
    expect(response.sources[0].id).toBe("msg-7");
    // msg-9999 must not be in sources
    expect(response.sources.some((s) => s.id === "msg-9999")).toBe(false);
  });

  it("should handle insufficient evidence answers with empty source lists", async () => {
    const mockOutput: LLMAskOutput = {
      answer:
        "I couldn't find enough information in this conversation to determine who will cater the event.",
      sources: [],
    };

    const mockGenerate = vi.fn().mockResolvedValue(JSON.stringify(mockOutput));

    const response = await answerChatQuestion(
      parsed.messages,
      "Who is catering the annual party?",
      {
        customGenerateFn: mockGenerate,
      },
    );

    expect(response.answer).toContain("couldn't find enough information");
    expect(response.sources).toEqual([]);
  });

  it("should throw error on empty question", async () => {
    await expect(answerChatQuestion(parsed.messages, "")).rejects.toThrow(
      "Question cannot be empty.",
    );
  });
});
