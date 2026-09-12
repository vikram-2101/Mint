import { NextRequest, NextResponse } from "next/server";
import { AskChatRequestSchema } from "@/types/qa";
import { parseWhatsAppChat } from "@/lib/parser/whatsapp-parser";
import { answerChatQuestion } from "@/lib/llm/qa-service";
import { ParsedMessage } from "@/types/chat";

export const maxDuration = 60; // Max execution timeout for Vercel Serverless Functions (Hobby/Pro)
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedInput = AskChatRequestSchema.safeParse(body);

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

    const { question, messages, rawText, dateRange, apiKey, history } =
      parsedInput.data;

    // Step 1: Resolve messages from either pre-parsed array or raw text
    let chatMessages: ParsedMessage[] = [];

    if (messages && messages.length > 0) {
      chatMessages = messages;
    } else if (rawText && rawText.trim().length > 0) {
      const parsedChat = parseWhatsAppChat(rawText);
      chatMessages = parsedChat.messages;
    }

    if (chatMessages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No chat messages provided to answer this question. Please upload or provide chat data.",
        },
        { status: 400 },
      );
    }

    // Step 2: Answer question with Grounded Q&A Service
    const result = await answerChatQuestion(chatMessages, question, {
      apiKey,
      dateRange,
      history,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Ask Chat API error:", err.message);

    const isApiKeyError =
      err.message.includes("API key") ||
      err.message.includes("API_KEY") ||
      err.message.includes("GEMINI_API_KEY");

    const errorMessage = isApiKeyError
      ? "Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in your environment or enter your API key in settings."
      : err.message || "An error occurred while answering your question.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
