import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";

// Extended type to support OpenAI image_url format
export type OpenAIImageBlock = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

export type ExtendedImageContentBlock = Base64ContentBlock | OpenAIImageBlock;

// Returns a Promise of a typed multimodal block for images or PDFs
export async function fileToContentBlock(
  file: File,
): Promise<ExtendedImageContentBlock> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const supportedFileTypes = [...supportedImageTypes, "application/pdf"];

  if (!supportedFileTypes.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${supportedFileTypes.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  if (supportedImageTypes.includes(file.type)) {
    return {
      type: "image_url",
      image_url: {
        url: `data:${file.type};base64,${data}`,
      },
    };
  }

  // PDF
  return {
    type: "file",
    source_type: "base64",
    mime_type: "application/pdf",
    data,
    metadata: { filename: file.name },
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

// Type guard for Base64ContentBlock
export function isBase64ContentBlock(
  block: unknown,
): block is ExtendedImageContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;

  // file type (legacy)
  if (
    (block as { type: unknown }).type === "file" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }

  // image type (original LangChain format)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }

  // OpenAI image_url type
  if (
    (block as { type: unknown }).type === "image_url" &&
    "image_url" in block &&
    typeof (block as { image_url?: unknown }).image_url === "object" &&
    (block as { image_url: { url?: unknown } }).image_url !== null &&
    "url" in (block as { image_url: { url?: unknown } }).image_url &&
    typeof (block as { image_url: { url?: unknown } }).image_url.url ===
      "string"
  ) {
    return true;
  }

  return false;
}
