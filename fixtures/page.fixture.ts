/**
 * Page-only fixtures - use this when a test file only needs Page Object Model (no API).
 *
 * Import:
 *   import { test } from "../../fixtures/page.fixture";
 *   import { expect } from "@playwright/test";
 *
 * Available fixtures: loginPage, sidebar, docList, docForm, common
 *
 * Prefer importing from "../../fixtures/index" for most tests.
 * This file exists for cases where you want to avoid loading API fixtures.
 */
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SidebarPage } from "../pages/SidebarPage";
import { DocumentListPage } from "../pages/DocumentListPage";
import { DocumentFormPage } from "../pages/DocumentFormPage";
import { CommonComponents } from "../pages/CommonComponents";

export type PageFixtures = {
  loginPage: LoginPage;
  sidebar: SidebarPage;
  docList: DocumentListPage;
  docForm: DocumentFormPage;
  common: CommonComponents;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  sidebar: async ({ page }, use) => {
    await use(new SidebarPage(page));
  },
  docList: async ({ page }, use) => {
    await use(new DocumentListPage(page));
  },
  docForm: async ({ page }, use) => {
    await use(new DocumentFormPage(page));
  },
  common: async ({ page }, use) => {
    await use(new CommonComponents(page));
  },
});
