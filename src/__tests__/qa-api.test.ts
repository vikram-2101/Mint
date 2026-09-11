import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/ask/route";
import { NextRequest } from "next/server";
import { ANDROID_24H_CHAT } from "./fixtures/chats";
import * as qaServiceModule from "@/lib/llm/qa-service";
import { AskChatResponse } from "@/types/qa";

const MOCK_QA_RESPONSE: AskChatResponse = {
  answer:
    "Visitor parking permits start from September 1st, and residents must register at security before Friday.",
  sources: [
    {
      id: "msg-7",
      timestamp: "2026-08-15T10:30:00.000Z",
      sender: "Alice",
      content:
        "We have decided that visitor permits will start from September 1st.",
    },
  ],
  queryMetadata: {
    retrievedCount: 5,
    totalChatMessages: 10,
    durationMs: 120,
  },
};

describe("Ask Chat API Route (/api/ask)", () => {
  it("should answer question using rawText WhatsApp export", async () => {
    vi.spyOn(qaServiceModule, "answerChatQuestion").mockResolvedValue(
      MOCK_QA_RESPONSE,
    );

    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        question: "What was decided about visitor parking?",
        rawText: ANDROID_24H_CHAT,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.answer).toBe(MOCK_QA_RESPONSE.answer);
    expect(json.sources.length).toBe(1);
    expect(json.sources[0].id).toBe("msg-7");
  });

  it("should return 400 when question is empty", async () => {
    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        question: "",
        rawText: ANDROID_24H_CHAT,
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 400 when neither messages nor rawText is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/ask", {
      method: "POST",
      body: JSON.stringify({
        question: "Is anyone home?",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("No chat messages provided");
  });
});
