import { ParsedMessage } from "@/types/chat";

/**
 * Builds a fast lookup map for messages by their IDs.
 */
export function buildMessageIndex(
  messages: ParsedMessage[],
): Record<string, ParsedMessage> {
  const index: Record<string, ParsedMessage> = {};
  for (const msg of messages) {
    index[msg.id] = msg;
  }
  return index;
}

/**
 * Resolves an array of message IDs into full ParsedMessage objects.
 */
export function resolveSourceMessages(
  sourceIds: string[],
  messageIndex: Record<string, ParsedMessage>,
): ParsedMessage[] {
  if (!sourceIds || sourceIds.length === 0) return [];
  const resolved: ParsedMessage[] = [];
  for (const id of sourceIds) {
    if (messageIndex[id]) {
      resolved.push(messageIndex[id]);
    }
  }
  return resolved;
}
