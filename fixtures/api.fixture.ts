/**
 * API-only fixtures - use this when a test file only needs API Object Model (no browser UI).
 *
 * Import:
 *   import { test } from "../../fixtures/api.fixture";
 *   import { expect } from "@playwright/test";
 *
 * Available fixtures: authApi
 * (Add more API objects here as the framework grows, e.g. spApi, epApi)
 *
 * Prefer importing from "../../fixtures/index" for most tests.
 * This file exists for pure API test files that don't need browser context.
 */
import { test as base } from "@playwright/test";
import { AuthApi } from "../api/AuthApi";

export type ApiFixtures = {
  authApi: AuthApi;
};

export const test = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },
});
