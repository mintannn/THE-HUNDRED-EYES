import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 65000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3001",
    launchOptions: { args: ["--enable-webgl", "--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 960 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "webkit", testMatch: /(?:archive|publishing|voices-sound)\.spec\.ts/, use: { browserName: "webkit", viewport: { width: 1280, height: 900 }, launchOptions: { args: [] } } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
  },
});
