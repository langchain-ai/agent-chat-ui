import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";

// Image types supported by LangGraph platforms
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

// Maximum file size for images (10MB)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// Returns a Promise of a typed multimodal block following LangGraph best practices
export async function fileToContentBlock(
  file: File,
): Promise<Base64ContentBlock> {
  // Validate file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as any)) {
    toast.error(
      `Unsupported file type: ${file.type}. Please upload JPEG, PNG, GIF, or WEBP images only.`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    toast.error(
      `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 10MB.`,
    );
    return Promise.reject(new Error(`Image too large: ${file.size} bytes`));
  }

  const data = await fileToBase64(file);

  // Return standardized content block format for LangGraph
  return {
    type: "image",
    source_type: "base64",
    mime_type: file.type,
    data,
    metadata: {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    },
  };
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for Base64ContentBlock (images only)
export function isBase64ContentBlock(
  block: unknown,
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;

  // Only validate image type blocks following LangGraph standards
  return (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/") &&
    "data" in block &&
    typeof (block as { data?: unknown }).data === "string"
  );
}
