import React from "react";
import { File, X as XIcon } from "lucide-react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { cn } from "@/lib/utils";
import Image from "next/image";
export interface MultimodalPreviewProps {
  block: Base64ContentBlock;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const MultimodalPreview: React.FC<MultimodalPreviewProps> = ({
  block,
  removable = false,
  onRemove,
  className,
  size = "md",
}) => {
  // Image block - following LangGraph best practices
  if (
    block.type === "image" &&
    block.source_type === "base64" &&
    typeof block.mime_type === "string" &&
    block.mime_type.startsWith("image/")
  ) {
    const url = `data:${block.mime_type};base64,${block.data}`;
    let imgClass: string = "rounded-md object-cover h-16 w-16 text-lg";
    if (size === "sm") imgClass = "rounded-md object-cover h-10 w-10 text-base";
    if (size === "lg") imgClass = "rounded-md object-cover h-24 w-24 text-xl";

    // Enhanced metadata display for debugging
    const imageName = block.metadata?.name || "uploaded image";
    const imageSize = block.metadata?.size
      ? `(${(block.metadata.size / 1024).toFixed(1)}KB)`
      : "";

    return (
      <div className={cn("relative inline-block", className)}>
        <Image
          src={url}
          alt={`${imageName} ${imageSize}`}
          className={imgClass}
          width={size === "sm" ? 16 : size === "md" ? 32 : 48}
          height={size === "sm" ? 16 : size === "md" ? 32 : 48}
        />
        {removable && (
          <button
            type="button"
            className="absolute top-1 right-1 z-10 rounded-full bg-gray-500 text-white hover:bg-gray-700"
            onClick={onRemove}
            aria-label={`Remove ${imageName}`}
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Fallback for non-image types (should not occur with new implementation)
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-red-50 px-3 py-2 text-red-500",
        className,
      )}
    >
      <File className="h-5 w-5 flex-shrink-0" />
      <span className="truncate text-xs">
        Image type only - unsupported content
      </span>
      {removable && (
        <button
          type="button"
          className="ml-2 rounded-full bg-red-200 p-1 text-red-500 hover:bg-red-300"
          onClick={onRemove}
          aria-label="Remove unsupported content"
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
