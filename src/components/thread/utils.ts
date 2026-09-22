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
    .map((c) => {
      // Handle both object format {type: "text", text: "..."} and raw strings
      if (typeof c === "string") return c;
      if (typeof c === "object" && c.type === "text" && "text" in c) return c.text;
      return "";
    })
    .filter(Boolean);
  return texts.join("");
}
