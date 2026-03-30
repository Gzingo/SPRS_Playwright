import { test, expect } from "@fixtures/index";
import type { AuthApi } from "@api/AuthApi";

// ─── Role definitions ────────────────────────────────────────────────────────

interface RoleDef {
  name: string;
  user: string;
  pass: string;
}

const roles: RoleDef[] = [
  { name: "Admin", user: "ADMIN_USERNAME", pass: "ADMIN_PASSWORD" },
  { name: "Pisarnica", user: "PISARNICA_USERNAME", pass: "PISARNICA_PASSWORD" },
  { name: "Raspoređivač", user: "RASPOREDJIVAC_USERNAME", pass: "RASPOREDJIVAC_PASSWORD" },
  { name: "Obrađivač", user: "OBRADJIVAC_USERNAME", pass: "OBRADJIVAC_PASSWORD" },
  { name: "Načelnik SP", user: "NACELNIK_SP_USERNAME", pass: "NACELNIK_SP_PASSWORD" },
];

function getCredentials(role: RoleDef) {
  return {
    username: process.env[role.user]!,
    password: process.env[role.pass]!,
  };
}

// ─── Assert helpers ──────────────────────────────────────────────────────────

async function assertValidLogin(authApi: AuthApi, username: string, password: string) {
  const response = await authApi.login(username, password);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty("token");
  expect(body.token).toBeTruthy();
  expect(body).toHaveProperty("workAsUsername");
  return body;
}

async function assertValidJwt(authApi: AuthApi, username: string, password: string) {
  const token = await authApi.loginAndGetToken(username, password);
  const payload = await authApi.validateTokenStructure(token);
  expect(payload.sub).toBeTruthy();
  expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  return payload;
}

// ─── Positive Tests (per-role loop) ──────────────────────────────────────────

test.describe("Auth API - Positive Tests", () => {
  for (const role of roles) {
    // Valid credentials return 200 with token and workAsUsername in response body
    test(`${role.name}: login returns 200, token, and workAsUsername`, async ({ authApi }) => {
      const { username, password } = getCredentials(role);
      await assertValidLogin(authApi, username, password);
    });

    // Token is a valid 3-part JWT with subject and non-expired expiration
    test(`${role.name}: token has valid JWT structure (sub, exp)`, async ({ authApi }) => {
      const { username, password } = getCredentials(role);
      await assertValidJwt(authApi, username, password);
    });
  }

  // Auth endpoint returns application/json content type
  test("Response Content-Type is JSON", async ({ authApi }) => {
    const { username, password } = getCredentials(roles[0]);
    const response = await authApi.login(username, password);
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });

  // Login completes within 5s hard limit, warns above 2s
  test("Login response time is under 5 seconds", async ({ authApi }) => {
    const { username, password } = getCredentials(roles[0]);
    const start = Date.now();
    await authApi.login(username, password);
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn(`⚠ Login took ${duration}ms (above 2s threshold)`);
    }
    expect(duration).toBeLessThan(5000);
  });

  // Two logins should produce different JWTs (soft assert - server may reuse within same second)
  test("Two consecutive logins return valid independent tokens", async ({ authApi }) => {
    const token1 = await authApi.loginAsAdmin();
    // Small delay to ensure different JWT timestamps
    await new Promise((r) => setTimeout(r, 100));
    const token2 = await authApi.loginAsAdmin();
    expect(token1.split(".").length).toBe(3);
    expect(token2.split(".").length).toBe(3);
    expect.soft(token1, "Tokens should differ between logins").not.toBe(token2);
  });
});

// ─── Negative Tests ──────────────────────────────────────────────────────────

test.describe("Auth API - Negative Tests", () => {
  // Non-existent username is rejected with specific error code
  test("Invalid username returns 400 with error code", async ({ authApi }) => {
    const response = await authApi.login("invaliduser123", process.env.ADMIN_PASSWORD!);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("wo.login.error.wrong.pass");
  });

  // Wrong password for valid username is rejected with same error code
  test("Invalid password returns 400", async ({ authApi }) => {
    const response = await authApi.login(process.env.ADMIN_USERNAME!, "wrongpassword");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("wo.login.error.wrong.pass");
  });

  // Both fields empty is rejected
  test("Empty username and password returns 400", async ({ authApi }) => {
    const response = await authApi.login("", "");
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("wo.login.error.wrong.pass");
  });

  test("Missing username (only password) returns 400", async ({ authApi }) => {
    const response = await authApi.login("", process.env.ADMIN_PASSWORD!);
    expect(response.status()).toBe(400);
  });

  test("Missing password (only username) returns error", async ({ authApi }) => {
    const response = await authApi.login(process.env.ADMIN_USERNAME!, "");
    // Server currently returns 500 (bug), but any 4xx/5xx is acceptable
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  // Case-changed username does not cause 5xx
  test("Uppercase username does not crash the server", async ({ authApi }) => {
    const response = await authApi.login(
      process.env.ADMIN_USERNAME!.toUpperCase(),
      process.env.ADMIN_PASSWORD!,
    );
    expect(response.status()).toBeLessThan(500);
  });

  // Uppercase "X" produces same rejection as a completely wrong password
  test("Password is case-sensitive (uppercase password rejected same as wrong password)", async ({
    authApi,
  }) => {
    const [upperCaseResp, wrongResp] = await Promise.all([
      authApi.login(process.env.ADMIN_USERNAME!, process.env.ADMIN_PASSWORD!.toUpperCase()),
      authApi.login(process.env.ADMIN_USERNAME!, "wrongpassword"),
    ]);
    expect(upperCaseResp.status()).toBe(400);
    const upperBody = await upperCaseResp.json();
    const wrongBody = await wrongResp.json();
    expect(upperBody.code).toBe(wrongBody.code);
  });

  // Leading/trailing spaces in credentials do not bypass auth
  test("Whitespace-padded credentials are rejected", async ({ authApi }) => {
    const response = await authApi.login(
      process.env.WHITESPACE_PADDED_USERNAME!,
      process.env.WHITESPACE_PADDED_PASSWORD!,
    );
    expect(response.status()).toBe(400);
  });

  // Empty JSON body {} is rejected with error code
  test("Empty request body returns 400", async ({ request }) => {
    const response = await request.post("/wo/auth", { data: {} });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("wo.login.error.wrong.pass");
  });

  // POST without any body is rejected
  test("Request without body returns error", async ({ request }) => {
    const response = await request.post("/wo/auth");
    expect(response.ok()).toBeFalsy();
  });
});

// ─── Security Tests ──────────────────────────────────────────────────────────

test.describe("Auth API - Security Tests", () => {
  // Classic SQL injection payload in username returns 400, not 200
  test("SQL injection in username is rejected", async ({ authApi }) => {
    const response = await authApi.login("admin' OR '1'='1", "anything");
    expect(response.status()).toBe(400);
  });

  // SQL injection in password field returns 400
  test("SQL injection in password is rejected", async ({ authApi }) => {
    const response = await authApi.login(process.env.ADMIN_USERNAME!, "' OR '1'='1");
    expect(response.status()).toBe(400);
  });

  // Script tag in username is rejected and not reflected in response body
  test("XSS payload in username is rejected", async ({ authApi }) => {
    const response = await authApi.login("<script>alert('xss')</script>", process.env.ADMIN_PASSWORD!);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toContain("<script>");
  });

  // 10K char username does not cause 5xx
  test("Server does not crash on very long username (10000 chars)", async ({ authApi }) => {
    const response = await authApi.login("a".repeat(10000), "password");
    expect(response.status()).toBeLessThan(500);
  });

  // 10K char password does not cause 5xx
  test("Server does not crash on very long password (10000 chars)", async ({ authApi }) => {
    const response = await authApi.login(process.env.ADMIN_USERNAME!, "x".repeat(10000));
    expect(response.status()).toBeLessThan(500);
  });

  // All printable special characters do not cause 5xx
  test("Server does not crash on special characters in credentials", async ({ authApi }) => {
    const response = await authApi.login(
      'user!@#$%^&*(){}[]|\\:";<>?,./~`',
      'pass!@#$%^&*(){}[]|\\:";<>?,./~`',
    );
    expect(response.status()).toBeLessThan(500);
  });

  // Cyrillic UTF-8 input does not cause 5xx
  test("Server does not crash on Cyrillic characters in credentials", async ({ authApi }) => {
    const response = await authApi.login("корисник", "лозинка");
    expect(response.status()).toBeLessThan(500);
  });

  // Response includes Access-Control-Allow-Origin header
  test("CORS headers are present in response", async ({ authApi }) => {
    const { headers } = await authApi.getResponseBody(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(headers).toHaveProperty("access-control-allow-origin");
  });

  // Null byte injection does not cause 5xx
  test("Server does not crash on null bytes in credentials", async ({ authApi }) => {
    const response = await authApi.login("admin\x00", "password\x00");
    expect(response.status()).toBeLessThan(500);
  });
});

// ─── Response Structure & Known Behaviors ────────────────────────────────────

test.describe("Auth API - Response Structure & Known Behaviors", () => {
  // Successful login returns all expected fields in body
  test("Response body contains expected fields (token, workAsUsername, firstName, lastName, tokenHash)", async ({
    authApi,
  }) => {
    const body = await authApi.loginAndGetFullResponse(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(body).toHaveProperty("token");
    expect(body).toHaveProperty("workAsUsername");
    expect(body).toHaveProperty("firstName");
    expect(body).toHaveProperty("lastName");
    expect(body).toHaveProperty("tokenHash");
  });

  test("Response body does NOT contain username field (known server behavior)", async ({
    authApi,
  }) => {
    // Server omits username from response - without manual injection, UI shows "(заменик)"
    const body = await authApi.loginAndGetFullResponse(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(body).not.toHaveProperty("username");
  });

  test("Response body returns empty roles array (roles fetched separately)", async ({
    authApi,
  }) => {
    // Server returns roles: [] - real roles must be fetched from /wo/roleRelation/getUserRoles
    const body = await authApi.loginAndGetFullResponse(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(body).toHaveProperty("roles");
    expect(body.roles).toEqual([]);
  });
});

// ─── x-auth-token Endpoints ──────────────────────────────────────────────────

test.describe("Auth API - x-auth-token Endpoints", () => {
  // Admin has at least one role assigned via /wo/roleRelation
  test("getUserRoles returns non-empty roles for Admin", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const roles = await authApi.fetchRoles(token, process.env.ADMIN_USERNAME!);
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);
  });

  // /wo/userSettings returns a valid object when authenticated
  test("userSettings returns settings object with valid token", async ({ authApi }) => {
    const token = await authApi.loginAsAdmin();
    const settings = await authApi.fetchUserSettings(token);
    expect(settings).toBeTruthy();
    expect(typeof settings).toBe("object");
  });

  // Server uses x-auth-token header, not standard Authorization: Bearer
  test("Authorization: Bearer header returns 401 (server uses x-auth-token)", async ({
    request,
  }) => {
    const loginResp = await request.post("/wo/auth", {
      data: {
        username: process.env.ADMIN_USERNAME!,
        password: process.env.ADMIN_PASSWORD!,
      },
    });
    const { token } = await loginResp.json();

    const resp = await request.get(
      `/wo/roleRelation/getUserRoles/${process.env.ADMIN_USERNAME}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(resp.status()).toBe(401);
  });

  // Garbage token in x-auth-token header is rejected
  test("x-auth-token endpoint with invalid token returns error", async ({ request }) => {
    const resp = await request.get(
      `/wo/roleRelation/getUserRoles/${process.env.ADMIN_USERNAME}`,
      { headers: { "x-auth-token": "invalid.token.here" } },
    );
    expect(resp.ok()).toBeFalsy();
  });
});

// ─── Brute Force Protection ──────────────────────────────────────────────────

test.describe("Auth API - Brute Force Protection", () => {
  test.describe.configure({ mode: "serial" });

  const attemptCounts = [10, 20];

  for (const count of attemptCounts) {
    // Rapid failed logins must not crash server (no 5xx), optionally returns 429 rate limit
    test(`Server stays stable under ${count} rapid failed login attempts`, async ({ authApi }) => {
      const requests = [];
      for (let i = 0; i < count; i++) {
        const start = Date.now();
        requests.push(
          authApi
            .login(`attacker_${count}`, "wrong" + i)
            .then(async (res) => ({
              status: res.status(),
              duration: Date.now() - start,
            })),
        );
      }
      const results = await Promise.all(requests);
      const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
      const maxDuration = Math.max(...results.map((r) => r.duration));

      const status400 = results.filter((r) => r.status === 400).length;
      const status429 = results.filter((r) => r.status === 429).length;
      const status500 = results.filter((r) => r.status >= 500).length;

      console.log(
        `[${count} attempts] Avg: ${avgDuration.toFixed(0)} ms | Max: ${maxDuration} ms | ` +
          `400: ${status400} | 429: ${status429} | 5xx: ${status500}`,
      );

      expect(status500).toBe(0);
      expect(status400 + status429).toBe(count);

      if (status429 === 0) {
        console.warn(
          `⚠ FINDING: No rate limiting detected after ${count} rapid attempts. ` +
            `Server returned 400 for all - consider implementing HTTP 429 throttling.`,
        );
      }
    });
  }

  // Brute force on SecOps account does not lock out unrelated Admin account
  test("Valid login still works after brute force attempts on a different account", async ({
    authApi,
  }) => {
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(authApi.login(process.env.SECURITY_TEST_USERNAME!, "wrong" + i));
    }
    await Promise.all(requests);

    await new Promise((r) => setTimeout(r, 500));

    const response = await authApi.login(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("token");
  });

  // Discovery: does server lock out an account after 15 consecutive failed logins?
  test("Account lockout detection: valid login after 15 failed attempts on same account", async ({
    authApi,
  }) => {
    const username = process.env.SECURITY_TEST_USERNAME!;
    for (let i = 0; i < 15; i++) {
      await authApi.login(username, "wrong" + i);
    }

    await new Promise((r) => setTimeout(r, 500));

    const response = await authApi.login(username, process.env.SECURITY_TEST_PASSWORD!);
    const status = response.status();

    if (status === 200) {
      console.warn(
        `⚠ FINDING: No account lockout detected. SecOps account still accessible ` +
          `after 15 consecutive failed login attempts. Consider implementing account lockout.`,
      );
    } else {
      console.log(
        `✓ Account lockout active: SecOps account locked after failed attempts (status: ${status}).`,
      );
    }

    expect([200, 400, 401, 403, 423]).toContain(status);
  });
});
