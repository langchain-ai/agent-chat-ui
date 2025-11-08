"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownText } from "./markdown-text";
import { useSettings } from "@/providers/Settings";

interface FullDescriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullDescriptionModal({
  open,
  onOpenChange,
}: FullDescriptionModalProps) {
  const { config } = useSettings();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !config.branding.fullDescription) return;

    setLoading(true);
    setError(null);

    fetch(config.branding.fullDescription)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load description");
        }
        return response.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [open, config.branding.fullDescription]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">사용 가이드</DialogTitle>
        </DialogHeader>
        <div className="mt-6 px-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {error && (
            <div className="text-destructive text-center py-8">
              <p>가이드를 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}
          {!loading && !error && content && (
            <div className="prose prose-sm dark:prose-invert max-w-none
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:mt-0 [&_h1]:pb-4 [&_h1]:border-b [&_h1]:border-border/50
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-primary
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-foreground
              [&_h4]:text-sm [&_h4]:font-medium [&_h4]:mb-2 [&_h4]:mt-4
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-foreground/90
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_ul]:my-4 [&_ul]:space-y-2
              [&_ol]:my-4 [&_ol]:space-y-2
              [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-foreground/90
              [&_code]:text-xs [&_code]:bg-muted/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:border [&_code]:border-border/40 [&_code]:text-foreground
              [&_pre]:my-4 [&_pre]:bg-muted/50 [&_pre]:dark:bg-zinc-900 [&_pre]:border [&_pre]:border-border/40 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-foreground [&_pre]:dark:text-white
              [&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-inherit
              [&_hr]:my-8 [&_hr]:border-border/30
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary/80
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/80">
              <MarkdownText>{content}</MarkdownText>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
