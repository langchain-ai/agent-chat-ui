"use client";

import { useState, memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: "anthropic" | "openai";
}

const MODELS: Model[] = [
  { id: "anthropic:claude-sonnet-4-5", name: "Sonnet 4.5", provider: "anthropic" },
  { id: "anthropic:claude-opus-4-5", name: "Opus 4.5", provider: "anthropic" },
  { id: "anthropic:claude-opus-4-1", name: "Opus 4.1", provider: "anthropic" },
  { id: "anthropic:claude-haiku-4-5", name: "Haiku 4.5", provider: "anthropic" },
  { id: "openai:gpt-5", name: "GPT-5", provider: "openai" },
];

export const ModelSelector = memo(function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);

  const getProviderIcon = (provider: string) => {
    if (provider === "anthropic") {
      return <AnthropicIcon className="size-4 shrink-0" />;
    }
    return <OpenAIIcon className="size-4 shrink-0" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-transparent px-2.5 py-1.5 text-sm dark:border-gray-700"
        >
          <div className="flex items-center gap-2">
            {getProviderIcon(selectedModel.provider)}
            <span>{selectedModel.name}</span>
          </div>
          <ChevronDown className="size-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model)}
          >
            <div className="flex items-center gap-2">
              {getProviderIcon(model.provider)}
              <span>{model.name}</span>
            </div>
            {selectedModel.id === model.id && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.865 4H13.3925L19.725 20H23.1975L16.865 4ZM6.8325 4L0.5 20H4.041L5.336 16.64H11.961L13.256 20H16.797L10.4645 4H6.8325ZM6.4815 13.6685L8.6485 8.0455L10.8155 13.6685H6.4815Z" />
    </svg>
  );
}

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}
