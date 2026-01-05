"use client";

import { useAgentEdit } from "@/providers/AgentEdit";
import { CollapsibleSection } from "./collapsible-section";

export function InstructionsEditor() {
  const { editedConfig, updateField } = useAgentEdit();

  if (!editedConfig) return null;

  const charCount = editedConfig.system_prompt?.length || 0;

  return (
    <CollapsibleSection title="Instructions" defaultOpen={true}>
      <div className="mx-4 mb-4 mt-2 min-h-0 flex-1 overflow-auto rounded-lg bg-gray-50 dark:bg-gray-800">
        <textarea
          value={editedConfig.system_prompt || ""}
          onChange={(e) => updateField("system_prompt", e.target.value)}
          placeholder="Enter system prompt / instructions for the agent..."
          className="min-h-[300px] w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
      <div className="px-4 pb-2 text-right text-xs text-gray-400 dark:text-gray-500">
        {charCount.toLocaleString()} characters
      </div>
    </CollapsibleSection>
  );
}
