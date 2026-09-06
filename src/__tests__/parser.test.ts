import { describe, it, expect } from "vitest";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { filterMessagesByDateRange } from "@/lib/parser/date-filter";
import { normalizeWhatsAppDateTime } from "@/lib/parser/date-normalizer";
import {
  ANDROID_24H_CHAT,
  ANDROID_12H_CHAT,
  IOS_24H_CHAT,
  IOS_12H_CHAT,
  EDGE_CASES_CHAT,
} from "./fixtures/chats";

describe("Date Normalizer", () => {
  it("should normalize DD/MM/YYYY 24h correctly", () => {
    const iso = normalizeWhatsAppDateTime("15/08/2026", "14:30", "DMY");
    expect(iso).toBe("2026-08-15T14:30:00.000Z");
  });

  it("should normalize MM/DD/YY 12h AM/PM correctly", () => {
    const isoPm = normalizeWhatsAppDateTime("8/15/26", "2:30 PM", "MDY");
    expect(isoPm).toBe("2026-08-15T14:30:00.000Z");

    const isoAm = normalizeWhatsAppDateTime("8/15/26", "12:15 AM", "MDY");
    expect(isoAm).toBe("2026-08-15T00:15:00.000Z");
  });

  it("should handle seconds in time string", () => {
    const iso = normalizeWhatsAppDateTime("15/08/2026", "14:30:45", "DMY");
    expect(iso).toBe("2026-08-15T14:30:45.000Z");
  });

  it("should return null for invalid date parts", () => {
    expect(normalizeWhatsAppDateTime("99/99/2026", "14:30")).toBeNull();
    expect(normalizeWhatsAppDateTime("15/08/2026", "25:00")).toBeNull();
  });
});

describe("WhatsApp Chat Parser", () => {
  describe("Android 24h Format", () => {
    const result = parseWhatsAppChat(ANDROID_24H_CHAT);

    it("should extract correct number of messages and metadata", () => {
      expect(result.messages.length).toBe(10);
      expect(result.metadata.totalMessages).toBe(10);
      expect(result.metadata.groupName).toBe("Palm Grove Residents");
      expect(result.metadata.participantCount).toBe(4); // Alice, Bob, Charlie, David
      expect(result.metadata.participants).toEqual([
        "Alice",
        "Bob",
        "Charlie",
        "David",
      ]);
    });

    it("should preserve multiline messages", () => {
      const welcomeMsg = result.messages.find(
        (m) =>
          m.sender === "Alice" && m.content.includes("building guidelines"),
      );
      expect(welcomeMsg).toBeDefined();
      expect(welcomeMsg?.content).toContain(
        "1. Keep noise down after 10 PM.\n2. Park only in designated slots.",
      );
    });

    it("should identify system messages and exclude from participants", () => {
      const encryptionMsg = result.messages[0];
      expect(encryptionMsg.isSystem).toBe(true);
      expect(encryptionMsg.sender).toBe("System");

      const joinMsg = result.messages[7];
      expect(joinMsg.isSystem).toBe(true);
      expect(joinMsg.content).toContain(
        "David joined using this group's invite link",
      );
    });

    it("should detect media omission placeholders", () => {
      const mediaMsg = result.messages.find((m) =>
        m.content.includes("<Media omitted>"),
      );
      expect(mediaMsg).toBeDefined();
      expect(mediaMsg?.hasMedia).toBe(true);
    });

    it("should assign sequential message IDs", () => {
      expect(result.messages[0].id).toBe("msg-1");
      expect(result.messages[1].id).toBe("msg-2");
      expect(result.messages[8].id).toBe("msg-9");
    });
  });

  describe("Android 12h Format with AM/PM", () => {
    const result = parseWhatsAppChat(ANDROID_12H_CHAT);

    it("should parse messages and participants correctly", () => {
      expect(result.metadata.participants).toEqual([
        "Emily",
        "John Doe",
        "Sarah Connor",
      ]);
      expect(result.metadata.participantCount).toBe(3);
      expect(result.metadata.totalMessages).toBe(6);
    });

    it("should normalize 12h PM time to 24h ISO format", () => {
      const pmMsg = result.messages.find((m) => m.content === "Thanks John.");
      expect(pmMsg).toBeDefined();
      expect(pmMsg?.timestamp).toContain("14:45:00");
    });
  });

  describe("iOS 24h Format", () => {
    const result = parseWhatsAppChat(IOS_24H_CHAT);

    it("should parse iOS bracketed format with seconds", () => {
      expect(result.metadata.participants).toEqual(["Dr. Evelyn", "Marcus"]);
      expect(result.metadata.participantCount).toBe(2);
      expect(result.messages.length).toBe(6);
    });

    it("should detect attached iOS media placeholders", () => {
      const mediaMsg = result.messages.find((m) => m.hasMedia);
      expect(mediaMsg).toBeDefined();
      expect(mediaMsg?.content).toContain(
        "<attached: 00000001-PHOTO-2026-08-15-14-35-22.jpg>",
      );
    });
  });

  describe("iOS 12h Format", () => {
    const result = parseWhatsAppChat(IOS_12H_CHAT);

    it("should parse iOS 12-hour timestamps with AM/PM", () => {
      expect(result.metadata.participants).toEqual(["Alex", "Jordan", "Sam"]);
      expect(result.messages.length).toBe(5);
    });

    it("should detect 'image omitted' placeholder", () => {
      const imageOmittedMsg = result.messages.find(
        (m) => m.content === "image omitted",
      );
      expect(imageOmittedMsg).toBeDefined();
      expect(imageOmittedMsg?.hasMedia).toBe(true);
    });
  });

  describe("Edge Cases & Malformed Inputs", () => {
    it("should handle empty or whitespace string safely", () => {
      const emptyResult = parseWhatsAppChat("");
      expect(emptyResult.messages).toEqual([]);
      expect(emptyResult.metadata.totalMessages).toBe(0);

      const wsResult = parseWhatsAppChat("   \n\n  \t  ");
      expect(wsResult.messages).toEqual([]);
      expect(wsResult.metadata.totalMessages).toBe(0);
    });

    it("should handle colons in message bodies correctly", () => {
      const result = parseWhatsAppChat(EDGE_CASES_CHAT);
      const urlMsg = result.messages.find(
        (m) =>
          m.sender === "Alice" && m.content.includes("https://example.com"),
      );
      expect(urlMsg).toBeDefined();
      expect(urlMsg?.content).toBe(
        "Note: The URL is https://example.com:8080/path?id=1:2:3",
      );

      const multiColonMsg = result.messages.find(
        (m) => m.sender === "Bob" && m.content.includes("everywhere!"),
      );
      expect(multiColonMsg).toBeDefined();
      expect(multiColonMsg?.content).toContain(
        "Multi:\nLine:\nWith:\nColons: everywhere!",
      );
    });

    it("should extract group name from subject change", () => {
      const result = parseWhatsAppChat(EDGE_CASES_CHAT);
      expect(result.metadata.groupName).toBe("Emergency Ops 2026");
    });
  });
});

describe("Date Range Filter", () => {
  const result = parseWhatsAppChat(ANDROID_24H_CHAT);

  it("should return all messages when preset is 'all'", () => {
    const filtered = filterMessagesByDateRange(result.messages, {
      preset: "all",
    });
    expect(filtered.length).toBe(result.messages.length);
  });

  it("should filter last 24h relative to latest message", () => {
    // Latest message is 16/08/2026 09:20. Last 24h should include messages from 15/08 10:00 onwards
    const filtered = filterMessagesByDateRange(result.messages, {
      preset: "last24h",
    });
    expect(filtered.length).toBeGreaterThan(0);
  });

  it("should filter custom date range accurately", () => {
    const filtered = filterMessagesByDateRange(result.messages, {
      preset: "custom",
      startDate: "2026-08-16T00:00:00.000Z",
      endDate: "2026-08-16T23:59:59.000Z",
    });

    expect(filtered.length).toBe(3); // The 3 messages from 16/08/2026
    expect(filtered.every((m) => m.timestamp.startsWith("2026-08-16"))).toBe(
      true,
    );
  });
});
