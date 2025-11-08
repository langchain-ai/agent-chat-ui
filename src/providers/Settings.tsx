import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ChatConfig, defaultConfig, loadConfig } from "@/lib/config";

// User settings that can be customized in the UI
export interface UserSettings {
  fontFamily: "sans" | "serif" | "mono";
  fontSize: "small" | "medium" | "large";
  colorScheme: "light" | "dark" | "auto";
  autoCollapseToolCalls: boolean;
  chatWidth: "default" | "wide";
}

interface SettingsContextType {
  config: ChatConfig;
  userSettings: UserSettings;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  resetUserSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "agent-chat-user-settings";

// Load user settings from localStorage
function loadUserSettings(): Partial<UserSettings> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading user settings:", error);
    return {};
  }
}

// Save user settings to localStorage
function saveUserSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving user settings:", error);
  }
}

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  const [isHydrated, setIsHydrated] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    fontFamily: defaultConfig.theme.fontFamily,
    fontSize: defaultConfig.theme.fontSize,
    colorScheme: defaultConfig.theme.colorScheme,
    autoCollapseToolCalls: defaultConfig.ui.autoCollapseToolCalls,
    chatWidth: defaultConfig.ui.chatWidth,
  });

  // Load config on mount
  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  // Load user settings from localStorage after hydration
  useEffect(() => {
    const stored = loadUserSettings();
    setUserSettings({
      fontFamily: stored.fontFamily || defaultConfig.theme.fontFamily,
      fontSize: stored.fontSize || defaultConfig.theme.fontSize,
      colorScheme: stored.colorScheme || defaultConfig.theme.colorScheme,
      autoCollapseToolCalls: stored.autoCollapseToolCalls ?? defaultConfig.ui.autoCollapseToolCalls,
      chatWidth: stored.chatWidth || defaultConfig.ui.chatWidth,
    });
    setIsHydrated(true);
  }, []);

  // Apply theme settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Apply font family
    const fontFamilyMap = {
      sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    };
    root.style.setProperty("--font-family", fontFamilyMap[userSettings.fontFamily]);

    // Apply font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.setProperty("--base-font-size", fontSizeMap[userSettings.fontSize]);

    // Apply color scheme
    if (userSettings.colorScheme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.toggle("dark", userSettings.colorScheme === "dark");
    }
  }, [userSettings]);

  const updateUserSettings = (settings: Partial<UserSettings>) => {
    setUserSettings((prev) => {
      const newSettings = { ...prev, ...settings };
      saveUserSettings(newSettings);
      return newSettings;
    });
  };

  const resetUserSettings = () => {
    const defaultUserSettings: UserSettings = {
      fontFamily: config.theme.fontFamily,
      fontSize: config.theme.fontSize,
      colorScheme: config.theme.colorScheme,
      autoCollapseToolCalls: config.ui.autoCollapseToolCalls,
      chatWidth: config.ui.chatWidth,
    };
    setUserSettings(defaultUserSettings);
    saveUserSettings(defaultUserSettings);
  };

  return (
    <SettingsContext.Provider
      value={{ config, userSettings, updateUserSettings, resetUserSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
