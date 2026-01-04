"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { AddSecretDialog } from "./add-secret-dialog";
import { useAgents } from "@/providers/Agent";

const SECRETS_STORAGE_KEY = "lg:chat:secrets";
const LEGACY_API_KEY = "lg:chat:apiKey";

interface SecretsMap {
  [key: string]: string;
}

function loadSecrets(): SecretsMap {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(SECRETS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Migrate legacy apiKey if exists
    const legacyKey = localStorage.getItem(LEGACY_API_KEY);
    if (legacyKey) {
      const secrets: SecretsMap = { API_KEY: legacyKey };
      localStorage.setItem(SECRETS_STORAGE_KEY, JSON.stringify(secrets));
      return secrets;
    }

    return {};
  } catch {
    return {};
  }
}

function saveSecrets(secrets: SecretsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SECRETS_STORAGE_KEY, JSON.stringify(secrets));
}

export function SecretsScreen() {
  const { setShowSecrets } = useAgents();
  const [secrets, setSecrets] = useState<SecretsMap>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<{
    key: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    setSecrets(loadSecrets());
  }, []);

  const handleSave = (key: string, value: string) => {
    const newSecrets = { ...secrets, [key]: value };
    setSecrets(newSecrets);
    saveSecrets(newSecrets);
    setEditingSecret(null);
  };

  const handleDelete = (key: string) => {
    const newSecrets = { ...secrets };
    delete newSecrets[key];
    setSecrets(newSecrets);
    saveSecrets(newSecrets);
  };

  const handleEdit = (key: string) => {
    setEditingSecret({ key, value: secrets[key] });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSecret(null);
    setDialogOpen(true);
  };

  const secretKeys = Object.keys(secrets);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSecrets(false)}
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
        <Button
          onClick={handleAddNew}
          className="gap-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Plus className="size-4" />
          Add secret
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {secretKeys.length === 0 ? (
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
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {secretKeys.map((key) => (
                  <tr
                    key={key}
                    className="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
                  >
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {key}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(key)}
                          className="gap-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(key)}
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
      />
    </div>
  );
}
