import { describe, it, expect } from "vitest";
import {
  tokenizeQuery,
  extractDateHints,
  scoreMessage,
  retrieveRelevantMessages,
} from "@/lib/retrieval/retriever";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { ANDROID_24H_CHAT } from "./fixtures/chats";

describe("Retrieval Tokenizer & Date Hints", () => {
  it("should tokenize and remove common stopwords", () => {
    const tokens = tokenizeQuery(
      "What did Alice say about the visitor parking permits?",
    );
    expect(tokens).toEqual(["alice", "visitor", "parking", "permits"]);
  });

  it("should handle punctuation and multiple spaces", () => {
    const tokens = tokenizeQuery("Elevator, Gym!! Maintenance -- 2026?");
    expect(tokens).toEqual(["elevator", "gym", "maintenance", "2026"]);
  });

  it("should extract month/day date hints", () => {
    const hints = extractDateHints("What happened on August 15?");
    expect(hints).toContain("-08-15");

    const hints2 = extractDateHints("Any updates on 16/08?");
    expect(hints2).toContain("16/08");
  });
});

describe("Message Scoring", () => {
  const parsed = parseWhatsAppChat(ANDROID_24H_CHAT);
  const parkingMsg = parsed.messages.find((m) =>
    m.content.includes("visitor permits will start"),
  )!;
  const gymMsg = parsed.messages.find((m) => m.content.includes("gym open"))!;

  it("should score matching keywords higher", () => {
    const query = "visitor parking permits";
    const tokens = tokenizeQuery(query);
    const scoredParking = scoreMessage(parkingMsg, tokens, query, []);
    const scoredGym = scoreMessage(gymMsg, tokens, query, []);

    expect(scoredParking.score).toBeGreaterThan(scoredGym.score);
    expect(scoredParking.matchReasons.length).toBeGreaterThan(0);
  });

  it("should give sender match bonus", () => {
    const query = "What did Alice say?";
    const tokens = tokenizeQuery(query);
    const scoredAlice = scoreMessage(parkingMsg, tokens, query, []); // Alice is sender
    const scoredGym = scoreMessage(gymMsg, tokens, query, []); // David is sender

    expect(scoredAlice.score).toBeGreaterThan(scoredGym.score);
    expect(scoredAlice.matchReasons).toContain("sender-match:alice");
  });
});

describe("Retrieve Relevant Messages", () => {
  const parsed = parseWhatsAppChat(ANDROID_24H_CHAT);

  it("should return empty array for empty query or empty messages", () => {
    expect(retrieveRelevantMessages([], "parking")).toEqual([]);
    expect(retrieveRelevantMessages(parsed.messages, "")).toEqual([]);
  });

  it("should retrieve messages relevant to parking", () => {
    const relevant = retrieveRelevantMessages(
      parsed.messages,
      "What was decided about visitor parking?",
    );
    expect(relevant.length).toBeGreaterThan(0);

    const hasParkingDecision = relevant.some((m) =>
      m.content.includes("visitor permits will start"),
    );
    expect(hasParkingDecision).toBe(true);
  });

  it("should retrieve gym messages when asked about gym hours", () => {
    const relevant = retrieveRelevantMessages(
      parsed.messages,
      "Is the gym open?",
    );
    expect(relevant.length).toBeGreaterThan(0);

    const hasGymAnswer = relevant.some((m) =>
      m.content.includes("6 AM to 10 PM"),
    );
    expect(hasGymAnswer).toBe(true);
  });

  it("should include neighboring context messages when requested", () => {
    const relevant = retrieveRelevantMessages(
      parsed.messages,
      "Is the gym open?",
      {
        includeContextNeighbors: true,
        maxResults: 10,
      },
    );

    // Both David's question ("is the gym open?") and Bob's answer ("6 AM to 10 PM") should be included
    const hasDavidQuestion = relevant.some(
      (m) => m.sender === "David" && m.content.includes("gym open"),
    );
    const hasBobAnswer = relevant.some(
      (m) => m.sender === "Bob" && m.content.includes("6 AM to 10 PM"),
    );

    expect(hasDavidQuestion).toBe(true);
    expect(hasBobAnswer).toBe(true);
  });

  it("should respect dateRange filters if provided", () => {
    const relevant = retrieveRelevantMessages(parsed.messages, "parking", {
      dateRange: {
        start: "2026-08-16T00:00:00.000Z",
        end: "2026-08-16T23:59:59.000Z",
      },
    });

    // All messages on August 15 should be excluded
    for (const msg of relevant) {
      expect(msg.timestamp.startsWith("2026-08-16")).toBe(true);
    }
  });
});
