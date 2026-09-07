import { z } from "zod";
import { ParsedMessageSchema } from "./chat";

export const SourceMessageSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  sender: z.string(),
  content: z.string(),
});
export type SourceMessage = z.infer<typeof SourceMessageSchema>;

export const LLMAskSourceSchema = z.object({
  messageId: z
    .string()
    .describe("The exact message ID supporting this claim (e.g. 'msg-4')"),
});
export type LLMAskSource = z.infer<typeof LLMAskSourceSchema>;

export const LLMAskOutputSchema = z.object({
  answer: z
    .string()
    .describe(
      "Direct, factual answer grounded strictly in the provided messages. State clearly if information is insufficient.",
    ),
  sources: z
    .array(LLMAskSourceSchema)
    .describe("List of supporting message IDs from the prompt"),
});
export type LLMAskOutput = z.infer<typeof LLMAskOutputSchema>;

export const AskChatRequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  messages: z.array(ParsedMessageSchema).optional(),
  rawText: z.string().optional(),
  dateRange: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  apiKey: z.string().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
});
export type AskChatRequest = z.infer<typeof AskChatRequestSchema>;

export const AskChatResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(SourceMessageSchema),
  queryMetadata: z
    .object({
      retrievedCount: z.number(),
      totalChatMessages: z.number(),
      durationMs: z.number(),
    })
    .optional(),
});
export type AskChatResponse = z.infer<typeof AskChatResponseSchema>;

export interface RetrievalOptions {
  maxResults?: number;
  maxTokens?: number;
  includeContextNeighbors?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface ScoredMessage {
  message: z.infer<typeof ParsedMessageSchema>;
  score: number;
  matchReasons: string[];
}
