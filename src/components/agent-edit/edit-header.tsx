"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentEdit } from "@/providers/AgentEdit";
import { useAgents } from "@/providers/Agent";

interface EditHeaderProps {
  agentId: string;
}

export function EditHeader({ agentId }: EditHeaderProps) {
  const {
    editedConfig,
    hasChanges,
    isSaving,
    updateField,
    saveChanges,
    resetChanges,
  } = useAgentEdit();
  const { refetchAgents } = useAgents();

  if (!editedConfig) return null;

  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      await refetchAgents();
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      {/* Left side: Back button + Agent info */}
      <div className="flex items-center gap-4">
        <Link href={`/agent/${agentId}`}>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
          >
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <input
              name="agent_name"
              value={editedConfig.agent_name}
              onChange={(e) => updateField("agent_name", e.target.value)}
              placeholder="Agent name..."
              className="min-w-0 truncate border border-transparent bg-transparent px-1 text-base font-medium leading-snug tracking-tight text-gray-900 outline-none transition-all hover:border-gray-300 focus:border-blue-500 dark:text-gray-50 dark:hover:border-gray-600 dark:focus:border-blue-400"
            />
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Editing
            </span>
          </div>
          <input
            name="description"
            value={editedConfig.agent_description}
            onChange={(e) => updateField("agent_description", e.target.value)}
            placeholder="Agent description..."
            className="w-full truncate border border-transparent bg-transparent px-1 text-sm leading-snug tracking-tight text-gray-500 outline-none transition-all placeholder:text-gray-300 hover:border-gray-300 focus:border-blue-500 dark:text-gray-400 dark:placeholder:text-gray-600 dark:hover:border-gray-600 dark:focus:border-blue-400"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={resetChanges}
          disabled={!hasChanges || isSaving}
          title="Reset all changes"
        >
          <RotateCcw className="size-4" />
        </Button>

        <Link href={`/agent/${agentId}`}>
          <Button variant="outline" size="icon" title="Chat with agent">
            <MessageSquare className="size-4" />
          </Button>
        </Link>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="gap-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
