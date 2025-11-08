"use client";

import { Thread } from "@langchain/langgraph-sdk";
import { ThreadItemEditing } from "./ThreadItemEditing";
import { ThreadItemNormal } from "./ThreadItemNormal";
import { useThreadItemEdit } from "../../hooks/useThreadItemEdit";
import { UI_TEXT } from "../../constants";

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
  const handleDelete = () => {
    if (confirm(UI_TEXT.deleteConfirm)) {
      onDelete(thread.thread_id);
    }
  };

  const {
    isEditing,
    editedTitle,
    setEditedTitle,
    startEditing,
    cancelEditing,
    saveEditing,
  } = useThreadItemEdit(displayText, (newTitle) => {
    onUpdateTitle(thread.thread_id, newTitle);
  });

  return (
    <div className="group relative w-full">
      {isEditing ? (
        <ThreadItemEditing
          value={editedTitle}
          onChange={setEditedTitle}
          onSave={saveEditing}
          onCancel={cancelEditing}
        />
      ) : (
        <ThreadItemNormal
          displayText={displayText}
          isActive={isActive}
          onSelect={onSelect}
          onRename={startEditing}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
