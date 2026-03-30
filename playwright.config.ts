/**
 * Playwright configuration.
 *
 * Run tests:
 *   npm test              → headed (default browser, visible window)
 *   npm run test:headless → headless (no window)
 *   npm run test:e2e      → only E2E tests (tests/e2e/)
 *   npm run test:api      → only API tests (tests/api/)
 *   npm run test:all      → all projects × all tests
 *   npm run report        → open last HTML report
 *
 * Environment variables are loaded from .env file (see .env.example).
 */
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("./.env") });

export default defineConfig({
  timeout: 60000,
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.BASE_URL,
    launchOptions: { args: ["--start-maximized"] },
    viewport: null,
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "headed",
      use: { headless: false },
      retries: 1,
    },
    {
      name: "headless",
      use: { headless: true },
      retries: 2,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--start-maximized"] },
      },
    },
    {
      name: "edge",
      use: {
        ...devices["Desktop Edge"],
        launchOptions: { args: ["--start-maximized"] },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: { args: ["--start-maximized"] },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        launchOptions: { args: ["--start-maximized"] },
      },
    },
  ],
});
