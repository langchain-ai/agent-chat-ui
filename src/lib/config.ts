import yaml from "js-yaml";

export interface ChatConfig {
  branding: {
    appName: string;
    logoPath: string;
    logoWidth: number;
    logoHeight: number;
    description?: string;
    chatOpeners?: string[];
    fullDescription?: string;
  };
  buttons: {
    enableFileUpload: boolean;
    chatInputPlaceholder: string;
  };
  threads: {
    showHistory: boolean;
    enableDeletion: boolean;
    enableTitleEdit: boolean;
    autoGenerateTitles: boolean;
    sidebarOpenByDefault: boolean;
  };
  theme: {
    fontFamily: "sans" | "serif" | "mono";
    fontSize: "small" | "medium" | "large";
    colorScheme: "light" | "dark" | "auto";
  };
  ui: {
    autoCollapseToolCalls: boolean;
    chatWidth: "default" | "wide";
  };
}

// Default configuration
export const defaultConfig: ChatConfig = {
  branding: {
    appName: "TeddyNote Chat",
    logoPath: "/logo.png",
    logoWidth: 32,
    logoHeight: 32,
    description: "AI 어시스턴트와 대화를 시작하세요",
    chatOpeners: [
      "오늘의 날씨는 어때?",
      "간단한 요리 레시피 추천해줘",
      "Python 코딩 도움이 필요해",
      "재미있는 이야기 들려줘",
    ],
    fullDescription: "/full-description.md",
  },
  buttons: {
    enableFileUpload: true,
    chatInputPlaceholder: "무엇이든 물어보세요",
  },
  threads: {
    showHistory: false,
    enableDeletion: true,
    enableTitleEdit: true,
    autoGenerateTitles: true,
    sidebarOpenByDefault: false,
  },
  theme: {
    fontFamily: "sans",
    fontSize: "medium",
    colorScheme: "light",
  },
  ui: {
    autoCollapseToolCalls: true,
    chatWidth: "wide",
  },
};

// Load configuration from YAML file
export async function loadConfig(): Promise<ChatConfig> {
  try {
    // Try to load settings.yaml first, fallback to chat-config.yaml
    let response = await fetch("/settings.yaml");
    if (!response.ok) {
      response = await fetch("/chat-config.yaml");
    }
    if (!response.ok) {
      console.warn("Failed to load settings.yaml or chat-config.yaml, using default config");
      return defaultConfig;
    }
    const yamlText = await response.text();
    const config = yaml.load(yamlText) as Partial<ChatConfig>;
    // Merge with default config to ensure all required fields exist
    return {
      branding: { ...defaultConfig.branding, ...config.branding },
      buttons: { ...defaultConfig.buttons, ...config.buttons },
      threads: { ...defaultConfig.threads, ...config.threads },
      theme: { ...defaultConfig.theme, ...config.theme },
      ui: { ...defaultConfig.ui, ...config.ui },
    };
  } catch (error) {
    console.error("Error loading config:", error);
    return defaultConfig;
  }
}
