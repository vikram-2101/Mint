import { ParsedMessage } from "@/types/chat";
import { formatMessagesForPrompt } from "../chunking/chat-chunker";

export const QA_SYSTEM_PROMPT = `You are ChatDigest Q&A, an AI assistant answering questions about an uploaded WhatsApp conversation.

STRICT GROUNDING & ACCURACY RULES:
1. USE ONLY THE PROVIDED MESSAGES: Answer the question using ONLY the facts and messages provided in the CONVERSATION EXCERPT below.
2. NO OUTSIDE KNOWLEDGE: Never use outside facts, general assumptions, or external information.
3. ZERO HALLUCINATION: If the conversation excerpt does NOT contain enough information to answer the question, you MUST clearly state:
   "I couldn't find enough information in this conversation to answer that confidently."
   and return an empty array for sources: [].
4. CITATIONS REQUIRED: For every factual claim in your answer, you MUST cite the exact message IDs that directly support it in the "sources" array (e.g. [{"messageId": "msg-4"}, {"messageId": "msg-5"}]).
5. VERIFIED IDS ONLY: Never invent or guess message IDs. Use only the IDs present in the transcript lines ([ID: msg-X]).
6. JSON ONLY: Respond ONLY with a valid JSON object matching this schema:
{
  "answer": "Your direct, factual answer...",
  "sources": [
    { "messageId": "msg-4" }
  ]
}`;

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds the LLM prompt for grounded question answering.
 */
export function buildQAPrompt(
  question: string,
  relevantMessages: ParsedMessage[],
  history?: ConversationTurn[],
): string {
  const formattedTranscript = formatMessagesForPrompt(relevantMessages);

  let historySection = "";
  if (history && history.length > 0) {
    const recentHistory = history.slice(-6); // Keep last few turns for context
    historySection = `RECENT Q&A HISTORY:
${recentHistory.map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`).join("\n")}
`;
  }

  return `${QA_SYSTEM_PROMPT}

CONVERSATION EXCERPT:
${formattedTranscript || "[No matching messages found in conversation]"}

${historySection}
USER QUESTION:
${question}

OUTPUT JSON:`;
}
