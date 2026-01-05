"use client";

import { useAgentEdit } from "@/providers/AgentEdit";
import { CollapsibleSection } from "./collapsible-section";

export function InstructionsEditor() {
  const { editedConfig, updateField } = useAgentEdit();

  if (!editedConfig) return null;

  const charCount = editedConfig.system_prompt?.length || 0;

  return (
    <CollapsibleSection title="Instructions" defaultOpen={true} className="h-full">
      <div className="mx-4 mb-4 mt-2 flex flex-1 flex-col rounded-lg bg-gray-50 dark:bg-gray-800">
        <textarea
          value={editedConfig.system_prompt || ""}
          onChange={(e) => updateField("system_prompt", e.target.value)}
          placeholder="Enter system prompt / instructions for the agent..."
          className="h-full w-full flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
      <div className="shrink-0 px-4 pb-2 text-right text-xs text-gray-400 dark:text-gray-500">
        {charCount.toLocaleString()} characters
      </div>
    </CollapsibleSection>
  );
}
