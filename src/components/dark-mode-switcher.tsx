"use client";

import { Moon, Sun } from "lucide-react";
import { useUIConfig } from "@/hooks/useUIConfig";

export const ThemeToggleButton = () => {
  const { theme, setTheme } = useUIConfig();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="cursor-pointer rounded-full p-0 transition"
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};
