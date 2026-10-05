import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: "http://localhost:4173",
    locale: "en-GB",
    // Set PW_CHROMIUM_PATH to use an already-installed Chromium instead of `playwright install`.
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx serve out -l 4173 --no-clipboard",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
