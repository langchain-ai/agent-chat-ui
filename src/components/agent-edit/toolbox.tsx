"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAgentEdit } from "@/providers/AgentEdit";
import { CollapsibleSection } from "./collapsible-section";
import { getTools, getAgentTools } from "@/lib/api/agent-builder";
import type { ToolSummary, AgentToolEntry } from "@/lib/types/agent-builder";
import { toast } from "sonner";

export function Toolbox() {
  const { editedConfig, updateField } = useAgentEdit();
  const [availableTools, setAvailableTools] = useState<ToolSummary[]>([]);
  const [agentTools, setAgentTools] = useState<AgentToolEntry[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch available tools when dialog opens
  useEffect(() => {
    async function fetchTools() {
      if (!isDialogOpen) return;

      setIsLoadingTools(true);
      try {
        const response = await getTools();
        setAvailableTools(response.tools);
      } catch (err) {
        toast.error("Failed to load tools");
      } finally {
        setIsLoadingTools(false);
      }
    }

    fetchTools();
  }, [isDialogOpen]);

  // Fetch agent tools when config changes
  useEffect(() => {
    async function fetchAgentTools() {
      if (!editedConfig?.agent_id) return;

      try {
        const response = await getAgentTools(editedConfig.agent_id);
        setAgentTools(response.tools);
      } catch (err) {
        // Silently fail - tools might not be loaded yet
      }
    }

    fetchAgentTools();
  }, [editedConfig?.agent_id]);

  if (!editedConfig) return null;

  const currentTools = editedConfig.tool_list || [];

  const handleAddTool = (toolName: string) => {
    if (!currentTools.includes(toolName)) {
      updateField("tool_list", [...currentTools, toolName]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveTool = (toolName: string) => {
    updateField(
      "tool_list",
      currentTools.filter((t) => t !== toolName)
    );
  };

  // Filter out already added tools
  const availableToAdd = availableTools.filter(
    (tool) => !currentTools.includes(tool.tool_name)
  );

  return (
    <CollapsibleSection
      title="Toolbox"
      defaultOpen={true}
      headerActions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Add tool
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Tool</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              {isLoadingTools ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-gray-400" />
                </div>
              ) : availableToAdd.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No more tools available to add
                </p>
              ) : (
                <div className="space-y-2">
                  {availableToAdd.map((tool) => (
                    <button
                      key={tool.tool_name}
                      onClick={() => handleAddTool(tool.tool_name)}
                      className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                        <Wrench className="size-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {tool.tool_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {tool.tool_description}
                        </p>
                        <span className="mt-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {tool.tool_type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-1 p-4 pt-2">
        {currentTools.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No tools added yet
          </p>
        ) : (
          currentTools.map((toolName) => {
            const toolInfo = agentTools.find((t) => t.tool_name === toolName);
            return (
              <div
                key={toolName}
                className="flex items-center justify-between gap-2 rounded-lg py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                    <Wrench className="size-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{toolName}</p>
                    {toolInfo && (
                      <p className="truncate text-xs text-gray-500">
                        {toolInfo.tool_path}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTool(toolName)}
                  className="size-8 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </CollapsibleSection>
  );
}
