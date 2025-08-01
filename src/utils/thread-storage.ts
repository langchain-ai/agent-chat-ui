/**
 * Local storage utilities for thread persistence
 * Provides fallback storage when server-side thread storage fails
 */

import { Thread } from "@langchain/langgraph-sdk";

const STORAGE_KEY = "flyo:chat:threads";
const MAX_STORED_THREADS = 50;

export interface StoredThread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  assistant_id: string;
  user_id?: string;
  messages_count: number;
  first_message?: string;
}

/**
 * Get threads from local storage
 */
export function getStoredThreads(): StoredThread[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const threads = JSON.parse(stored) as StoredThread[];
    return threads.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch (error) {
    console.error("Failed to get stored threads:", error);
    return [];
  }
}

/**
 * Store a thread in local storage
 */
export function storeThread(thread: Partial<StoredThread>): void {
  try {
    if (typeof window === "undefined") return;
    
    const threads = getStoredThreads();
    const existingIndex = threads.findIndex(t => t.thread_id === thread.thread_id);
    
    const storedThread: StoredThread = {
      thread_id: thread.thread_id || "",
      created_at: thread.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      title: thread.title || thread.first_message || "New Chat",
      assistant_id: thread.assistant_id || "",
      user_id: thread.user_id,
      messages_count: thread.messages_count || 0,
      first_message: thread.first_message,
    };
    
    if (existingIndex >= 0) {
      threads[existingIndex] = storedThread;
    } else {
      threads.unshift(storedThread);
    }
    
    // Keep only the most recent threads
    const trimmedThreads = threads.slice(0, MAX_STORED_THREADS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedThreads));
    console.log("Thread stored locally:", storedThread.thread_id);
  } catch (error) {
    console.error("Failed to store thread:", error);
  }
}

/**
 * Update thread with message information
 */
export function updateThreadWithMessage(
  threadId: string, 
  messageContent: string, 
  assistantId: string,
  userId?: string
): void {
  try {
    const threads = getStoredThreads();
    const existingThread = threads.find(t => t.thread_id === threadId);
    
    if (existingThread) {
      existingThread.updated_at = new Date().toISOString();
      existingThread.messages_count += 1;
      if (!existingThread.first_message && messageContent) {
        existingThread.first_message = messageContent.substring(0, 100);
        existingThread.title = messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : "");
      }
    } else {
      storeThread({
        thread_id: threadId,
        assistant_id: assistantId,
        user_id: userId,
        messages_count: 1,
        first_message: messageContent.substring(0, 100),
        title: messageContent.substring(0, 50) + (messageContent.length > 50 ? "..." : ""),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch (error) {
    console.error("Failed to update thread:", error);
  }
}

/**
 * Convert stored threads to Thread format for compatibility
 */
export function convertStoredThreadsToThreads(storedThreads: StoredThread[]): Thread[] {
  return storedThreads.map(stored => ({
    thread_id: stored.thread_id,
    created_at: stored.created_at,
    updated_at: stored.updated_at,
    metadata: {
      assistant_id: stored.assistant_id,
      user_id: stored.user_id,
      title: stored.title,
    },
    values: {
      messages: [], // We don't store full messages locally
    },
    status: "idle" as const,
  }));
}

/**
 * Clear all stored threads
 */
export function clearStoredThreads(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    console.log("Stored threads cleared");
  } catch (error) {
    console.error("Failed to clear stored threads:", error);
  }
}

/**
 * Get thread title from stored threads
 */
export function getThreadTitle(threadId: string): string {
  const threads = getStoredThreads();
  const thread = threads.find(t => t.thread_id === threadId);
  return thread?.title || threadId;
}
