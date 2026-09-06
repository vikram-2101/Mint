import { z } from "zod";

export const ParsedMessageSchema = z.object({
  id: z.string(),
  rawTimestamp: z.string(),
  timestamp: z.string(), // ISO 8601 string: YYYY-MM-DDTHH:mm:ss.sssZ
  sender: z.string(),
  content: z.string(),
  isSystem: z.boolean(),
  hasMedia: z.boolean(),
});

export type ParsedMessage = z.infer<typeof ParsedMessageSchema>;

export const ChatMetadataSchema = z.object({
  groupName: z.string().optional(),
  totalMessages: z.number(),
  systemMessagesCount: z.number(),
  userMessagesCount: z.number(),
  participantCount: z.number(),
  participants: z.array(z.string()),
  startDate: z.string().nullable(), // ISO 8601 string
  endDate: z.string().nullable(), // ISO 8601 string
});

export type ChatMetadata = z.infer<typeof ChatMetadataSchema>;

export const ParseResultSchema = z.object({
  messages: z.array(ParsedMessageSchema),
  metadata: ChatMetadataSchema,
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

export type DateFilterPreset =
  | "last24h"
  | "last7d"
  | "last30d"
  | "custom"
  | "all";

export interface DateFilterOptions {
  preset?: DateFilterPreset;
  startDate?: string | Date;
  endDate?: string | Date;
}
