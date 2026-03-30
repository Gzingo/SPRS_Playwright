/**
 * LoginPage - Page Object for the login screen.
 *
 * Fixture name: `loginPage`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   // Quick login with role shortcut (navigates + fills + clicks + waits):
 *   test("Admin login", async ({ loginPage, page }) => {
 *     await loginPage.loginAsAdmin();
 *     await expect(page).toHaveURL(/notifications/);
 *   });
 *
 *   test("Pisarnica login", async ({ loginPage, page }) => {
 *     await loginPage.loginAsPisarnica();
 *     await expect(page).toHaveURL(/notifications/);
 *   });
 *
 *   // Manual login with custom credentials (for negative/security tests):
 *   test("Negative login", async ({ loginPage }) => {
 *     await loginPage.goto();
 *     await loginPage.login("invalid", "wrong");
 *     await expect(loginPage.errorMessage).toBeVisible();
 *   });
 *
 *   test("Empty fields validation", async ({ loginPage }) => {
 *     await loginPage.goto();
 *     await loginPage.leaveInputsEmpty();
 *     await expect(loginPage.validationMessages.first()).toBeVisible();
 *   });
 */
import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly validationMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.getByText(/Neuspešna prijava na sistem/);
    this.validationMessages = page.getByText(/Ово поље је обавезно/);
  }

  /**
   * Navigate to the login page.
   *
   *   await loginPage.goto();
   */
  async goto() {
    await this.page.goto('/wo/#/login');
  }

  /**
   * Fill username + password, then click submit button.
   *
   *   await loginPage.login("admin", "x");
   *   await loginPage.login(process.env.ADMIN_USERNAME!, process.env.ADMIN_PASSWORD!);
   */
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Fill username + password, then press Enter to submit (instead of clicking button).
   *
   *   await loginPage.loginWithEnterKey("admin", "x");
   */
  async loginWithEnterKey(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }

  /**
   * Clear both input fields. Use before asserting validation messages.
   *
   *   await loginPage.leaveInputsEmpty();
   *   await loginPage.submitButton.click();
   *   await expect(loginPage.validationMessages.first()).toBeVisible();
   */
  async leaveInputsEmpty() {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Full login flow as Admin role: navigate to login page, fill credentials, submit, wait for redirect.
   * Credentials are read from process.env (ADMIN_USERNAME, ADMIN_PASSWORD).
   *
   *   await loginPage.loginAsAdmin();
   *   await expect(page).toHaveURL(/notifications/);
   */
  async loginAsAdmin() {
    await this.goto();
    await this.login(process.env.ADMIN_USERNAME!, process.env.ADMIN_PASSWORD!);
    await this.page.waitForURL(/.*#(?!.*login).*/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Full login flow as Pisarnica role: navigate to login page, fill credentials, submit, wait for redirect.
   * Credentials are read from process.env (PISARNICA_USERNAME, PISARNICA_PASSWORD).
   *
   *   await loginPage.loginAsPisarnica();
   *   await expect(page).toHaveURL(/notifications/);
   */
  async loginAsPisarnica() {
    await this.goto();
    await this.login(process.env.PISARNICA_USERNAME!, process.env.PISARNICA_PASSWORD!);
    await this.page.waitForURL(/.*#(?!.*login).*/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Full login flow as Raspoređivač role.
   * Credentials: RASPOREDJIVAC_USERNAME / RASPOREDJIVAC_PASSWORD
   *
   *   await loginPage.loginAsRasporedjivac();
   */
  async loginAsRasporedjivac() {
    await this.goto();
    await this.login(process.env.RASPOREDJIVAC_USERNAME!, process.env.RASPOREDJIVAC_PASSWORD!);
    await this.page.waitForURL(/.*#(?!.*login).*/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Full login flow as Obrađivač role.
   * Credentials: OBRADJIVAC_USERNAME / OBRADJIVAC_PASSWORD
   *
   *   await loginPage.loginAsObradjivac();
   */
  async loginAsObradjivac() {
    await this.goto();
    await this.login(process.env.OBRADJIVAC_USERNAME!, process.env.OBRADJIVAC_PASSWORD!);
    await this.page.waitForURL(/.*#(?!.*login).*/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Full login flow as Načelnik SP role (НОСП + ПСПР groups).
   * Credentials: NACELNIK_SP_USERNAME / NACELNIK_SP_PASSWORD
   *
   *   await loginPage.loginAsNacelnikSP();
   */
  async loginAsNacelnikSP() {
    await this.goto();
    await this.login(process.env.NACELNIK_SP_USERNAME!, process.env.NACELNIK_SP_PASSWORD!);
    await this.page.waitForURL(/.*#(?!.*login).*/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the sign-out icon, wait for confirmation dialog, click OK.
   * Call this after a successful login to test logout flow.
   *
   *   await loginPage.login("admin", "x");
   *   await expect(page).toHaveURL(/strateski-dokument/);
   *   await loginPage.logout();
   *   await expect(page).toHaveURL(/login/);
   */
  async logout() {
    await this.page.locator('i.fa-sign-out').click();
    await expect(this.page.getByRole('dialog')).toBeVisible();
    await this.page.getByRole('button', { name: 'OK' }).click();
  }
}
