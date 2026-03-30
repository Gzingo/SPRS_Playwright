/**
 * AuthApi - API Object for authentication and browser session setup.
 *
 * Fixture name: `authApi`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   // API-only tests:
 *   test("Get admin token", async ({ authApi }) => {
 *     const token = await authApi.loginAsAdmin();
 *     expect(token).toBeTruthy();
 *   });
 *
 *   // Browser session (used by pre-authenticated fixtures):
 *   test("Manual API login", async ({ page, authApi }) => {
 *     await authApi.injectSession(page, "admin", "x");
 *     await expect(page).toHaveURL(/notifications/);
 *   });
 *
 * API notes:
 *   - Auth endpoint: POST /wo/auth
 *   - Auth header: `x-auth-token` (NOT `Authorization: Bearer`)
 *   - API response is missing `username` field (must be added manually)
 *   - API response returns `roles: []` (must be fetched from /wo/roleRelation)
 *   - Browser needs 3 localStorage keys: loginData, settingsData, language
 */
import { type APIRequestContext, type Page, expect } from "@playwright/test";

export interface BrowserSessionData {
  loginData: Record<string, unknown>;
  settingsData: Record<string, unknown>;
  language: string;
}

export class AuthApi {
  constructor(private request: APIRequestContext) {}

  /** Public access to the underlying APIRequestContext for direct API calls */
  get api(): APIRequestContext {
    return this.request;
  }

  // ──────────────────────────────────────────────
  // Low-level API methods
  // ──────────────────────────────────────────────

  /**
   * Send POST /wo/auth with given credentials. Returns raw APIResponse.
   *
   *   const response = await authApi.login("admin", "x");
   *   expect(response.status()).toBe(200);
   */
  async login(username: string, password: string) {
    return this.request.post("/wo/auth", {
      data: { username, password },
      headers: { Accept: "application/json" },
    });
  }

  /**
   * Login and return just the JWT token string.
   *
   *   const token = await authApi.loginAndGetToken("admin", "x");
   */
  async loginAndGetToken(username: string, password: string): Promise<string> {
    const response = await this.login(username, password);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("token");
    return body.token;
  }

  /**
   * Decode a JWT token and assert it has required fields (sub, exp).
   *
   *   const payload = await authApi.validateTokenStructure(token);
   *   expect(payload.sub).toBe("admin");
   */
  async validateTokenStructure(token: string) {
    const parts = token.split(".");
    expect(parts.length).toBe(3);
    const payload = JSON.parse(atob(parts[1]));
    expect(payload).toHaveProperty("sub");
    expect(payload).toHaveProperty("exp");
    return payload;
  }

  /**
   * Login and return full response body.
   *
   *   const data = await authApi.loginAndGetFullResponse("admin", "x");
   */
  async loginAndGetFullResponse(
    username: string,
    password: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.login(username, password);
    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Login and return { status, body, headers } in one call.
   *
   *   const { status, body, headers } = await authApi.getResponseBody("admin", "x");
   */
  async getResponseBody(username: string, password: string) {
    const response = await this.login(username, password);
    return {
      status: response.status(),
      body: await response.json(),
      headers: response.headers(),
    };
  }

  // ──────────────────────────────────────────────
  // x-auth-token API methods
  // ──────────────────────────────────────────────

  /**
   * Fetch user roles from /wo/roleRelation/getUserRoles/{username}.
   * Requires x-auth-token header.
   */
  async fetchRoles(token: string, username: string): Promise<string[]> {
    const resp = await this.request.get(
      `/wo/roleRelation/getUserRoles/${username}`,
      { headers: { "x-auth-token": token } },
    );
    expect(resp.ok()).toBeTruthy();
    return resp.json();
  }

  /**
   * Fetch user settings from /wo/userSettings.
   * Requires x-auth-token header.
   */
  async fetchUserSettings(token: string): Promise<Record<string, unknown>> {
    const resp = await this.request.get("/wo/userSettings", {
      headers: { "x-auth-token": token },
    });
    expect(resp.ok()).toBeTruthy();
    return resp.json();
  }

  // ──────────────────────────────────────────────
  // Browser session methods
  // ──────────────────────────────────────────────

  /**
   * Full browser session setup: API login → fetch roles + settings → build localStorage data.
   * Returns the 3 objects needed for localStorage injection.
   *
   *   const session = await authApi.getBrowserSession("admin", "x");
   *   // session.loginData, session.settingsData, session.language
   */
  async getBrowserSession(
    username: string,
    password: string,
  ): Promise<BrowserSessionData> {
    const authData = await this.loginAndGetFullResponse(username, password);
    const token = authData.token as string;

    const [roles, settingsData] = await Promise.all([
      this.fetchRoles(token, username),
      this.fetchUserSettings(token),
    ]);

    const loginData = { username, ...authData, roles };

    return { loginData, settingsData, language: "sr_RS" };
  }

  /**
   * Inject session data into page localStorage and navigate to the app.
   * This is the all-in-one method: API login → inject → navigate → ready.
   *
   *   await authApi.injectSession(page, "admin", "x");
   *   // page is now authenticated, sidebar loaded
   */
  async injectSession(page: Page, username: string, password: string) {
    const session = await this.getBrowserSession(username, password);

    await page.goto("/wo/#/login");
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(
      ({ login, settings, lang }) => {
        localStorage.setItem("loginData", JSON.stringify(login));
        localStorage.setItem("settingsData", JSON.stringify(settings));
        localStorage.setItem("language", lang);
      },
      { login: session.loginData, settings: session.settingsData, lang: session.language },
    );

    await page.goto("/wo/#/notifications");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  // ──────────────────────────────────────────────
  // Role shortcuts -- token only
  // ──────────────────────────────────────────────

  async loginAsAdmin(): Promise<string> {
    return this.loginAndGetToken(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
  }

  async loginAsAdminFull(): Promise<Record<string, unknown>> {
    return this.loginAndGetFullResponse(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
  }

  async loginAsPisarnica(): Promise<string> {
    return this.loginAndGetToken(
      process.env.PISARNICA_USERNAME!,
      process.env.PISARNICA_PASSWORD!,
    );
  }

  async loginAsPisarnicaFull(): Promise<Record<string, unknown>> {
    return this.loginAndGetFullResponse(
      process.env.PISARNICA_USERNAME!,
      process.env.PISARNICA_PASSWORD!,
    );
  }

  // ──────────────────────────────────────────────
  // Role shortcuts -- browser session injection
  // ──────────────────────────────────────────────

  async injectAdminSession(page: Page) {
    await this.injectSession(
      page,
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
  }

  async injectPisarnicaSession(page: Page) {
    await this.injectSession(
      page,
      process.env.PISARNICA_USERNAME!,
      process.env.PISARNICA_PASSWORD!,
    );
  }

  async injectRasporedjivacSession(page: Page) {
    await this.injectSession(
      page,
      process.env.RASPOREDJIVAC_USERNAME!,
      process.env.RASPOREDJIVAC_PASSWORD!,
    );
  }

  async injectObradjivacSession(page: Page) {
    await this.injectSession(
      page,
      process.env.OBRADJIVAC_USERNAME!,
      process.env.OBRADJIVAC_PASSWORD!,
    );
  }

  async injectNacelnikSPSession(page: Page) {
    await this.injectSession(
      page,
      process.env.NACELNIK_SP_USERNAME!,
      process.env.NACELNIK_SP_PASSWORD!,
    );
  }
}
