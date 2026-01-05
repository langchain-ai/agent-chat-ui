"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Layers, Loader2 } from "lucide-react";
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
import { getMiddlewares, getAgentMiddlewares } from "@/lib/api/agent-builder";
import type { MiddlewareSummary, AgentMiddlewareEntry } from "@/lib/types/agent-builder";
import { toast } from "sonner";

export function Middlewares() {
  const { editedConfig, updateField } = useAgentEdit();
  const [availableMiddlewares, setAvailableMiddlewares] = useState<MiddlewareSummary[]>([]);
  const [agentMiddlewares, setAgentMiddlewares] = useState<AgentMiddlewareEntry[]>([]);
  const [isLoadingMiddlewares, setIsLoadingMiddlewares] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch available middlewares when dialog opens
  useEffect(() => {
    async function fetchMiddlewares() {
      if (!isDialogOpen) return;

      setIsLoadingMiddlewares(true);
      try {
        const response = await getMiddlewares();
        setAvailableMiddlewares(response.middlewares);
      } catch (err) {
        toast.error("Failed to load middlewares");
      } finally {
        setIsLoadingMiddlewares(false);
      }
    }

    fetchMiddlewares();
  }, [isDialogOpen]);

  // Fetch agent middlewares when config changes
  useEffect(() => {
    async function fetchAgentMiddlewares() {
      if (!editedConfig?.agent_id) return;

      try {
        const response = await getAgentMiddlewares(editedConfig.agent_id);
        setAgentMiddlewares(response.middlewares);
      } catch (err) {
        // Silently fail - middlewares might not be loaded yet
      }
    }

    fetchAgentMiddlewares();
  }, [editedConfig?.agent_id]);

  if (!editedConfig) return null;

  const currentMiddlewares = editedConfig.middleware_list || [];

  const handleAddMiddleware = (middlewareName: string) => {
    if (!currentMiddlewares.includes(middlewareName)) {
      updateField("middleware_list", [...currentMiddlewares, middlewareName]);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveMiddleware = (middlewareName: string) => {
    updateField(
      "middleware_list",
      currentMiddlewares.filter((m) => m !== middlewareName)
    );
  };

  // Filter out already added middlewares
  const availableToAdd = availableMiddlewares.filter(
    (middleware) => !currentMiddlewares.includes(middleware.middleware_name)
  );

  return (
    <CollapsibleSection
      title="Middlewares"
      defaultOpen={true}
      headerActions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Plus className="size-3.5" />
              Add middleware
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Middleware</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-y-auto">
              {isLoadingMiddlewares ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-gray-400" />
                </div>
              ) : availableToAdd.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No more middlewares available to add
                </p>
              ) : (
                <div className="space-y-2">
                  {availableToAdd.map((middleware) => (
                    <button
                      key={middleware.middleware_name}
                      onClick={() => handleAddMiddleware(middleware.middleware_name)}
                      className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                        <Layers className="size-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {middleware.middleware_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {middleware.middleware_description}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {middleware.middleware_type}
                          </span>
                          {middleware.provider && (
                            <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                              {middleware.provider}
                            </span>
                          )}
                        </div>
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
        {currentMiddlewares.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No middlewares added yet
          </p>
        ) : (
          currentMiddlewares.map((middlewareName) => {
            const middlewareInfo = agentMiddlewares.find((m) => m.middleware_name === middlewareName);
            return (
              <div
                key={middlewareName}
                className="flex items-center justify-between gap-2 rounded-lg py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                    <Layers className="size-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{middlewareName}</p>
                    {middlewareInfo && (
                      <p className="truncate text-xs text-gray-500">
                        {middlewareInfo.middleware_path}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMiddleware(middlewareName)}
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
