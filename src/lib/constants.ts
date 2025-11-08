/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

/**
 * UI Layout Constants
 */
export const UI = {
  /** Width of the chat history sidebar in pixels */
  CHAT_SIDEBAR_WIDTH: 300,
  /** Maximum height of the chat textarea in pixels */
  CHAT_TEXTAREA_MAX_HEIGHT: 490,
} as const;

/**
 * Timing Constants
 */
export const TIMING = {
  /** Delay before fetching threads after creation (milliseconds) */
  THREAD_FETCH_DELAY: 4000,
} as const;

/**
 * Placeholder text for chat input
 * TODO: Replace with i18n system for localization
 */
export const PLACEHOLDERS = {
  CHAT_INPUT: "무엇이든 물어보세요",
} as const;
