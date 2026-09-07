import { ChatMetadata } from "@/types/chat";
import { ChunkSummary } from "@/types/summary";

export const SYSTEM_PROMPT = `You are ChatDigest, an expert AI assistant that analyzes and summarizes WhatsApp group chat conversations.
Your mission is to produce highly accurate, concise, factual, and actionable digests of group chat activity.

CRITICAL RULES:
1. STRICT FACTUAL ACCURACY: Summarize ONLY what was explicitly written in the chat. Never invent names, dates, or decisions.
2. SOURCE TRACEABILITY: For every key discussion, decision, issue, and date, you MUST provide the exact source message IDs in the 'sourceMessageIds' array (e.g. ["msg-3", "msg-12"]).
3. DISTINGUISH STATUS: Carefully distinguish between confirmed decisions/announcements vs unresolved questions or suggestions.
4. JSON FORMAT ONLY: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown code blocks or add conversational preamble.`;

/**
 * Builds prompt for single-pass summarization (used when conversation fits in a single chunk).
 */
export function buildSinglePassSummaryPrompt(
  formattedChat: string,
  metadata: ChatMetadata,
): string {
  const groupLabel = metadata.groupName
    ? `Group Name: "${metadata.groupName}"`
    : "Group Name: Not specified";
  const dateRangeLabel = `Date Range: ${metadata.startDate || "Unknown"} to ${metadata.endDate || "Unknown"}`;
  const participantsList =
    metadata.participants.length > 0
      ? metadata.participants.slice(0, 30).join(", ")
      : "Unknown";

  return `${SYSTEM_PROMPT}

CHAT METADATA:
- ${groupLabel}
- ${dateRangeLabel}
- Total Messages: ${metadata.totalMessages}
- Participants: ${participantsList}

CHAT TRANSCRIPT:
${formattedChat}

INSTRUCTIONS:
Analyze the chat transcript above and return a JSON object with this exact structure:
{
  "metadata": {
    "groupName": "${metadata.groupName || ""}",
    "dateRange": {
      "start": "${metadata.startDate || ""}",
      "end": "${metadata.endDate || ""}"
    },
    "totalMessagesAnalyzed": ${metadata.totalMessages},
    "participantCount": ${metadata.participantCount}
  },
  "overview": "2 to 4 clear sentences summarizing what major events/topics occurred.",
  "keyDiscussions": [
    {
      "topic": "Discussion Topic Title",
      "summary": "Concise summary of opinions, queries, or back-and-forth.",
      "sourceMessageIds": ["msg-1", "msg-2"]
    }
  ],
  "decisionsAndAnnouncements": [
    {
      "text": "Confirmed decision, policy change, or official announcement",
      "sourceMessageIds": ["msg-5"]
    }
  ],
  "issuesAndQuestions": [
    {
      "topic": "Issue or question title",
      "details": "Explanation of the problem or query",
      "status": "resolved" | "unresolved" | "in_discussion",
      "sourceMessageIds": ["msg-7"]
    }
  ],
  "unresolvedTopics": [
    "Unresolved question or pending discussion topic"
  ],
  "importantDatesAndActions": [
    {
      "date": "Date or timeframe mentioned (e.g. 'September 10', 'Next Tuesday at 2 PM')",
      "description": "What is scheduled or requested to happen",
      "sourceMessageIds": ["msg-9"]
    }
  ]
}`;
}

/**
 * Builds prompt for chunk-level analysis in multi-chunk processing.
 */
export function buildChunkSummaryPrompt(
  chunkFormattedText: string,
  chunkIndex: number,
  totalChunks: number,
): string {
  return `${SYSTEM_PROMPT}

You are analyzing CHUNK ${chunkIndex + 1} of ${totalChunks} from a large WhatsApp group chat export.

CHUNK TRANSCRIPT:
${chunkFormattedText}

INSTRUCTIONS:
Extract key information from this specific chunk and output a JSON object with this exact structure:
{
  "chunkIndex": ${chunkIndex},
  "mainTopics": ["Topic 1", "Topic 2"],
  "discussions": [
    {
      "topic": "Discussion Topic Title",
      "summary": "Concise summary of opinions or exchanges in this chunk",
      "sourceMessageIds": ["msg-101", "msg-102"]
    }
  ],
  "decisions": [
    {
      "text": "Confirmed decision or announcement made in this chunk",
      "sourceMessageIds": ["msg-105"]
    }
  ],
  "issues": [
    {
      "topic": "Issue or question raised",
      "details": "What happened or what was requested",
      "status": "resolved" | "unresolved" | "in_discussion",
      "sourceMessageIds": ["msg-110"]
    }
  ],
  "dates": [
    {
      "date": "Date or deadline mentioned",
      "description": "Event or required action",
      "sourceMessageIds": ["msg-115"]
    }
  ],
  "unresolved": [
    "Open question or pending matter from this chunk"
  ]
}`;
}

/**
 * Builds prompt for synthesizing intermediate chunk summaries into the final structured digest.
 */
export function buildFinalSynthesisPrompt(
  chunkSummaries: ChunkSummary[],
  metadata: ChatMetadata,
): string {
  const groupLabel = metadata.groupName
    ? `Group Name: "${metadata.groupName}"`
    : "Group Name: Not specified";
  const dateRangeLabel = `Date Range: ${metadata.startDate || "Unknown"} to ${metadata.endDate || "Unknown"}`;

  return `${SYSTEM_PROMPT}

You are synthesizing multiple chunk-level summaries into a single comprehensive, high-level digest.

CHAT METADATA:
- ${groupLabel}
- ${dateRangeLabel}
- Total Messages Analyzed: ${metadata.totalMessages}
- Participant Count: ${metadata.participantCount}

INTERMEDIATE CHUNK SUMMARIES:
${JSON.stringify(chunkSummaries, null, 2)}

INSTRUCTIONS:
Consolidate and synthesize the above chunk summaries into a cohesive, non-repetitive summary.
- Merge duplicate topics and discussions across chunks.
- Combine and preserve all genuine decisions, unresolved items, and important dates with their respective 'sourceMessageIds'.
- Provide a clear 2-4 sentence executive overview.

Output ONLY a JSON object conforming to this structure:
{
  "metadata": {
    "groupName": "${metadata.groupName || ""}",
    "dateRange": {
      "start": "${metadata.startDate || ""}",
      "end": "${metadata.endDate || ""}"
    },
    "totalMessagesAnalyzed": ${metadata.totalMessages},
    "participantCount": ${metadata.participantCount}
  },
  "overview": "2 to 4 clear sentences summarizing what major events/topics occurred across the entire period.",
  "keyDiscussions": [
    {
      "topic": "Consolidated Discussion Topic Title",
      "summary": "Comprehensive overview of the discussion across all chunks",
      "sourceMessageIds": ["msg-1", "msg-50"]
    }
  ],
  "decisionsAndAnnouncements": [
    {
      "text": "Confirmed decision or announcement",
      "sourceMessageIds": ["msg-15"]
    }
  ],
  "issuesAndQuestions": [
    {
      "topic": "Issue or question title",
      "details": "Explanation of the problem and its resolution state",
      "status": "resolved" | "unresolved" | "in_discussion",
      "sourceMessageIds": ["msg-25"]
    }
  ],
  "unresolvedTopics": [
    "Unresolved topic or question"
  ],
  "importantDatesAndActions": [
    {
      "date": "Date/deadline mentioned",
      "description": "Event or required action",
      "sourceMessageIds": ["msg-40"]
    }
  ]
}`;
}
