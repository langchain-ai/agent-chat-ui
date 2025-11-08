"use client";

import { useState } from "react";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ArrowRight } from "lucide-react";
import { getApiKey } from "@/lib/api-key";

// Default values for the form
const DEFAULT_API_URL = "http://localhost:2024";
const DEFAULT_ASSISTANT_ID = "agent";

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectionDialog({ open, onOpenChange }: ConnectionDialogProps) {
  const [apiUrl, setApiUrl] = useQueryState("apiUrl");
  const [assistantId, setAssistantId] = useQueryState("assistantId");
  const [apiKey, _setApiKey] = useState(() => getApiKey() || "");

  const setApiKey = (key: string) => {
    window.localStorage.setItem("lg:chat:apiKey", key);
    _setApiKey(key);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const newApiUrl = formData.get("apiUrl") as string;
    const newAssistantId = formData.get("assistantId") as string;
    const newApiKey = formData.get("apiKey") as string;

    setApiUrl(newApiUrl);
    setApiKey(newApiKey);
    setAssistantId(newAssistantId);

    form.reset();
    onOpenChange(false);

    // Reload the page to apply new connection settings
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">New Connection</DialogTitle>
          <DialogDescription>
            Configure a new LangGraph deployment endpoint
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="apiUrl">
              Deployment URL<span className="text-rose-500">*</span>
            </Label>
            <p className="text-muted-foreground text-sm">
              This is the URL of your LangGraph deployment. Can be a local, or
              production deployment.
            </p>
            <Input
              id="apiUrl"
              name="apiUrl"
              className="bg-background"
              defaultValue={apiUrl || DEFAULT_API_URL}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="assistantId">
              Assistant / Graph ID<span className="text-rose-500">*</span>
            </Label>
            <p className="text-muted-foreground text-sm">
              This is the ID of the graph (can be the graph name), or
              assistant to fetch threads from, and invoke when actions are
              taken.
            </p>
            <Input
              id="assistantId"
              name="assistantId"
              className="bg-background"
              defaultValue={assistantId || DEFAULT_ASSISTANT_ID}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey">LangSmith API Key</Label>
            <p className="text-muted-foreground text-sm">
              This is <strong>NOT</strong> required if using a local LangGraph
              server. This value is stored in your browser's local storage and
              is only used to authenticate requests sent to your LangGraph
              server.
            </p>
            <PasswordInput
              id="apiKey"
              name="apiKey"
              defaultValue={apiKey ?? ""}
              className="bg-background"
              placeholder="lsv2_pt_..."
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="default">
              Connect
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
