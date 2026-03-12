import { ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";

export const MIME_TYPES = {
  JPEG: "image/jpeg",
  PNG: "image/png",
  GIF: "image/gif",
  WEBP: "image/webp",
  PDF: "application/pdf",
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  MIME_TYPES.JPEG,
  MIME_TYPES.PNG,
  MIME_TYPES.GIF,
  MIME_TYPES.WEBP,
] as const;

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  MIME_TYPES.PDF,
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

export function isSupportedImageType(
  type: string,
): type is SupportedImageType {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function isSupportedFileType(type: string): type is SupportedFileType {
  return (SUPPORTED_FILE_TYPES as readonly string[]).includes(type);
}

// Returns a Promise of a typed multimodal block for images or PDFs
export async function fileToContentBlock(
  file: File,
): Promise<ContentBlock.Multimodal.Data> {
  if (!isSupportedFileType(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${SUPPORTED_FILE_TYPES.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  if (isSupportedImageType(file.type)) {
    return {
      type: "image",
      mimeType: file.type,
      data,
      metadata: { name: file.name },
    };
  }

  // PDF
  return {
    type: "file",
    mimeType: MIME_TYPES.PDF,
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
): block is ContentBlock.Multimodal.Data {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;

  const candidate = block as { type: unknown; mimeType?: unknown };
  if (typeof candidate.mimeType !== "string") return false;

  // file type (legacy)
  if (candidate.type === "file") {
    return isSupportedFileType(candidate.mimeType);
  }
  // image type (new)
  if (candidate.type === "image") {
    return isSupportedImageType(candidate.mimeType);
  }

  return false;
}
