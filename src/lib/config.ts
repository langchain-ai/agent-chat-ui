import yaml from "js-yaml";

export interface ChatConfig {
  branding: {
    appName: string;
    logoPath: string;
    logoWidth: number;
    logoHeight: number;
    description?: string;
    chatOpeners?: string[];
  };
  buttons: {
    enableFileUpload: boolean;
    fileUploadText: string;
    submitButtonText: string;
    cancelButtonText: string;
    chatInputPlaceholder: string;
  };
  tools: {
    showToolCalls: boolean;
    displayMode: "detailed" | "compact";
    enabledTools: string[];
    disabledTools: string[];
  };
  messages: {
    maxWidth: number;
    enableMarkdown: boolean;
    enableMath: boolean;
    enableCodeHighlight: boolean;
    enableTables: boolean;
  };
  threads: {
    showHistory: boolean;
    enableDeletion: boolean;
    enableTitleEdit: boolean;
    autoGenerateTitles: boolean;
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
  features: {
    artifactViewer: boolean;
    fileUploads: boolean;
    imagePreview: boolean;
    pdfPreview: boolean;
  };
}

// Default configuration
export const defaultConfig: ChatConfig = {
  branding: {
    appName: "Agent Chat",
    logoPath: "/logo.svg",
    logoWidth: 32,
    logoHeight: 32,
    description: "AI 어시스턴트와 대화를 시작하세요",
    chatOpeners: [
      "오늘의 날씨는 어때?",
      "간단한 요리 레시피 추천해줘",
      "Python 코딩 도움이 필요해",
      "재미있는 이야기 들려줘",
    ],
  },
  buttons: {
    enableFileUpload: true,
    fileUploadText: "Upload PDF or Image",
    submitButtonText: "Send",
    cancelButtonText: "Cancel",
    chatInputPlaceholder: "무엇이든 물어보세요",
  },
  tools: {
    showToolCalls: true,
    displayMode: "detailed",
    enabledTools: [],
    disabledTools: [],
  },
  messages: {
    maxWidth: 768,
    enableMarkdown: true,
    enableMath: true,
    enableCodeHighlight: true,
    enableTables: true,
  },
  threads: {
    showHistory: false,
    enableDeletion: true,
    enableTitleEdit: true,
    autoGenerateTitles: true,
  },
  theme: {
    fontFamily: "sans",
    fontSize: "medium",
    colorScheme: "light",
  },
  ui: {
    autoCollapseToolCalls: true,
    chatWidth: "default",
  },
  features: {
    artifactViewer: true,
    fileUploads: true,
    imagePreview: true,
    pdfPreview: true,
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
      tools: { ...defaultConfig.tools, ...config.tools },
      messages: { ...defaultConfig.messages, ...config.messages },
      threads: { ...defaultConfig.threads, ...config.threads },
      theme: { ...defaultConfig.theme, ...config.theme },
      ui: { ...defaultConfig.ui, ...config.ui },
      features: { ...defaultConfig.features, ...config.features },
    };
  } catch (error) {
    console.error("Error loading config:", error);
    return defaultConfig;
  }
}
