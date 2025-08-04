import { v4 as uuidv4 } from "uuid";
import { Message, ToolMessage } from "@langchain/langgraph-sdk";

export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";

export function ensureToolCallsHaveResponses(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.type === "tool" && !message.content) {
      return {
        ...message,
        content: "Tool call completed",
      };
    }
    return message;
  });
}

/**
 * Preserves all messages (main graph and subgraph) with duplicate handling
 * @param existingMessages - Current messages array
 * @param newMessages - New messages to merge
 * @returns Merged messages array with duplicates handled
 */
export function preserveMessagesWithDuplicates(
  existingMessages: Message[],
  newMessages: Message[],
): Message[] {
  // Create a map of existing messages by ID for quick lookup
  const existingMessagesMap = new Map<string, Message>();

  existingMessages.forEach((msg) => {
    if (msg.id) {
      existingMessagesMap.set(msg.id, msg);
    }
  });

  // Merge new messages, updating duplicates with latest ones
  newMessages.forEach((newMsg) => {
    if (newMsg.id) {
      existingMessagesMap.set(newMsg.id, newMsg);
    } else {
      // If no ID, append to the end with a temporary ID
      existingMessagesMap.set(`temp-${Date.now()}-${Math.random()}`, newMsg);
    }
  });

  // Convert back to array
  return Array.from(existingMessagesMap.values());
}
