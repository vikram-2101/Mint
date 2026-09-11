import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/summarize/route";
import { NextRequest } from "next/server";
import { ANDROID_24H_CHAT } from "./fixtures/chats";
import * as summarizerModule from "@/lib/llm/summarizer";
import { ChatDigestSummary } from "@/types/summary";

const MOCK_SUMMARY: ChatDigestSummary = {
  metadata: {
    groupName: "Palm Grove Residents",
    dateRange: {
      start: "2026-08-15T10:00:00.000Z",
      end: "2026-08-16T09:20:00.000Z",
    },
    totalMessagesAnalyzed: 10,
    participantCount: 4,
  },
  overview: "Residents discussed parking rules and gym hours.",
  keyDiscussions: [
    {
      topic: "Visitor Permits",
      summary: "Permits required from Sept 1",
      sourceMessageIds: ["msg-7"],
    },
  ],
  decisionsAndAnnouncements: [
    {
      text: "Visitor permits start from September 1st.",
      sourceMessageIds: ["msg-7"],
    },
  ],
  issuesAndQuestions: [],
  unresolvedTopics: [],
  importantDatesAndActions: [
    {
      date: "September 1st",
      description: "Permits take effect",
      sourceMessageIds: ["msg-7"],
    },
  ],
};

describe("Summarize API Route (/api/summarize)", () => {
  it("should process valid WhatsApp export and return structured summary with message map", async () => {
    vi.spyOn(summarizerModule, "summarizeChat").mockResolvedValue(MOCK_SUMMARY);

    const req = new NextRequest("http://localhost:3000/api/summarize", {
      method: "POST",
      body: JSON.stringify({
        rawText: ANDROID_24H_CHAT,
        preset: "all",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.summary.overview).toBe(MOCK_SUMMARY.overview);
    expect(json.messagesMap["msg-7"]).toBeDefined();
    expect(json.messagesMap["msg-7"].content).toContain(
      "visitor permits will start from September 1st",
    );
  });

  it("should return 400 when rawText is empty or missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/summarize", {
      method: "POST",
      body: JSON.stringify({
        rawText: "",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("should return 400 when no messages match custom date filter range", async () => {
    const req = new NextRequest("http://localhost:3000/api/summarize", {
      method: "POST",
      body: JSON.stringify({
        rawText: ANDROID_24H_CHAT,
        preset: "custom",
        startDate: "2099-01-01T00:00:00.000Z",
        endDate: "2099-01-02T00:00:00.000Z",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain(
      "No messages found for the selected date range",
    );
  });
});
