"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Plus, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { AddSecretDialog } from "./add-secret-dialog";
import { useRouter } from "next/navigation";
import {
  getSecrets,
  setSecret as apiSetSecret,
  deleteSecret as apiDeleteSecret,
} from "@/lib/api/agent-builder";
import type { SecretEntry } from "@/lib/types/agent-builder";
import { toast } from "sonner";

export function SecretsScreen() {
  const router = useRouter();
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<{
    key: string;
    value: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch secrets from API
  const fetchSecrets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSecrets();
      setSecrets(response.secrets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load secrets";
      setError(errorMessage);
      console.error("Failed to load secrets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  const handleSave = async (key: string, value: string) => {
    setIsSaving(true);
    try {
      await apiSetSecret(key, value);
      toast.success(editingSecret ? "Secret updated" : "Secret added");
      setEditingSecret(null);
      setDialogOpen(false);
      await fetchSecrets();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save secret";
      toast.error("Failed to save secret", {
        description: errorMessage,
        richColors: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete "${key}"?`)) {
      return;
    }

    try {
      await apiDeleteSecret(key);
      toast.success("Secret deleted");
      await fetchSecrets();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete secret";
      toast.error("Failed to delete secret", {
        description: errorMessage,
        richColors: true,
      });
    }
  };

  const handleEdit = (key: string) => {
    // For editing, we don't have the actual value (it's masked)
    // So we'll just let them enter a new value
    setEditingSecret({ key, value: "" });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSecret(null);
    setDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Workspace Secrets
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Server-side secrets used by your agents
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Workspace Secrets
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Server-side secrets used by your agents
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <AlertCircle className="size-12 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <Button onClick={fetchSecrets} variant="outline" className="gap-2">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="size-5 text-gray-600 dark:text-gray-400" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Workspace Secrets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Server-side secrets used by your agents
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSecrets}
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            onClick={handleAddNew}
            className="gap-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            <Plus className="size-4" />
            Add secret
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {secrets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No secrets configured yet.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Click &quot;Add secret&quot; to create your first secret.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {secrets.map((secret) => (
                  <tr
                    key={secret.key}
                    className="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
                  >
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {secret.key}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        {secret.masked_value}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(secret.key)}
                          className="gap-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(secret.key)}
                          className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddSecretDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editingSecret={editingSecret}
        isSaving={isSaving}
      />
    </div>
  );
}
