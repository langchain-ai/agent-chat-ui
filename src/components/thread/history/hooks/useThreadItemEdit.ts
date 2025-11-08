import { useState } from "react";

/**
 * Custom hook for managing thread item edit state
 */
export function useThreadItemEdit(
  initialText: string,
  onSave: (newTitle: string) => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(initialText);

  const startEditing = () => {
    setEditedTitle(initialText);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedTitle(initialText);
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (editedTitle.trim() && editedTitle !== initialText) {
      onSave(editedTitle.trim());
    }
    setIsEditing(false);
  };

  return {
    isEditing,
    editedTitle,
    setEditedTitle,
    startEditing,
    cancelEditing,
    saveEditing,
  };
}
