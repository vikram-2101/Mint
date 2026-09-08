import { ParsedMessage, ChatMetadata } from "@/types/chat";
import {
  ChatDigestSummary,
  ChatDigestSummarySchema,
  ChunkSummary,
  ChunkSummarySchema,
} from "@/types/summary";
import {
  chunkMessages,
  formatMessagesForPrompt,
  ChunkOptions,
} from "../chunking/chat-chunker";
import {
  buildSinglePassSummaryPrompt,
  buildChunkSummaryPrompt,
  buildFinalSynthesisPrompt,
} from "./prompts";
import { generateGeminiJson, extractJsonFromResponse } from "./gemini-client";

export type LLMGenerateFunction = (prompt: string) => Promise<string>;

export interface SummarizeOptions {
  apiKey?: string;
  modelName?: string;
  chunkOptions?: ChunkOptions;
  customGenerateFn?: LLMGenerateFunction;
}

/**
 * Validates and safely parses JSON into the expected schema.
 */
export function parseAndValidateSummary(jsonString: string): ChatDigestSummary {
  const sanitized = extractJsonFromResponse(jsonString);
  const parsedObj = JSON.parse(sanitized);
  return ChatDigestSummarySchema.parse(parsedObj);
}

/**
 * Validates and safely parses chunk summary JSON.
 */
export function parseAndValidateChunkSummary(jsonString: string): ChunkSummary {
  const sanitized = extractJsonFromResponse(jsonString);
  const parsedObj = JSON.parse(sanitized);
  return ChunkSummarySchema.parse(parsedObj);
}

/**
 * Main entry point for generating AI-powered structured summaries from parsed WhatsApp messages.
 * Automatically switches between single-pass and hierarchical multi-chunk processing.
 */
export async function summarizeChat(
  messages: ParsedMessage[],
  metadata: ChatMetadata,
  options?: SummarizeOptions,
): Promise<ChatDigestSummary> {
  if (!messages || messages.length === 0) {
    throw new Error("No messages available to summarize.");
  }

  const generateFn: LLMGenerateFunction =
    options?.customGenerateFn ||
    ((prompt: string) =>
      generateGeminiJson(prompt, {
        apiKey: options?.apiKey,
        modelName: options?.modelName,
      }));

  const chunks = chunkMessages(messages, options?.chunkOptions);

  if (chunks.length <= 1) {
    // Single-pass summarization
    const formattedChat = formatMessagesForPrompt(messages);
    const prompt = buildSinglePassSummaryPrompt(formattedChat, metadata);

    const rawResult = await generateFn(prompt);
    return parseAndValidateSummary(rawResult);
  }

  // Hierarchical Multi-Chunk Processing (Map-Reduce)
  // Step 1: Map - Process each chunk
  const chunkSummaries: ChunkSummary[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkPrompt = buildChunkSummaryPrompt(
      chunk.formattedText,
      i,
      chunks.length,
    );

    try {
      const rawChunkResult = await generateFn(chunkPrompt);
      const validatedChunk = parseAndValidateChunkSummary(rawChunkResult);
      chunkSummaries.push(validatedChunk);
    } catch (err) {
      console.error(
        `Warning: Failed to summarize chunk ${i + 1}/${chunks.length}:`,
        err,
      );
      // Fallback: minimal chunk summary to prevent pipeline failure
      chunkSummaries.push({
        chunkIndex: i,
        mainTopics: [
          `Discussion from ${chunk.startMessageId} to ${chunk.endMessageId}`,
        ],
        discussions: [],
        decisions: [],
        issues: [],
        dates: [],
        unresolved: [],
      });
    }
  }

  // Step 2: Reduce - Synthesize intermediate summaries into final summary
  const synthesisPrompt = buildFinalSynthesisPrompt(chunkSummaries, metadata);
  const rawFinalResult = await generateFn(synthesisPrompt);
  return parseAndValidateSummary(rawFinalResult);
}
