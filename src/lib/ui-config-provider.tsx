"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import { uiConfig as mergedConfig } from "./get-ui-config";

type ThemeMode = "light" | "dark";

type UIContextValue = {
  config: typeof mergedConfig;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
};

const UIConfigContext = createContext<UIContextValue | undefined>(undefined);

export const UIConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    document.documentElement.classList.toggle("dark", mode === "dark");
    applyCSSVars(mode);
  }, []);

  const applyCSSVars = (mode: ThemeMode) => {
    const root = document.documentElement;
    const colors = mergedConfig.brand.colors?.[mode] || {};
    if (colors.background)
      root.style.setProperty("--background", colors.background);
    if (colors.foreground)
      root.style.setProperty("--foreground", colors.foreground);
    if (colors.primary) root.style.setProperty("--primary", colors.primary);
    if (mergedConfig.brand.radius)
      root.style.setProperty("--radius", mergedConfig.brand.radius);
  };

  return (
    <UIConfigContext.Provider value={{ config: mergedConfig, theme, setTheme }}>
      {children}
    </UIConfigContext.Provider>
  );
};

export default UIConfigContext;
