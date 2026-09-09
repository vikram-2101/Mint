import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { filterMessagesByDateRange } from "@/lib/parser/date-filter";
import { summarizeChat } from "@/lib/llm/summarizer";
import { buildMessageIndex } from "@/lib/traceability/indexer";
import { ChatMetadata } from "@/types/chat";

const SummarizeRequestSchema = z.object({
  rawText: z.string().min(1, "WhatsApp chat export text is required"),
  preset: z
    .enum(["last24h", "last7d", "last30d", "all", "custom"])
    .optional()
    .default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  apiKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedInput = SummarizeRequestSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsedInput.error.errors,
        },
        { status: 400 },
      );
    }

    const { rawText, preset, startDate, endDate, apiKey } = parsedInput.data;

    // Step 1: Ephemeral Parsing
    const parsedChat = parseWhatsAppChat(rawText);

    if (parsedChat.messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not parse any WhatsApp messages. Please ensure you uploaded a valid WhatsApp .txt export.",
        },
        { status: 400 },
      );
    }

    // Step 2: Date Filtering
    const filteredMessages = filterMessagesByDateRange(parsedChat.messages, {
      preset,
      startDate,
      endDate,
    });

    if (filteredMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No messages found for the selected date range. Try expanding your date filter.",
        },
        { status: 400 },
      );
    }

    // Compute metadata for the filtered subset
    const participantsSet = new Set<string>();
    let systemCount = 0;
    let userCount = 0;

    for (const msg of filteredMessages) {
      if (msg.isSystem) {
        systemCount++;
      } else {
        userCount++;
        if (msg.sender) participantsSet.add(msg.sender);
      }
    }

    const filteredMetadata: ChatMetadata = {
      groupName: parsedChat.metadata.groupName,
      totalMessages: filteredMessages.length,
      systemMessagesCount: systemCount,
      userMessagesCount: userCount,
      participantCount: participantsSet.size,
      participants: Array.from(participantsSet).sort(),
      startDate: filteredMessages[0]?.timestamp || null,
      endDate: filteredMessages[filteredMessages.length - 1]?.timestamp || null,
    };

    // Step 3: Summarize via LLM Pipeline
    const summary = await summarizeChat(filteredMessages, filteredMetadata, {
      apiKey,
    });

    // Step 4: Build message index for client-side citation resolution
    const messagesMap = buildMessageIndex(filteredMessages);

    return NextResponse.json({
      success: true,
      summary,
      messagesMap,
      totalAnalyzed: filteredMessages.length,
      totalOriginal: parsedChat.messages.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Summarization API error:", err.message);

    const isApiKeyError =
      err.message.includes("API key") ||
      err.message.includes("API_KEY") ||
      err.message.includes("GEMINI_API_KEY");

    const errorMessage = isApiKeyError
      ? "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in your environment or enter your API key in settings."
      : err.message || "An unexpected error occurred during summarization.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
