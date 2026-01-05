"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAgentEdit } from "@/providers/AgentEdit";
import { useAgents } from "@/providers/Agent";
import { deleteAgent } from "@/lib/api/agent-builder";

interface EditHeaderProps {
  agentId: string;
}

export function EditHeader({ agentId }: EditHeaderProps) {
  const router = useRouter();
  const {
    editedConfig,
    hasChanges,
    isSaving,
    updateField,
    saveChanges,
    resetChanges,
  } = useAgentEdit();
  const { refetchAgents } = useAgents();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!editedConfig) return null;

  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      await refetchAgents();
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    try {
      await deleteAgent(agentId);
      await refetchAgents();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete agent:", error);
    } finally {
      setIsDeleting(false);
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
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting || isSaving}
          title="Delete agent"
          className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
        >
          {isDeleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
        </Button>

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
          className="gap-2 bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:disabled:bg-gray-700"
        >
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>에이전트 삭제</DialogTitle>
            <DialogDescription>
              &quot;{editedConfig.agent_name}&quot; 에이전트를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
