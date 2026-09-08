import { ParsedMessage } from "@/types/chat";
import {
  AskChatResponse,
  LLMAskOutputSchema,
  RetrievalOptions,
  SourceMessage,
} from "@/types/qa";
import { retrieveRelevantMessages } from "../retrieval/retriever";
import { buildQAPrompt, ConversationTurn } from "./qa-prompts";
import { generateGeminiJson, extractJsonFromResponse } from "./gemini-client";
import { buildMessageIndex } from "../traceability/indexer";

export type LLMAskGenerateFn = (prompt: string) => Promise<string>;

export interface AskChatServiceOptions {
  apiKey?: string;
  modelName?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  history?: ConversationTurn[];
  retrievalOptions?: RetrievalOptions;
  customGenerateFn?: LLMAskGenerateFn;
}

/**
 * Answers a natural language question grounded strictly in the provided chat messages.
 */
export async function answerChatQuestion(
  allMessages: ParsedMessage[],
  question: string,
  options?: AskChatServiceOptions,
): Promise<AskChatResponse> {
  const startTime = Date.now();

  if (!allMessages || allMessages.length === 0) {
    return {
      answer: "I couldn't find any messages in the uploaded conversation.",
      sources: [],
      queryMetadata: {
        retrievedCount: 0,
        totalChatMessages: 0,
        durationMs: Date.now() - startTime,
      },
    };
  }

  if (!question || question.trim().length === 0) {
    throw new Error("Question cannot be empty.");
  }

  // Step 1: Retrieve candidate messages
  const retrievalOpts: RetrievalOptions = {
    ...options?.retrievalOptions,
    dateRange: options?.dateRange || options?.retrievalOptions?.dateRange,
  };

  const relevantMessages = retrieveRelevantMessages(
    allMessages,
    question,
    retrievalOpts,
  );

  // If no messages at all match or exist
  if (relevantMessages.length === 0) {
    return {
      answer:
        "I couldn't find enough information in this conversation to answer that confidently.",
      sources: [],
      queryMetadata: {
        retrievedCount: 0,
        totalChatMessages: allMessages.length,
        durationMs: Date.now() - startTime,
      },
    };
  }

  // Step 2: Build Grounded Prompt
  const prompt = buildQAPrompt(question, relevantMessages, options?.history);

  // Step 3: Call LLM
  const generateFn: LLMAskGenerateFn =
    options?.customGenerateFn ||
    ((p: string) =>
      generateGeminiJson(p, {
        apiKey: options?.apiKey,
        modelName: options?.modelName,
      }));

  const rawJson = await generateFn(prompt);
  const sanitized = extractJsonFromResponse(rawJson);
  const parsedRaw = JSON.parse(sanitized);
  const validatedOutput = LLMAskOutputSchema.parse(parsedRaw);

  // Step 4: Source Validation Guard (verifies against actual chat index)
  const messageIndex = buildMessageIndex(allMessages);
  const verifiedSources: SourceMessage[] = [];
  const seenIds = new Set<string>();

  for (const src of validatedOutput.sources || []) {
    if (!src.messageId) continue;
    const cleanId = src.messageId.trim();

    if (messageIndex[cleanId] && !seenIds.has(cleanId)) {
      seenIds.add(cleanId);
      const actualMsg = messageIndex[cleanId];
      verifiedSources.push({
        id: actualMsg.id,
        timestamp: actualMsg.timestamp,
        sender: actualMsg.sender,
        content: actualMsg.content,
      });
    }
  }

  return {
    answer: validatedOutput.answer,
    sources: verifiedSources,
    queryMetadata: {
      retrievedCount: relevantMessages.length,
      totalChatMessages: allMessages.length,
      durationMs: Date.now() - startTime,
    },
  };
}
