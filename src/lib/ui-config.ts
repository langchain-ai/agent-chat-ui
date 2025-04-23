import type { ReactNode } from "react";

export type UIConfig = {
  brand: {
    colors?: {
      light?: {
        background?: string;
        foreground?: string;
        primary?: string;
      };
      dark?: {
        background?: string;
        foreground?: string;
        primary?: string;
      };
    };
    brandHeaderWelcome?: () => ReactNode;
    brandHeaderTopLeft?: () => ReactNode;
    radius?: string;
  };
  layout?: {
    hideThreadHistory?: boolean;
    hideGithubButton?: boolean;
    hideBrandHeaderAboveChatBox?: boolean;
    showThemeToggle?: boolean;
    hideToolCallsToggleButton?: boolean;
  };
};

export const defaultUIConfig: UIConfig = {
  brand: {
    colors: {
      light: {
        background: "#ffffff",
        foreground: "#000000",
        primary: "#007bff",
      },
      dark: {
        background: "#000000",
        foreground: "#ffffff",
        primary: "#007bff",
      },
    },
  },
};
