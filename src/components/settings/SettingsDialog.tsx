"use client";

import { Settings as SettingsIcon, X, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/providers/Settings";
import { useAssistantConfig } from "@/providers/AssistantConfig";
import { useThreads } from "@/providers/Thread";
import { createClient } from "@/providers/client";
import { getApiKey } from "@/lib/api-key";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryState } from "nuqs";

export function SettingsDialog() {
  const { userSettings, updateUserSettings, resetUserSettings } = useSettings();
  const { config, schemas, assistantId, isLoading, error, updateConfig, refetchConfig } = useAssistantConfig();
  const { threads, getThreads, setThreads } = useThreads();
  const [apiUrl] = useQueryState("apiUrl");
  const [threadId, setThreadId] = useQueryState("threadId");
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track if config has been initialized to prevent infinite loops
  const isInitialized = useRef(false);

  // Initialize config values when config is loaded (only once)
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized.current) return;

    if (config?.configurable) {
      setConfigValues(config.configurable);
      isInitialized.current = true;
    } else if (schemas?.config_schema?.properties) {
      // Initialize with default values from schema
      const defaults: Record<string, any> = {};
      Object.entries(schemas.config_schema.properties).forEach(([key, schema]: [string, any]) => {
        if (schema.default !== undefined) {
          defaults[key] = schema.default;
        }
      });
      setConfigValues(defaults);
      isInitialized.current = true;
    }
  }, [config, schemas]);

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const success = await updateConfig({
        ...config,
        configurable: configValues,
      });
      if (success) {
        toast.success("Configuration updated successfully");
      } else {
        toast.error("Failed to update configuration");
      }
    } catch (err) {
      toast.error("Error updating configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllThreads = async () => {
    if (!apiUrl) {
      toast.error("API URL is not configured");
      return;
    }

    // Fetch current threads if not already loaded
    const threadsToDelete = threads.length > 0 ? threads : await getThreads();

    if (threadsToDelete.length === 0) {
      toast.info("No conversations to delete");
      return;
    }

    // Show native confirm dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete all conversation history?\n\n` +
      `All ${threadsToDelete.length} conversation${threadsToDelete.length !== 1 ? 's' : ''} will be permanently deleted.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const client = createClient(apiUrl, getApiKey() ?? undefined);

      // Delete all threads
      const deletePromises = threadsToDelete.map(thread =>
        client.threads.delete(thread.thread_id)
      );

      await Promise.all(deletePromises);

      // Clear the threads list
      setThreads([]);

      // Clear current thread if it exists
      if (threadId) {
        setThreadId(null);
      }

      toast.success(`Successfully deleted ${threadsToDelete.length} conversation${threadsToDelete.length > 1 ? 's' : ''}`);

      // Reload the page to reset the chat interface
      window.location.reload();
    } catch (err) {
      console.error("Error deleting threads:", err);
      toast.error("Failed to delete all conversations");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 hover:bg-accent"
        >
          <SettingsIcon className="size-5" />
          <span>설정</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Settings</DialogTitle>
          <DialogDescription>
            Customize your chat experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Font Family Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Appearance</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="font-family">Font Style</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.fontFamily === "sans" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "sans" })
                    }
                    className="flex-1"
                  >
                    Sans Serif
                  </Button>
                  <Button
                    variant={
                      userSettings.fontFamily === "serif" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "serif" })
                    }
                    className="flex-1"
                  >
                    Serif
                  </Button>
                  <Button
                    variant={
                      userSettings.fontFamily === "mono" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontFamily: "mono" })
                    }
                    className="flex-1"
                  >
                    Monospace
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.fontSize === "small" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "small" })
                    }
                    className="flex-1"
                  >
                    Small
                  </Button>
                  <Button
                    variant={
                      userSettings.fontSize === "medium" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "medium" })
                    }
                    className="flex-1"
                  >
                    Medium
                  </Button>
                  <Button
                    variant={
                      userSettings.fontSize === "large" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ fontSize: "large" })
                    }
                    className="flex-1"
                  >
                    Large
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.colorScheme === "light" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "light" })
                    }
                    className="flex-1"
                  >
                    Light
                  </Button>
                  <Button
                    variant={
                      userSettings.colorScheme === "dark" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "dark" })
                    }
                    className="flex-1"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={
                      userSettings.colorScheme === "auto" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ colorScheme: "auto" })
                    }
                    className="flex-1"
                  >
                    Auto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* UI Behavior Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">UI Behavior</h3>
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-collapse">Auto-collapse Tool Calls</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically collapse tool call details after response completes
                  </p>
                </div>
                <Switch
                  id="auto-collapse"
                  checked={userSettings.autoCollapseToolCalls}
                  onCheckedChange={(checked) =>
                    updateUserSettings({ autoCollapseToolCalls: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-width">Chat Width</Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      userSettings.chatWidth === "default" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ chatWidth: "default" })
                    }
                    className="flex-1"
                  >
                    Default
                  </Button>
                  <Button
                    variant={
                      userSettings.chatWidth === "wide" ? "default" : "outline"
                    }
                    onClick={() =>
                      updateUserSettings({ chatWidth: "wide" })
                    }
                    className="flex-1"
                  >
                    Wide
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Assistant Configuration Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Assistant Configuration</h3>
                {assistantId && (
                  <p className="text-xs text-muted-foreground">
                    ID: {assistantId.slice(0, 8)}...
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchConfig()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoading ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Loading configuration...</p>
              </div>
            ) : schemas?.config_schema?.properties && Object.keys(schemas.config_schema.properties).length > 0 ? (
              <>
                <div className="space-y-4 rounded-lg border p-4 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                  {Object.entries(schemas.config_schema.properties).map(([key, schema]: [string, any]) => {
                    const currentValue = configValues[key] ?? schema.default;
                    const fieldType = schema.type;

                    return (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={`config-${key}`}>
                          {schema.title || key.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Label>
                        {schema.description && (
                          <p className="text-xs text-muted-foreground">
                            {schema.description}
                          </p>
                        )}

                        {fieldType === 'boolean' ? (
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {schema.description || `Toggle ${schema.title || key}`}
                            </p>
                            <Switch
                              id={`config-${key}`}
                              checked={currentValue ?? false}
                              onCheckedChange={(checked) =>
                                handleConfigChange(key, checked)
                              }
                            />
                          </div>
                        ) : fieldType === 'integer' || fieldType === 'number' ? (
                          <Input
                            id={`config-${key}`}
                            type="number"
                            value={currentValue ?? ''}
                            onChange={(e) =>
                              handleConfigChange(key, fieldType === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))
                            }
                            placeholder={schema.default?.toString() || ''}
                          />
                        ) : fieldType === 'string' && (currentValue?.length > 100 || schema.default?.length > 100) ? (
                          <Textarea
                            id={`config-${key}`}
                            value={currentValue ?? ''}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={schema.default || ''}
                            rows={6}
                            className="font-mono text-sm resize-y min-h-[100px] max-h-[300px]"
                          />
                        ) : (
                          <Input
                            id={`config-${key}`}
                            type="text"
                            value={currentValue ?? ''}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            placeholder={schema.default || ''}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  No configurable parameters available
                </p>
              </div>
            )}
          </div>

          {/* Delete All Conversations Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <div className="rounded-lg border border-destructive/50 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Delete All Conversations</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all conversation history. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAllThreads}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete All"}
                </Button>
              </div>
            </div>
          </div>

          {/* Reset Section */}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={resetUserSettings}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}