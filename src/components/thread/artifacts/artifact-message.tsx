"use client";

import { FC } from "react";
import {
  Braces,
  ChartColumn,
  Code,
  File as FileIcon,
  FileText,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  LucideIcon,
  Music,
  Table as TableIcon,
} from "lucide-react";

import { useArtifact } from "@/components/thread/artifact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArtifactRenderer } from "./artifact-renderer";
import {
  ArtifactPayload,
  ArtifactType,
  normalizeArtifactPayload,
} from "./types";

const TYPE_ICONS: Record<ArtifactType, LucideIcon> = {
  markdown: FileText,
  text: FileText,
  code: Code,
  image: ImageIcon,
  audio: Music,
  video: Film,
  pdf: FileIcon,
  file: FileIcon,
  link: LinkIcon,
  json: Braces,
  table: TableIcon,
  chart: ChartColumn,
};

/**
 * Compact in-chat card for generic `artifact` UI messages. Rendered locally
 * by LoadExternalComponent, so the graph server does not need to bundle any
 * UI components. Props are the artifact payload pushed by the agent via
 * push_ui_message("artifact", payload, message=ai_message).
 */
export const ArtifactMessage: FC<ArtifactPayload> = (props) => {
  const [Artifact, { open, setOpen }] = useArtifact();
  const payload = normalizeArtifactPayload(props);
  const type = payload.type ?? "file";
  const Icon = TYPE_ICONS[type] ?? FileIcon;
  const title = payload.title ?? payload.fileName ?? "Artifact";

  return (
    <>
      <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border p-4">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          <Icon className="text-muted-foreground size-5" />
        </div>
        <div className="flex min-w-0 flex-grow flex-col gap-0.5">
          <span
            className={cn(
              "text-muted-foreground text-xs font-medium tracking-wide uppercase",
            )}
          >
            {type}
          </span>
          <span className="truncate text-sm font-medium">{title}</span>
          {payload.description && (
            <span className="text-muted-foreground line-clamp-2 text-sm">
              {payload.description}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close artifact" : "Open artifact"}
        </Button>
      </div>

      <Artifact title={title}>
        <ArtifactRenderer artifact={payload} />
      </Artifact>
    </>
  );
};
