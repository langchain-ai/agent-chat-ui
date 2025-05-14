"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useQueryState } from "nuqs";

interface ServerStatus {
  isChecking: boolean;
  isOnline: boolean;
  lastChecked: Date | null;
}

const showSuccess = () => {
  toast.success("所有伺服器已恢復在線狀態", {
    description: "服務已正常運行",
    duration: 5000,
  });
};

export function ServerStatusChecker() {
  const hasRunRef = useRef(false);
  const [apiUrlParam] = useQueryState("apiUrl");
  const langGraphApiUrl = process.env.NEXT_PUBLIC_API_URL || apiUrlParam || "";
  const gstudioApiUrl = `${langGraphApiUrl}/gstudio`;
  const [serverUrls] = useState({
    "Langgraph Server": langGraphApiUrl,
    Gstudio: gstudioApiUrl,
  });
  const checkInterval = 3 * 60 * 1000;
  const retryInterval = 5 * 1000;
  const [statuses, setStatuses] = useState<Record<string, ServerStatus>>({});
  const [showStatusWindow, setShowStatusWindow] = useState(true);

  // 檢查伺服器狀態
  const checkServerStatus = async (url: string) => {
    setStatuses((prev) => ({
      ...prev,
      [url]: {
        ...prev[url],
        isChecking: true,
      },
    }));

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // 設置較短的超時時間，避免長時間等待
        signal: AbortSignal.timeout(10000),
      });

      const isOnline = response.ok;

      setStatuses((prev) => ({
        ...prev,
        [url]: {
          isChecking: false,
          isOnline,
          lastChecked: new Date(),
        },
      }));

      return isOnline;
    } catch (error) {
      console.error(`Error checking server status for ${url}:`, error);

      setStatuses((prev) => ({
        ...prev,
        [url]: {
          isChecking: false,
          isOnline: false,
          lastChecked: new Date(),
        },
      }));

      return false;
    }
  };

  // 檢查所有伺服器狀態
  const checkAllServers = async () => {
    const results = await Promise.all(
      Object.values(serverUrls).map((url) => checkServerStatus(url)),
    );

    // 如果有任何一個伺服器離線，顯示狀態視窗
    if (results.some((result) => !result)) {
      setShowStatusWindow(true);
    } else {
      setShowStatusWindow(false);
    }

    return results.every((result) => result);
  };

  // 初始化狀態
  useEffect(() => {
    Object.values(serverUrls).forEach((url) => {
      setStatuses((prev) => ({
        ...prev,
        [url]: {
          isChecking: false,
          isOnline: false,
          lastChecked: null,
        },
      }));
    });
  }, [serverUrls]);

  // 定期檢查伺服器狀態
  useEffect(() => {
    // 立即進行第一次檢查
    if (!hasRunRef.current) {
      checkAllServers().then((allOnline) => {
        if (allOnline) {
          showSuccess();
        }
      });
      hasRunRef.current = true;
    }

    // 設置定期檢查
    const intervalId = setInterval(() => {
      checkAllServers();
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [checkInterval, serverUrls]);

  // 當有伺服器離線時，每5秒重試一次
  useEffect(() => {
    if (!showStatusWindow) return;

    const retryId = setInterval(() => {
      checkAllServers().then((allOnline) => {
        if (allOnline) {
          showSuccess();
        }
      });
    }, retryInterval);

    return () => clearInterval(retryId);
  }, [retryInterval, showStatusWindow, serverUrls]);

  if (!showStatusWindow) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-80 rounded-lg border bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">伺服器狀態</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setShowStatusWindow(false)}
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(serverUrls).map(([name, url]) => {
          const status = statuses[url];
          return (
            <div
              key={url}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div className="flex items-center gap-2">
                {status?.isChecking ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                ) : status?.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span
                  className="max-w-[180px] truncate text-sm"
                  title={url}
                >
                  {name}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  status?.isOnline ? "text-green-500" : "text-red-500",
                )}
              >
                {status?.isOnline ? "在線" : "離線"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          onClick={() => checkAllServers()}
          disabled={Object.values(serverUrls).some(
            (url) => statuses[url]?.isChecking,
          )}
        >
          立即檢查
        </Button>
      </div>
    </div>
  );
}
