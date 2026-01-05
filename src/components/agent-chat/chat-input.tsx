"use client";

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from "react";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="relative flex items-end rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="max-h-[200px] min-h-[48px] w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
            disabled={isStreaming}
          />
          <div className="absolute bottom-2 right-2">
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                onClick={onStop}
                className="size-9 rounded-full bg-red-500 hover:bg-red-600"
              >
                <Square className="size-4 fill-white" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="size-9 rounded-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:hover:bg-gray-100 dark:disabled:bg-gray-600"
              >
                {isStreaming ? (
                  <Loader2 className="size-4 animate-spin text-white dark:text-gray-900" />
                ) : (
                  <ArrowUp className="size-4 text-white dark:text-gray-900" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Press Enter to send, Shift + Enter for new line
        </p>
      </form>
    </div>
  );
}
