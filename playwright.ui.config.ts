import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  testMatch: "research-inspector-ui.spec.ts",
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3010",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "corepack pnpm@10.5.1 dev --port 3010",
        url: "http://127.0.0.1:3010",
        reuseExistingServer: true,
      },
});
