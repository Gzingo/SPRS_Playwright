/**
 * Environment Health Check Test Suite
 *
 * Comprehensive health check for the test environment.
 * Documents all known issues: ERR_CONNECTION_REFUSED, WebSocket failures,
 * token expiry, extension noise, Angular route errors, font 404.
 *
 * Categories:
 *   1. API Connectivity - backend reachable, key endpoints respond
 *   2. Frontend Load - SPA loads, Angular bootstraps
 *   3. WebSocket & Real-time - WebSocket endpoint availability
 *   4. Token & Session - token expiry, re-auth, session persistence
 *   5. Console Error Audit - captures and classifies browser console errors
 *   6. Connection Stability - repeated requests to detect intermittent drops
 *   7. Static Assets - fonts, JS bundles, CSS
 *   8. Incognito Baseline - clean browser without extensions
 */
import { test, expect } from "@fixtures/index";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL;
if (!BASE) throw new Error("BASE_URL environment variable is required");

// ─── 1. API Connectivity ────────────────────────────────────────────────────

test.describe("Health Check - API Connectivity", () => {
  // Valid login returns 200 with token - confirms backend is alive
  test("Auth endpoint is reachable (POST /wo/auth)", async ({ authApi }) => {
    const response = await authApi.login(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(body.token).toBeTruthy();
  });

  // Invalid credentials return 400 (not 500) - error handling works
  test("Auth rejects invalid credentials with 400", async ({ authApi }) => {
    const response = await authApi.login("nonexistent", "wrong");
    expect(response.status()).toBe(400);
  });

  // GET on auth endpoint returns 405 Method Not Allowed
  test("Auth endpoint rejects GET with 405", async ({ request }) => {
    const res = await request.get("/wo/auth");
    expect(res.status()).toBe(405);
  });

  // Sifarnici search endpoint returns results array with data
  test("Sifarnici API returns data (tip-dokumenta)", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const res = await authApi.api.get(
      "/wo/sp/sifarnici/tip-dokumenta/search?page=1&limit=10",
      { headers: { "x-auth-token": token } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    // API returns { results: [...], total: N } (not "content")
    expect(body).toHaveProperty("results");
    expect(Array.isArray(body.results)).toBeTruthy();
    expect(body.results.length).toBeGreaterThan(0);
  });

  // Second sifarnici endpoint also returns data
  test("Sifarnici API returns data (status-dokumenta)", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const res = await authApi.api.get(
      "/wo/sp/sifarnici/status-dokumenta/search?page=1&limit=10",
      { headers: { "x-auth-token": token } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("results");
    expect(body.results.length).toBeGreaterThan(0);
  });

  // Dokumenti search endpoint returns 200
  test("Dokumenti search API responds", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const res = await authApi.api.get(
      "/wo/sp/dokumenti/search?page=1&limit=10&sorting=naziv:asc",
      { headers: { "x-auth-token": token } },
    );
    expect(res.status()).toBe(200);
  });

  // Role relation endpoint returns non-empty roles array for Admin
  test("RoleRelation API responds with roles", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const roles = await authApi.fetchRoles(token, process.env.ADMIN_USERNAME!);
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);
  });

  // User settings endpoint returns an object
  test("UserSettings API responds", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const settings = await authApi.fetchUserSettings(token);
    expect(settings).toBeTruthy();
    expect(typeof settings).toBe("object");
  });

  // Garbage token is rejected with 401
  test("Request with invalid token returns 401", async ({ request }) => {
    const res = await request.get("/wo/sp/dokumenti/search?page=1&limit=10", {
      headers: { "x-auth-token": "invalid-token-12345" },
    });
    expect(res.status()).toBe(401);
  });

  // Missing token header returns 401
  test("Request without token returns 401", async ({ request }) => {
    const res = await request.get("/wo/sp/dokumenti/search?page=1&limit=10");
    expect(res.status()).toBe(401);
  });

  // All 5 configured roles return 200, logs response times
  test("All 5 roles can authenticate", async ({ authApi }) => {
    const roles = [
      {
        name: "Admin",
        user: process.env.ADMIN_USERNAME!,
        pass: process.env.ADMIN_PASSWORD!,
      },
      {
        name: "Pisarnica",
        user: process.env.PISARNICA_USERNAME!,
        pass: process.env.PISARNICA_PASSWORD!,
      },
      {
        name: "Raspoređivač",
        user: process.env.RASPOREDJIVAC_USERNAME!,
        pass: process.env.RASPOREDJIVAC_PASSWORD!,
      },
      {
        name: "Obrađivač",
        user: process.env.OBRADJIVAC_USERNAME!,
        pass: process.env.OBRADJIVAC_PASSWORD!,
      },
      {
        name: "Načelnik SP",
        user: process.env.NACELNIK_SP_USERNAME!,
        pass: process.env.NACELNIK_SP_PASSWORD!,
      },
    ];

    const results: { role: string; status: number; ms: number }[] = [];
    for (const role of roles) {
      const start = Date.now();
      const res = await authApi.login(role.user, role.pass);
      results.push({
        role: role.name,
        status: res.status(),
        ms: Date.now() - start,
      });
    }

    console.log("\n=== Role Authentication ===");
    results.forEach((r) =>
      console.log(`  ${r.role.padEnd(15)} | ${r.status} | ${r.ms}ms`),
    );
    console.log("===========================\n");

    expect(results.every((r) => r.status === 200)).toBeTruthy();
  });
});

// ─── 2. Frontend Load ───────────────────────────────────────────────────────

test.describe("Health Check - Frontend Load", () => {
  // Login page renders username, password, and submit button
  test("Login page loads and renders form", async ({ page }) => {
    await page.goto("/wo/#/login");
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // Login page shows expected title text
  test("Login page title is 'Prijava na sistem'", async ({ page }) => {
    await page.goto("/wo/#/login");
    await expect(page.getByText(/Prijava na sistem/)).toBeVisible();
  });

  // After API login, sidebar navigation is visible
  test("Post-login SPA loads sidebar", async ({ adminPage }) => {
    await expect(
      adminPage.locator(".sp-sidebar, nav.sidebar, aside"),
    ).toBeVisible({ timeout: 15000 });
  });

  // After API login, user display name is visible in header
  test("Post-login displays user info", async ({ adminPage }) => {
    await expect(adminPage.locator(".user")).toBeVisible({ timeout: 10000 });
  });

  // Notifications page renders content header after direct navigation
  test("Notifications page loads after login", async ({ adminPage }) => {
    await adminPage.goto(`${BASE}/wo/#/notifications`);
    await expect(adminPage.locator("section.content-header h1")).toBeVisible({
      timeout: 10000,
    });
  });

  // SD page loads without redirecting to login
  test("Strateski dokumenti page loads", async ({ adminPage }) => {
    await adminPage.goto(`${BASE}/wo/#/sp/strateski-dokument`);
    await adminPage.waitForLoadState("networkidle");
    // Page should have loaded without redirect to login
    await expect(adminPage).not.toHaveURL(/login/);
  });

  // Report generator page loads without redirecting to login
  test("Report generator page loads", async ({ adminPage }) => {
    await adminPage.goto(`${BASE}/wo/#/sp/report-generator`);
    await adminPage.waitForLoadState("networkidle");
    await expect(adminPage).not.toHaveURL(/login/);
  });
});

// ─── 3. WebSocket & Real-time ───────────────────────────────────────────────

test.describe("Health Check - WebSocket", () => {
  // Login via UI and observe WebSocket connection attempts, log findings
  test("WebSocket endpoint availability (ws://...wo/websocket)", async ({
    authApi,
    page,
  }) => {
    const token = await authApi.loginAsAdmin();

    // Listen for WebSocket events
    const wsEvents: { type: string; url?: string; error?: string }[] = [];

    page.on("websocket", (ws) => {
      wsEvents.push({ type: "opened", url: ws.url() });
      ws.on("close", () => wsEvents.push({ type: "closed" }));
      ws.on("socketerror", (error: string) => wsEvents.push({ type: "error", error }));
    });

    // Also capture console errors related to WebSocket
    const wsConsoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && msg.text().includes("WebSocket")) {
        wsConsoleErrors.push(msg.text());
      }
    });

    // Login via UI to trigger natural WebSocket connection
    await page.goto(`${BASE}/wo/#/login`);
    await page.locator("#username").fill(process.env.ADMIN_USERNAME!);
    await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });
    await page.waitForTimeout(5000);

    console.log("\n=== WebSocket Health ===");
    console.log(`WebSocket events: ${wsEvents.length}`);
    wsEvents.forEach((e) => {
      if (e.url) console.log(`  ${e.type}: ${e.url.substring(0, 80)}...`);
      else console.log(`  ${e.type}${e.error ? ": " + e.error : ""}`);
    });
    console.log(`WebSocket console errors: ${wsConsoleErrors.length}`);
    wsConsoleErrors.forEach((e) => console.log(`  ${e.substring(0, 150)}`));

    if (wsConsoleErrors.length > 0) {
      console.log(
        "\nFINDING: WebSocket connection failed. Server may not support WebSocket " +
          "or the endpoint is not configured. This affects real-time notifications.",
      );
    }
    if (wsEvents.length === 0 && wsConsoleErrors.length === 0) {
      console.log("\nINFO: No WebSocket activity detected.");
    }
    console.log("========================\n");

    // Document but don't fail - WS may not be configured on this environment
  });

  // HTTP GET to WebSocket endpoint to check if it exists (informational)
  test("WebSocket endpoint direct probe", async ({ authApi }) => {
    // Try HTTP upgrade request to WebSocket endpoint
    const token = await authApi.loginAsAdmin();
    const res = await authApi.api.get(
      `/wo/websocket?X-Auth-Token=${token}`,
      { failOnStatusCode: false },
    );
    const status = res.status();

    console.log(`\n=== WebSocket Direct Probe ===`);
    console.log(`GET /wo/websocket status: ${status}`);
    if (status === 200 || status === 101) {
      console.log("  WebSocket endpoint is reachable");
    } else if (status === 404) {
      console.log("  FINDING: WebSocket endpoint not found (404)");
    } else if (status === 400) {
      console.log(
        "  WebSocket endpoint exists but requires upgrade (expected for HTTP GET)",
      );
    } else {
      console.log(`  Unexpected status: ${status}`);
    }
    console.log("==============================\n");

    // Document - any status is informational
  });
});

// ─── 4. Token & Session ─────────────────────────────────────────────────────

test.describe("Health Check - Token & Session", () => {
  // JWT token is not expired and valid for at least 5 minutes
  test("Token contains valid expiry (not already expired)", async ({
    authApi,
  }) => {
    const token = await authApi.loginAsAdmin();
    const payload = await authApi.validateTokenStructure(token);
    const expiresIn = payload.exp - Date.now() / 1000;

    console.log(`\n=== Token Expiry ===`);
    console.log(`  Expires in: ${Math.round(expiresIn / 60)} minutes`);
    console.log(`  Created: ${new Date(payload.created).toISOString()}`);
    console.log(`  Expires: ${new Date(payload.exp * 1000).toISOString()}`);
    console.log("====================\n");

    expect(expiresIn).toBeGreaterThan(0);
    // Token should be valid for at least 5 minutes
    expect(expiresIn).toBeGreaterThan(300);
  });

  // Fresh token works on 3 different endpoints without delay
  test("Token works for API calls immediately after login", async ({
    authApi,
  }) => {
    const token = await authApi.loginAsAdmin();

    // Use token immediately for multiple endpoints
    const endpoints = [
      "/wo/sp/dokumenti/search?page=1&limit=1",
      "/wo/roleRelation/getUserRoles/" + process.env.ADMIN_USERNAME,
      "/wo/userSettings",
    ];

    for (const ep of endpoints) {
      const res = await authApi.api.get(ep, {
        headers: { "x-auth-token": token },
      });
      expect(res.status()).toBe(200);
    }
  });

  // Tampered token (last 5 chars replaced) returns 401
  test("Expired/tampered token is rejected", async ({ authApi }) => {
    // Create a valid token then tamper with it
    const token = await authApi.loginAsAdmin();
    const tamperedToken = token.slice(0, -5) + "XXXXX";

    const res = await authApi.api.get(
      "/wo/sp/dokumenti/search?page=1&limit=1",
      {
        headers: { "x-auth-token": tamperedToken },
        failOnStatusCode: false,
      },
    );
    expect(res.status()).toBe(401);
  });

  // Page reload does not redirect to login (session stays in localStorage)
  test("Session persists in browser after page reload", async ({
    adminPage,
  }) => {
    // Should already be logged in via adminPage fixture
    const urlBefore = adminPage.url();
    await adminPage.reload();
    await adminPage.waitForLoadState("networkidle");
    // Should NOT redirect to login
    await expect(adminPage).not.toHaveURL(/login/);
  });

  // Clear localStorage, go to login, re-login succeeds
  test("Re-authentication after logout works", async ({ page }) => {
    // Login
    await page.goto(`${BASE}/wo/#/login`);
    await page.locator("#username").fill(process.env.ADMIN_USERNAME!);
    await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });

    // Logout - clear localStorage to simulate session loss
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE}/wo/#/login`);
    await expect(page.locator("#username")).toBeVisible();

    // Re-login should work
    await page.locator("#username").fill(process.env.ADMIN_USERNAME!);
    await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/login/);
  });

  // Inject expired token, navigate, observe re-auth 400 attempts (informational)
  test("network-interceptor.js re-auth detection (POST /wo/auth 400 after session loss)", async ({
    adminPage,
  }) => {
    // Simulate token expiry by clearing localStorage
    const networkErrors: { url: string; status: number }[] = [];
    adminPage.on("response", (response) => {
      if (response.url().includes("/wo/auth") && response.status() >= 400) {
        networkErrors.push({ url: response.url(), status: response.status() });
      }
    });

    // Kill the session
    await adminPage.evaluate(() => {
      const loginData = localStorage.getItem("loginData");
      if (loginData) {
        const data = JSON.parse(loginData);
        data.token = "expired-token";
        localStorage.setItem("loginData", JSON.stringify(data));
      }
    });

    // Navigate to trigger re-auth attempt
    await adminPage.goto(`${BASE}/wo/#/sp/strateski-dokument`);
    await adminPage.waitForTimeout(3000);

    console.log("\n=== Re-auth Detection ===");
    console.log(`Auth 400 errors captured: ${networkErrors.length}`);
    networkErrors.forEach((e) => console.log(`  ${e.url} -> ${e.status}`));
    if (networkErrors.length > 0) {
      console.log(
        "FINDING: App attempts re-authentication when token is invalid. " +
          "This produces POST /wo/auth 400 errors visible in console.",
      );
    }
    console.log("=========================\n");

    // This is expected behavior - documenting, not failing
  });
});

// ─── 5. Console Error Audit ─────────────────────────────────────────────────

test.describe("Health Check - Console Error Audit", () => {
  // Capture and classify console errors on login page by type
  test("Classify all console errors on login page", async ({ page }) => {
    const consoleErrors: { text: string; type: string }[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({ text: msg.text(), type: msg.type() });
      }
    });

    await page.goto("/wo/#/login");
    await page.waitForTimeout(5000);

    const classified = classifyErrors(consoleErrors.map((e) => e.text));
    printClassifiedErrors("Login Page", classified);
  });

  // Navigate through 4 pages post-login, classify all console errors
  test("Classify console errors after login + navigation", async ({
    adminPage,
  }) => {
    const consoleErrors: string[] = [];
    adminPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Visit multiple pages to trigger various errors
    const pages = [
      "/wo/#/notifications",
      "/wo/#/sp/strateski-dokument",
      "/wo/#/sp/report-generator",
      "/wo/#/sp/srednjorocni-plan",
    ];

    for (const p of pages) {
      await adminPage.goto(`${BASE}${p}`);
      await adminPage.waitForTimeout(2000);
    }

    const classified = classifyErrors(consoleErrors);
    printClassifiedErrors("Post-Login Multi-Page Navigation", classified);
  });

  // Report generator page may produce unique errors (PDF/chart rendering)
  test("Classify console errors on report-generator page", async ({
    adminPage,
  }) => {
    const consoleErrors: string[] = [];
    adminPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await adminPage.goto(`${BASE}/wo/#/sp/report-generator`);
    await adminPage.waitForTimeout(5000);

    const classified = classifyErrors(consoleErrors);
    printClassifiedErrors("Report Generator Page", classified);
  });
});

// ─── 6. Connection Stability ────────────────────────────────────────────────

test.describe("Health Check - Connection Stability", () => {
  // 10 sequential logins, expect at least 9/10 success, log latency spikes
  test("10 consecutive API login requests - measure reliability", async ({
    authApi,
  }) => {
    const results: { attempt: number; status: number | string; ms: number }[] =
      [];

    for (let i = 1; i <= 10; i++) {
      const start = Date.now();
      try {
        const res = await authApi.login(
          process.env.ADMIN_USERNAME!,
          process.env.ADMIN_PASSWORD!,
        );
        results.push({
          attempt: i,
          status: res.status(),
          ms: Date.now() - start,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({
          attempt: i,
          status: `ERROR: ${errorMsg.substring(0, 80)}`,
          ms: Date.now() - start,
        });
      }
    }

    const successes = results.filter((r) => r.status === 200).length;
    const numericResults = results.filter(
      (r) => typeof r.status === "number",
    ) as { ms: number }[];
    const avgMs =
      numericResults.reduce((sum, r) => sum + r.ms, 0) /
      (numericResults.length || 1);
    const maxMs = Math.max(...numericResults.map((r) => r.ms), 0);

    console.log("\n=== Connection Stability (10 sequential) ===");
    console.log("Attempt | Status | Time");
    console.log("-|-|-");
    for (const r of results) {
      const flag = typeof r.status === "number" && r.ms > 2000 ? " ⚠ SLOW" : "";
      console.log(
        `   ${r.attempt.toString().padStart(2)}    |  ${String(r.status).padEnd(6)} | ${r.ms}ms${flag}`,
      );
    }
    console.log(
      `\nSuccess: ${successes}/10 | Avg: ${Math.round(avgMs)}ms | Max: ${maxMs}ms`,
    );
    if (maxMs > 5000) {
      console.log(
        `FINDING: Latency spike detected (${maxMs}ms). Possible GC pause or connection pool exhaustion.`,
      );
    }
    console.log("=============================================\n");

    expect(successes).toBeGreaterThanOrEqual(9);
  });

  // 5 simultaneous logins, expect at least 3/5 success under parallel load
  test("5 parallel API requests - burst test", async ({ authApi }) => {
    const promises = Array.from({ length: 5 }, (_, i) =>
      authApi
        .login(process.env.ADMIN_USERNAME!, process.env.ADMIN_PASSWORD!)
        .then((res) => ({ id: i + 1, status: res.status(), ok: res.ok() }))
        .catch((err) => ({
          id: i + 1,
          status: err instanceof Error ? err.message.substring(0, 60) : "ERR",
          ok: false,
        })),
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.ok).length;
    const failures = results.filter((r) => !r.ok || r.status === 500);

    console.log("\n=== Burst Test (5 parallel logins) ===");
    results.forEach((r) => console.log(`  Request ${r.id}: ${r.status}`));
    console.log(`Success: ${successes}/5`);
    if (failures.length > 0) {
      console.log(
        `FINDING: ${failures.length}/5 requests failed under parallel load. Server may have concurrency issues.`,
      );
    }
    console.log("======================================\n");

    expect(successes).toBeGreaterThanOrEqual(3);
  });

  // Hit 5 key endpoints with valid token, all must return 200
  test("API endpoint health matrix (5 endpoints)", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const endpoints = [
      "/wo/sp/sifarnici/tip-dokumenta/search?page=1&limit=10",
      "/wo/sp/sifarnici/status-dokumenta/search?page=1&limit=10",
      "/wo/sp/dokumenti/search?page=1&limit=10&sorting=naziv:asc",
      "/wo/roleRelation/getUserRoles/" + process.env.ADMIN_USERNAME,
      "/wo/userSettings",
    ];

    const results: { endpoint: string; status: number; ms: number }[] = [];

    for (const endpoint of endpoints) {
      const start = Date.now();
      const res = await authApi.api.get(endpoint, {
        headers: { "x-auth-token": token },
      });
      results.push({
        endpoint: endpoint.split("?")[0].replace("/wo/", ""),
        status: res.status(),
        ms: Date.now() - start,
      });
    }

    console.log("\n=== API Endpoint Health Matrix ===");
    console.log("Endpoint                                  | Status | Time");
    console.log("-|-|-");
    for (const r of results) {
      console.log(`${r.endpoint.padEnd(42)}| ${r.status}    | ${r.ms}ms`);
    }
    console.log("==================================\n");

    expect(results.every((r) => r.status === 200)).toBeTruthy();
  });
});

// ─── 7. Static Assets ───────────────────────────────────────────────────────

test.describe("Health Check - Static Assets", () => {
  // Intercept main.js and polyfills.js responses, verify no 4xx/5xx
  test("Main JS bundles load (main.js, polyfills.js)", async ({ page }) => {
    const assetResponses: { url: string; status: number; size: number }[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("main.") || url.includes("polyfills.")) {
        assetResponses.push({
          url: url.split("/").pop() || url,
          status: response.status(),
          size: Number(response.headers()["content-length"] || 0),
        });
      }
    });

    await page.goto("/wo/#/login");
    await page.waitForTimeout(3000);

    console.log("\n=== JS Bundle Status ===");
    assetResponses.forEach((a) =>
      console.log(
        `  ${a.url.padEnd(45)} | ${a.status} | ${Math.round(a.size / 1024)}KB`,
      ),
    );
    console.log("========================\n");

    expect(assetResponses.length).toBeGreaterThan(0);
    for (const asset of assetResponses) {
      expect(asset.status).toBeLessThan(400);
    }
  });

  // Font file check, 404 is acceptable (non-critical), only 5xx fails
  test("Font arial.ttf availability", async ({ request }) => {
    const res = await request.get("/assets/fonts/arial.ttf", {
      failOnStatusCode: false,
    });
    const status = res.status();

    console.log(`\n=== Font Check ===`);
    console.log(`arial.ttf: ${status}`);
    if (status === 404) {
      console.log(
        "FINDING: Font not deployed. PDF report generator uses fallback. Non-critical.",
      );
    }
    console.log("==================\n");

    // 404 is acceptable (font not deployed), only 5xx is a problem
    expect(status).toBeLessThan(500);
  });

  // Login and check that all lazy-loaded JS chunks return 200
  test("Lazy-loaded chunks are accessible", async ({ page }) => {
    const chunkResponses: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (/\d+\.[a-f0-9]+\.js$/.test(url)) {
        chunkResponses.push({
          url: url.split("/").pop() || url,
          status: response.status(),
        });
      }
    });

    // Login to trigger lazy loading of app chunks
    await page.goto(`${BASE}/wo/#/login`);
    await page.locator("#username").fill(process.env.ADMIN_USERNAME!);
    await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log(`\n=== Lazy Chunks Loaded: ${chunkResponses.length} ===`);
    const failed = chunkResponses.filter((c) => c.status >= 400);
    if (failed.length > 0) {
      console.log("FAILED chunks:");
      failed.forEach((c) => console.log(`  ${c.url}: ${c.status}`));
    } else {
      console.log("All chunks loaded successfully.");
    }
    console.log("================================\n");

    expect(failed.length).toBe(0);
  });
});

// ─── 8. Incognito Baseline ──────────────────────────────────────────────────

test.describe("Health Check - Incognito Baseline", () => {
  // Clean browser without extensions, login + navigate, expect zero extension errors
  test("Zero console errors in clean incognito browser", async () => {
    const browser = await chromium.launch({
      headless: true,
      args: [
        "-incognito",
        "-disable-extensions",
        "-disable-plugins",
        "-no-first-run",
        "-disable-default-apps",
        "-disable-component-extensions-with-background-pages",
      ],
    });

    try {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await context.newPage();

      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      // Login page
      await page.goto(`${BASE}/wo/#/login`);
      await page.waitForTimeout(3000);

      // Login
      await page
        .locator("#username")
        .fill(process.env.ADMIN_USERNAME || "admin");
      await page.locator("#password").fill(process.env.ADMIN_PASSWORD || "x");
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });
      await page.waitForTimeout(3000);

      // Navigate
      await page.goto(`${BASE}/wo/#/sp/strateski-dokument`);
      await page.waitForTimeout(3000);

      await page.goto(`${BASE}/wo/#/sp/report-generator`);
      await page.waitForTimeout(3000);

      const classified = classifyErrors(errors);
      printClassifiedErrors("Incognito Full Flow", classified);

      // In incognito, zero extension errors
      expect(classified.extension).toBe(0);

      await context.close();
    } finally {
      await browser.close();
    }
  });

  // Measure login page render, authentication, and navigation times in clean browser
  test("Page load timing in clean incognito browser", async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ["-incognito", "-disable-extensions"],
    });

    try {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await context.newPage();

      const start = Date.now();
      await page.goto(`${BASE}/wo/#/login`);
      await page.locator("#username").waitFor({ state: "visible" });
      const loginLoadMs = Date.now() - start;

      await page
        .locator("#username")
        .fill(process.env.ADMIN_USERNAME || "admin");
      await page.locator("#password").fill(process.env.ADMIN_PASSWORD || "x");
      const loginStart = Date.now();
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/.*#(?!.*login).*/, { timeout: 15000 });
      await page.waitForLoadState("networkidle");
      const authMs = Date.now() - loginStart;

      const navStart = Date.now();
      await page.goto(`${BASE}/wo/#/sp/strateski-dokument`);
      await page.waitForLoadState("networkidle");
      const navMs = Date.now() - navStart;

      console.log("\n=== Incognito Page Load Timing ===");
      console.log(`  Login page render:  ${loginLoadMs}ms`);
      console.log(`  Authentication:     ${authMs}ms`);
      console.log(`  Navigate to SD:     ${navMs}ms`);
      console.log(`  Total:              ${loginLoadMs + authMs + navMs}ms`);
      console.log("===================================\n");

      expect(loginLoadMs).toBeLessThan(15000);
      expect(authMs).toBeLessThan(15000);

      await context.close();
    } finally {
      await browser.close();
    }
  });
});

// ─── Helper: Error Classification ───────────────────────────────────────────

interface ClassifiedErrors {
  total: number;
  extension: number;
  route: number;
  connection: number;
  websocket: number;
  reauth: number;
  font: number;
  application: number;
  details: {
    extension: string[];
    route: string[];
    connection: string[];
    websocket: string[];
    reauth: string[];
    font: string[];
    application: string[];
  };
}

function classifyErrors(errors: string[]): ClassifiedErrors {
  const result: ClassifiedErrors = {
    total: errors.length,
    extension: 0,
    route: 0,
    connection: 0,
    websocket: 0,
    reauth: 0,
    font: 0,
    application: 0,
    details: {
      extension: [],
      route: [],
      connection: [],
      websocket: [],
      reauth: [],
      font: [],
      application: [],
    },
  };

  for (const e of errors) {
    if (
      e.includes("Could not establish connection") ||
      e.includes("whatsapp") ||
      e.includes("chatgpt") ||
      e.includes("injectAIMarker") ||
      e.includes("EmbeddedPDF") ||
      e.includes("content-script") ||
      e.includes("ch-content-script") ||
      e.includes("network-interceptor")
    ) {
      result.extension++;
      result.details.extension.push(e.substring(0, 120));
    } else if (e.includes("NG04002")) {
      result.route++;
      result.details.route.push(e.substring(0, 120));
    } else if (
      e.includes("ERR_CONNECTION_REFUSED") ||
      e.includes("net::ERR_")
    ) {
      result.connection++;
      result.details.connection.push(e.substring(0, 120));
    } else if (e.includes("WebSocket") || e.includes("websocket")) {
      result.websocket++;
      result.details.websocket.push(e.substring(0, 120));
    } else if (
      e.includes("/wo/auth") &&
      (e.includes("400") || e.includes("Bad Request"))
    ) {
      result.reauth++;
      result.details.reauth.push(e.substring(0, 120));
    } else if (e.includes("arial.ttf") || e.includes("Failed to fetch")) {
      result.font++;
      result.details.font.push(e.substring(0, 120));
    } else {
      result.application++;
      result.details.application.push(e.substring(0, 200));
    }
  }

  return result;
}

function printClassifiedErrors(context: string, c: ClassifiedErrors) {
  console.log(`\n=== Console Error Audit: ${context} ===`);
  console.log(`Total: ${c.total}`);
  console.log(
    `  Extension errors:     ${c.extension} (browser extensions - harmless)`,
  );
  console.log(`  Route errors:         ${c.route} (Angular NG04002 - known)`);
  console.log(
    `  Connection errors:    ${c.connection} (ERR_CONNECTION_REFUSED - intermittent)`,
  );
  console.log(
    `  WebSocket errors:     ${c.websocket} (WS endpoint - server config)`,
  );
  console.log(
    `  Re-auth errors:       ${c.reauth} (POST /wo/auth 400 - token expired)`,
  );
  console.log(
    `  Font errors:          ${c.font} (arial.ttf 404 - non-critical)`,
  );
  console.log(`  Application errors:   ${c.application} (INVESTIGATE)`);
  if (c.details.application.length > 0) {
    console.log("  App error details:");
    c.details.application.forEach((e) => console.log(`    - ${e}`));
  }
  console.log(`${"=".repeat(40 + context.length)}\n`);
}
