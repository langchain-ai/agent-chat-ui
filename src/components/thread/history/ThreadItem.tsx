"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  displayText: string;
  onSelect: () => void;
  onDelete: (threadId: string) => void;
  onUpdateTitle: (threadId: string, newTitle: string) => void;
}

export function ThreadItem({
  thread,
  isActive,
  displayText,
  onSelect,
  onDelete,
  onUpdateTitle,
}: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(displayText);
  const [isHovered, setIsHovered] = useState(false);

  const handleSaveEdit = () => {
    if (editedTitle.trim() && editedTitle !== displayText) {
      onUpdateTitle(thread.thread_id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(displayText);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete this conversation?`)) {
      onDelete(thread.thread_id);
    }
  };

  return (
    <div
      className="group relative w-full px-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isEditing ? (
        <div className="flex items-center gap-1 rounded-lg border bg-white p-2">
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveEdit();
              if (e.key === "Escape") handleCancelEdit();
            }}
            className="h-7 flex-1 text-sm"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSaveEdit}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleCancelEdit}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className={`flex-1 items-start justify-start text-left font-normal ${
              isActive ? "bg-gray-100" : ""
            }`}
            onClick={onSelect}
          >
            <p className="truncate text-ellipsis text-sm">{displayText}</p>
          </Button>
          {isHovered && (
            <div className="flex items-center gap-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit title</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete conversation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
