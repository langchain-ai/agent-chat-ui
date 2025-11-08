import { toast } from "sonner";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { fileToContentBlock } from "@/lib/multimodal-utils";

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

/**
 * Error messages for file validation
 */
const ERROR_MESSAGES = {
  INVALID_FILE_TYPE:
    "You have uploaded invalid file type. Please upload a JPEG, PNG, GIF, WEBP image or a PDF.",
  INVALID_FILE_TYPE_PASTE:
    "You have pasted an invalid file type. Please paste a JPEG, PNG, GIF, WEBP image or a PDF.",
  DUPLICATE_FILES: (fileNames: string[]) =>
    `Duplicate file(s) detected: ${fileNames.join(", ")}. Each file can only be uploaded once per message.`,
} as const;

/**
 * Check if a file is already uploaded (duplicate)
 */
export function isDuplicate(
  file: File,
  existingBlocks: Base64ContentBlock[],
): boolean {
  if (file.type === "application/pdf") {
    return existingBlocks.some(
      (block) =>
        block.type === "file" &&
        block.mime_type === "application/pdf" &&
        block.metadata?.filename === file.name,
    );
  }

  if (SUPPORTED_FILE_TYPES.includes(file.type as (typeof SUPPORTED_FILE_TYPES)[number])) {
    return existingBlocks.some(
      (block) =>
        block.type === "image" &&
        block.metadata?.name === file.name &&
        block.mime_type === file.type,
    );
  }

  return false;
}

/**
 * Result of file validation
 */
export interface FileValidationResult {
  validFiles: File[];
  invalidFiles: File[];
  duplicateFiles: File[];
  uniqueFiles: File[];
}

/**
 * Validate a list of files against supported types and existing blocks
 */
export function validateFiles(
  files: File[],
  existingBlocks: Base64ContentBlock[],
): FileValidationResult {
  const validFiles = files.filter((file) =>
    SUPPORTED_FILE_TYPES.includes(file.type as (typeof SUPPORTED_FILE_TYPES)[number]),
  );
  const invalidFiles = files.filter(
    (file) => !SUPPORTED_FILE_TYPES.includes(file.type as (typeof SUPPORTED_FILE_TYPES)[number]),
  );
  const duplicateFiles = validFiles.filter((file) =>
    isDuplicate(file, existingBlocks),
  );
  const uniqueFiles = validFiles.filter(
    (file) => !isDuplicate(file, existingBlocks),
  );

  return {
    validFiles,
    invalidFiles,
    duplicateFiles,
    uniqueFiles,
  };
}

/**
 * Show toast errors for invalid/duplicate files
 */
export function showFileValidationErrors(
  validation: FileValidationResult,
  isPaste = false,
): void {
  if (validation.invalidFiles.length > 0) {
    toast.error(
      isPaste
        ? ERROR_MESSAGES.INVALID_FILE_TYPE_PASTE
        : ERROR_MESSAGES.INVALID_FILE_TYPE,
    );
  }

  if (validation.duplicateFiles.length > 0) {
    toast.error(
      ERROR_MESSAGES.DUPLICATE_FILES(
        validation.duplicateFiles.map((f) => f.name),
      ),
    );
  }
}

/**
 * Process files: validate, show errors, and convert to content blocks
 */
export async function processFiles(
  files: File[],
  existingBlocks: Base64ContentBlock[],
  isPaste = false,
): Promise<Base64ContentBlock[]> {
  const validation = validateFiles(files, existingBlocks);
  showFileValidationErrors(validation, isPaste);

  if (validation.uniqueFiles.length === 0) {
    return [];
  }

  const newBlocks = await Promise.all(
    validation.uniqueFiles.map(fileToContentBlock),
  );
  return newBlocks;
}
