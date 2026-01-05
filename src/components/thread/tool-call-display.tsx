"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, CheckCircle } from "lucide-react";

export interface ToolCall {
  id?: string;
  name: string;
  parameters: Record<string, string>;
}

export interface ToolResult {
  id: string;
  result: string;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

function ToolResultItem({ result }: { result: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Parse result if it's JSON
  let displayResult = result;
  try {
    const parsed = JSON.parse(result);
    displayResult = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep original if not JSON
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="size-4 text-gray-400" />
        ) : (
          <ChevronRight className="size-4 text-gray-400" />
        )}
        <CheckCircle className="size-4 text-blue-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Result
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-blue-200 px-3 py-2 dark:border-blue-800">
          <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
            {displayResult}
          </pre>
        </div>
      )}
    </div>
  );
}

function ToolCallItem({ toolCall }: { toolCall: ToolCall }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="size-4 text-gray-400" />
        ) : (
          <ChevronRight className="size-4 text-gray-400" />
        )}
        <Wrench className="size-4 text-blue-500" />
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {toolCall.name}
        </span>
      </button>
      {isOpen && Object.keys(toolCall.parameters).length > 0 && (
        <div className="border-t border-gray-200 px-3 py-2 dark:border-gray-700">
          {Object.entries(toolCall.parameters).map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm">
              <span className="font-medium text-gray-500 dark:text-gray-400">
                {key}:
              </span>
              <span className="text-gray-700 dark:text-gray-300 break-all">
                &quot;{value}&quot;
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 my-2">
      {toolCalls.map((toolCall, index) => (
        <ToolCallItem key={`${toolCall.name}-${index}`} toolCall={toolCall} />
      ))}
    </div>
  );
}

interface ToolResultDisplayProps {
  results: ToolResult[];
}

export function ToolResultDisplay({ results }: ToolResultDisplayProps) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 my-2">
      {results.map((result) => (
        <ToolResultItem key={result.id} result={result.result} />
      ))}
    </div>
  );
}

// Parser function to extract tool calls from content
export function parseToolCalls(content: string): {
  toolCalls: ToolCall[];
  cleanContent: string;
} {
  const toolCalls: ToolCall[] = [];
  let cleanContent = content;

  // 1. Parse <function_calls>...<invoke>...</function_calls> blocks
  const functionCallsRegex = /<function_calls>([\s\S]*?)<\/function_calls>/g;
  let match;

  while ((match = functionCallsRegex.exec(content)) !== null) {
    const block = match[1];
    const invokeRegex = /<invoke name="([^"]+)">([\s\S]*?)<\/invoke>/g;
    let invokeMatch;

    while ((invokeMatch = invokeRegex.exec(block)) !== null) {
      const name = invokeMatch[1];
      const invokeContent = invokeMatch[2];
      const parameters: Record<string, string> = {};
      const paramRegex = /<parameter name="([^"]+)">([^<]*)<\/parameter>/g;
      let paramMatch;

      while ((paramMatch = paramRegex.exec(invokeContent)) !== null) {
        parameters[paramMatch[1]] = paramMatch[2];
      }

      toolCalls.push({ name, parameters });
    }

    cleanContent = cleanContent.replace(match[0], "");
  }

  // 2. Parse standalone <search>...<search_query>...</search> blocks
  const searchRegex = /<search>([\s\S]*?)<\/search>/g;
  while ((match = searchRegex.exec(content)) !== null) {
    const block = match[1];
    const queryMatch = /<search_query>([^<]*)<\/search_query>/.exec(block);
    if (queryMatch) {
      toolCalls.push({
        name: "search",
        parameters: { query: queryMatch[1] }
      });
    }
    cleanContent = cleanContent.replace(match[0], "");
  }

  // 3. Parse standalone <invoke>...</invoke> blocks (not inside function_calls)
  const standaloneInvokeRegex = /<invoke name="([^"]+)">([\s\S]*?)<\/invoke>/g;
  while ((match = standaloneInvokeRegex.exec(cleanContent)) !== null) {
    const name = match[1];
    const invokeContent = match[2];
    const parameters: Record<string, string> = {};
    const paramRegex = /<parameter name="([^"]+)">([^<]*)<\/parameter>/g;
    let paramMatch;

    while ((paramMatch = paramRegex.exec(invokeContent)) !== null) {
      parameters[paramMatch[1]] = paramMatch[2];
    }

    toolCalls.push({ name, parameters });
    cleanContent = cleanContent.replace(match[0], "");
  }

  return { toolCalls, cleanContent: cleanContent.trim() };
}
