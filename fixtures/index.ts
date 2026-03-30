/**
 * Combined fixtures - merges Page Object and API Object fixtures into a single `test` export.
 *
 * This is the main import for ALL test files:
 *   import { test, expect } from "../../fixtures/index";
 *
 * Available fixtures:
 *
 *   Page Objects (UI interaction):
 *   - loginPage  → LoginPage           (login form, goto, loginAs* shortcuts)
 *   - sidebar    → SidebarPage         (sidebar navigation)
 *   - docList    → DocumentListPage    (table/list interactions)
 *   - docForm    → DocumentFormPage    (form fill/select/save)
 *   - common     → CommonComponents   (modals, toasts, tabs, pagination)
 *   - wizard     → WizardPage         (multi-step wizard modals)
 *
 *   API Objects:
 *   - authApi    → AuthApi            (POST /wo/auth + browser session injection)
 *
 *   Pre-authenticated pages -- API login (fast, ~5s):
 *   - adminPage         → Page  (Super-admin / eDocumentus Administrator)
 *   - pisarnicaPage     → Page  (Pisarnica obrada -- PSOB)
 *   - rasporedjivacPage → Page  (Pisarnica raspoređivač -- RASP)
 *   - obradjivacPage    → Page  (Pisarnica obrađivač -- OBR)
 *   - nacelnikSPPage    → Page  (Načelnik SP -- НОСП + ПСПР)
 *
 *   Pre-authenticated pages -- UI login (slower ~8s, for when API login has issues):
 *   - adminPageUI         → Page
 *   - pisarnicaPageUI     → Page
 *   - rasporedjivacPageUI → Page
 *   - obradjivacPageUI    → Page
 *   - nacelnikSPPageUI    → Page
 *
 * Example -- API-login pre-authenticated page (default, fast):
 *   test("Create document", async ({ adminPage, sidebar }) => {
 *     await sidebar.openModule("Стратешки документи");
 *   });
 *
 * Example -- UI-login pre-authenticated page (fallback):
 *   test("Create document", async ({ adminPageUI, sidebar }) => {
 *     await sidebar.openModule("Стратешки документи");
 *   });
 *
 * Example -- test that explicitly tests login flow (use loginPage):
 *   test("Admin login", async ({ loginPage, page }) => {
 *     await loginPage.loginAsAdmin();
 *     await expect(page).toHaveURL(/notifications/);
 *   });
 */
import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SidebarPage } from "../pages/SidebarPage";
import { DocumentListPage } from "../pages/DocumentListPage";
import { DocumentFormPage } from "../pages/DocumentFormPage";
import { CommonComponents } from "../pages/CommonComponents";
import { WizardPage } from "../pages/WizardPage";
import { DocumentDetailPage } from "../pages/DocumentDetailPage";
import { AuthApi } from "../api/AuthApi";

type AllFixtures = {
  loginPage: LoginPage;
  sidebar: SidebarPage;
  docList: DocumentListPage;
  docForm: DocumentFormPage;
  common: CommonComponents;
  wizard: WizardPage;
  docDetail: DocumentDetailPage;
  authApi: AuthApi;
  // API login (fast)
  adminPage: Page;
  pisarnicaPage: Page;
  rasporedjivacPage: Page;
  obradjivacPage: Page;
  nacelnikSPPage: Page;
  // UI login (fallback)
  adminPageUI: Page;
  pisarnicaPageUI: Page;
  rasporedjivacPageUI: Page;
  obradjivacPageUI: Page;
  nacelnikSPPageUI: Page;
};

export const test = base.extend<AllFixtures>({
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
  wizard: async ({ page }, use) => {
    await use(new WizardPage(page));
  },
  docDetail: async ({ page }, use) => {
    await use(new DocumentDetailPage(page));
  },
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },

  // ─── Pre-authenticated pages: API login (fast) ───

  adminPage: async ({ page, request }, use) => {
    const authApi = new AuthApi(request);
    await authApi.injectAdminSession(page);
    await use(page);
  },

  pisarnicaPage: async ({ page, request }, use) => {
    const authApi = new AuthApi(request);
    await authApi.injectPisarnicaSession(page);
    await use(page);
  },

  rasporedjivacPage: async ({ page, request }, use) => {
    const authApi = new AuthApi(request);
    await authApi.injectRasporedjivacSession(page);
    await use(page);
  },

  obradjivacPage: async ({ page, request }, use) => {
    const authApi = new AuthApi(request);
    await authApi.injectObradjivacSession(page);
    await use(page);
  },

  nacelnikSPPage: async ({ page, request }, use) => {
    const authApi = new AuthApi(request);
    await authApi.injectNacelnikSPSession(page);
    await use(page);
  },

  // ─── Pre-authenticated pages: UI login (fallback) ───

  adminPageUI: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsAdmin();
    await use(page);
  },

  pisarnicaPageUI: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsPisarnica();
    await use(page);
  },

  rasporedjivacPageUI: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsRasporedjivac();
    await use(page);
  },

  obradjivacPageUI: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsObradjivac();
    await use(page);
  },

  nacelnikSPPageUI: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAsNacelnikSP();
    await use(page);
  },
});

export { expect, type Page } from "@playwright/test";
