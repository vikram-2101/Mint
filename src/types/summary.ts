import { z } from "zod";

export const SummaryDecisionSchema = z.object({
  text: z.string().describe("The decision, rule, or confirmed announcement"),
  sourceMessageIds: z
    .array(z.string())
    .describe(
      "Array of message IDs (e.g. ['msg-3', 'msg-4']) that support this decision",
    ),
});
export type SummaryDecision = z.infer<typeof SummaryDecisionSchema>;

export const SummaryIssueSchema = z.object({
  topic: z.string().describe("The issue, question, or problem raised"),
  details: z
    .string()
    .describe("Context and discussion points regarding the issue"),
  status: z
    .enum(["resolved", "unresolved", "in_discussion"])
    .describe("Current status based on chat messages"),
  sourceMessageIds: z
    .array(z.string())
    .describe("Array of message IDs supporting this issue"),
});
export type SummaryIssue = z.infer<typeof SummaryIssueSchema>;

export const SummaryEventDateSchema = z.object({
  date: z
    .string()
    .describe(
      "The upcoming date, deadline, meeting, or event timeframe mentioned",
    ),
  description: z
    .string()
    .describe(
      "Description of what is happening on that date or the requested action",
    ),
  sourceMessageIds: z
    .array(z.string())
    .describe("Array of message IDs where this date/action was mentioned"),
});
export type SummaryEventDate = z.infer<typeof SummaryEventDateSchema>;

export const KeyDiscussionSchema = z.object({
  topic: z.string().describe("Title/subject of the discussion topic"),
  summary: z
    .string()
    .describe(
      "Concise summary of what was discussed, opinions expressed, and conclusions",
    ),
  sourceMessageIds: z
    .array(z.string())
    .describe("Array of message IDs relevant to this discussion"),
});
export type KeyDiscussion = z.infer<typeof KeyDiscussionSchema>;

export const ChatDigestSummaryMetadataSchema = z.object({
  groupName: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  totalMessagesAnalyzed: z.number(),
  participantCount: z.number(),
});
export type ChatDigestSummaryMetadata = z.infer<
  typeof ChatDigestSummaryMetadataSchema
>;

export const ChatDigestSummarySchema = z.object({
  metadata: ChatDigestSummaryMetadataSchema,
  overview: z
    .string()
    .describe(
      "High-level executive overview in 2 to 4 clear sentences summarizing the main activity during this period",
    ),
  keyDiscussions: z
    .array(KeyDiscussionSchema)
    .describe("List of major discussion topics"),
  decisionsAndAnnouncements: z
    .array(SummaryDecisionSchema)
    .describe("Key decisions and important announcements made"),
  issuesAndQuestions: z
    .array(SummaryIssueSchema)
    .describe("Notable issues, queries, or complaints raised"),
  unresolvedTopics: z
    .array(z.string())
    .describe(
      "List of topics or open questions that were left unanswered or pending resolution",
    ),
  importantDatesAndActions: z
    .array(SummaryEventDateSchema)
    .describe(
      "Deadlines, meetings, events, or actionable items mentioned with dates",
    ),
});
export type ChatDigestSummary = z.infer<typeof ChatDigestSummarySchema>;

// Intermediate chunk summary schema for map-reduce
export const ChunkSummarySchema = z.object({
  chunkIndex: z.number(),
  mainTopics: z.array(z.string()),
  discussions: z.array(KeyDiscussionSchema),
  decisions: z.array(SummaryDecisionSchema),
  issues: z.array(SummaryIssueSchema),
  dates: z.array(SummaryEventDateSchema),
  unresolved: z.array(z.string()),
});
export type ChunkSummary = z.infer<typeof ChunkSummarySchema>;
