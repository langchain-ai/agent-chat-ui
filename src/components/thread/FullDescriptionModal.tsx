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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>사용 가이드</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownText>{content}</MarkdownText>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
