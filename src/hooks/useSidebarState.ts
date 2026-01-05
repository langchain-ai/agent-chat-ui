"use client";

import { useQueryState, parseAsBoolean } from "nuqs";
import { useEffect, useState } from "react";

const SIDEBAR_STORAGE_KEY = "lg:sidebar:open";

function getStoredSidebarState(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  // Default to true (open) if not set
  return stored === null ? true : stored === "true";
}

export function useSidebarState() {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useQueryState(
    "sidebarOpen",
    parseAsBoolean.withDefault(true)
  );

  // On mount, check localStorage and update if no URL param
  useEffect(() => {
    if (!initialLoaded) {
      const storedValue = getStoredSidebarState();
      // If URL doesn't have sidebarOpen param, use localStorage value
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has("sidebarOpen")) {
        setSidebarOpen(storedValue);
      }
      setInitialLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded]);

  // Sync to localStorage when state changes
  useEffect(() => {
    if (sidebarOpen !== null) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    }
  }, [sidebarOpen]);

  return [sidebarOpen, setSidebarOpen] as const;
}
