"use client";

import { useState, useEffect } from "react";
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
}

export function AddSecretDialog({
  open,
  onOpenChange,
  onSave,
  editingSecret,
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
      onOpenChange(false);
      setKey("");
      setValue("");
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
              disabled={isEditing}
              className="dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Value</Label>
            <PasswordInput
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!key.trim() || !value.trim()}
            className="dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
