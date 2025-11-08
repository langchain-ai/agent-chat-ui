import { Thread } from "@langchain/langgraph-sdk";
import { getContentString } from "../../utils";

/**
 * Extracts display text from a thread
 * Priority: custom title metadata > first message content > thread ID
 */
export function getThreadDisplayText(thread: Thread): string {
  // Check for custom title in metadata first
  if (
    thread.metadata &&
    typeof thread.metadata === "object" &&
    "title" in thread.metadata
  ) {
    return String(thread.metadata.title);
  }

  // Try to get first message content
  if (
    typeof thread.values === "object" &&
    thread.values &&
    "messages" in thread.values &&
    Array.isArray(thread.values.messages) &&
    thread.values.messages?.length > 0
  ) {
    const firstMessage = thread.values.messages[0];
    return getContentString(firstMessage.content);
  }

  // Fallback to thread ID
  return thread.thread_id;
}

/**
 * Truncates text to a maximum length and adds ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}
