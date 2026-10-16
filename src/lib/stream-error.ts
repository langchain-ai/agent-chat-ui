/**
 * StreamError class for handling structured error responses from the LangGraph API.
 * Matches the SDK's StreamError implementation for consistency.
 */
export class StreamError extends Error {
  constructor(data: { message: string; name?: string; error?: string }) {
    super(data.message);
    this.name = data.name ?? data.error ?? "StreamError";
  }

  /**
   * Type guard to check if an error is a structured error object
   */
  static isStructuredError(
    error: unknown
  ): error is { message: string; name?: string; error?: string } {
    return typeof error === "object" && error != null && "message" in error;
  }
}
