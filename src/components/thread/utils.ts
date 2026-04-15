import type { Message } from "@langchain/langgraph-sdk";

/**
 * Extracts a string summary from a message's content, supporting multimodal (text, image, file, etc.).
 * - If text is present, returns the joined text.
 * - If not, returns a label for the first non-text modality (e.g., 'Image', 'Other').
 * - If unknown, returns 'Multimodal message'.
 */
export function getContentString(content: Message["content"]): string {
  if (typeof content === "string") return content;
  const texts = content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text);
  return texts.join(" ");
}

/**
 * Best-effort extractor for a model's "thinking / reasoning" text from a LangGraph message.
 *
 * Returns the extracted reasoning text (trimmed check), or `undefined` if not present.
 * Notes:
 * - This does NOT generate reasoning; it only displays what the model/provider already returned.
 * - If the message content is streaming, this may be called repeatedly as new chunks arrive.
 */
export function getThinkingText(
  message: Message | undefined,
): string | undefined {
  if (!message) return;

  const ak = message.additional_kwargs as Record<string, unknown> | undefined;
  const v = ak?.reasoning_content;
  if (typeof v === "string" && v.trim()) return v;

  // "thinking" may be embedded in the message content blocks.
  const content = message.content;
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const blk of content as any[]) {
      if (!blk || typeof blk !== "object") continue;
      if (blk.type === "thinking") {
        const t = typeof blk.thinking === "string" ? blk.thinking : "";
        if (t.trim()) parts.push(t);
      }
    }
    const joined = parts.join("\n\n").trim();
    if (joined) return joined;
  }

  return;
}
