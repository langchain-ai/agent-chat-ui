export interface ClientBranding {
  name: string;
  brand_title: string;
  logo_url?: string;
  colors: {
    primary: string;
    secondary: string;
    text_primary: string;
    accent_green?: string;
  };
  style: {
    border_radius: string;
    button_radius: string;
    font_family: string;
  };
}

export interface BrandingConfig {
  active_client: string;
  clients: Record<string, ClientBranding>;
}

export const defaultBranding: ClientBranding = {
  name: "Reflexion",
  brand_title: "Reflexion Agent",
  colors: {
    primary: "#000000",
    secondary: "#71717a",
    text_primary: "#000000"
  },
  style: {
    border_radius: "0.625rem",
    button_radius: "0.625rem",
    font_family: "Inter, sans-serif"
  }
};

export const daikinBranding: ClientBranding = {
  name: "Daikin",
  brand_title: "Reflexion | Daikin",
  logo_url: "/daikin_logo.png", // Assuming we will add this asset or use remote URL
  colors: {
    primary: "#009FDE",
    secondary: "#69C6EF",
    text_primary: "#221F20",
    accent_green: "#15C015"
  },
  style: {
    border_radius: "1rem",
    button_radius: "9999px",
    font_family: "Martian B Thai, Inter, sans-serif"
  }
};

export const umnMorrisBranding: ClientBranding = {
  name: "University of Minnesota Morris",
  brand_title: "Reflexion | UMN Morris",
  colors: {
    primary: "#7A0019", // UMN Maroon
    secondary: "#FFB81C", // UMN Gold
    text_primary: "#000000"
  },
  style: {
    border_radius: "0.625rem",
    button_radius: "0.625rem",
    font_family: "Inter, sans-serif"
  }
};

export function getBranding(clientName?: string): ClientBranding {
  if (clientName === "daikin") return daikinBranding;
  if (clientName === "umn-morris") return umnMorrisBranding;
  return defaultBranding;
}
