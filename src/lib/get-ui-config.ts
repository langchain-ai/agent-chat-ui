import { defaultUIConfig, UIConfig } from "./ui-config";
import { uiConfig as custom } from "./custom-ui-config";

export const uiConfig: UIConfig = {
  ...defaultUIConfig,
  ...custom,
  brand: {
    ...defaultUIConfig.brand,
    ...(custom.brand || {}),
  },
  layout: {
    ...defaultUIConfig.layout,
    ...(custom.layout || {}),
  },
};
