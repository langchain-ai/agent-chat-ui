"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

interface AddSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (key: string, value: string) => void;
  editingSecret?: { key: string; value: string } | null;
  isSaving?: boolean;
}

export function AddSecretDialog({
  open,
  onOpenChange,
  onSave,
  editingSecret,
  isSaving = false,
}: AddSecretDialogProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (editingSecret) {
      setKey(editingSecret.key);
      setValue(editingSecret.value);
    } else {
      setKey("");
      setValue("");
    }
  }, [editingSecret, open]);

  const handleSave = () => {
    if (key.trim() && value.trim()) {
      onSave(key.trim(), value.trim());
      // Don't close dialog here - let parent handle it after async save
    }
  };

  const isEditing = !!editingSecret;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Secret" : "Add Secret"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="OPENAI_API_KEY"
              disabled={isEditing || isSaving}
              className="dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <PasswordInput
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isEditing ? "Enter new value..." : "sk-..."}
              disabled={isSaving}
              className="dark:border-gray-700 dark:bg-gray-800"
            />
            {isEditing && (
              <p className="text-xs text-gray-500">
                Enter a new value to update this secret
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!key.trim() || !value.trim() || isSaving}
            className="gap-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
