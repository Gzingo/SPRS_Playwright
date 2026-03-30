import { test, expect } from "@fixtures/index";

test.describe("Login - Positive Tests", () => {
  // Admin logs in via UI, lands on Notifications, display name shown in header
  test("Admin login with valid credentials", async ({ loginPage, page }) => {
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/notifications/);
    await expect(page.locator(".user")).toContainText("QA Teст Администратор");
    await expect(page.locator("section.content-header h1")).toHaveText(
      "Обавјештења",
    );
  });

  // Pisarnica logs in via UI, lands on Notifications, display name shown
  test("Pisarnica login with valid credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginAsPisarnica();
    await expect(page).toHaveURL(/notifications/);
    await expect(page.locator(".user")).toContainText("QA Тест Писарница");
    await expect(page.locator("section.content-header h1")).toHaveText(
      "Обавјештења",
    );
  });

  // Raspoređivač logs in via UI, redirected away from login, display name shown
  test("Raspoređivač login with valid credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginAsRasporedjivac();
    await expect(page).toHaveURL(/.*#(?!.*login).*/);
    await expect(page.locator(".user")).toContainText("QA Тестер Распоређивач");
    await expect(page.locator("section.content-header h1")).toHaveText(
      "Обавјештења",
    );
  });

  // Obrađivač logs in via UI, redirected away from login, display name shown
  test("Obrađivač login with valid credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginAsObradjivac();
    await expect(page).toHaveURL(/.*#(?!.*login).*/);
    await expect(page.locator(".user")).toContainText("QA Тестер Обрађивач");
    await expect(page.locator("section.content-header h1")).toHaveText(
      "Обавјештења",
    );
  });

  // Načelnik SP logs in via UI, redirected away from login, display name shown
  test("Načelnik SP login with valid credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginAsNacelnikSP();
    await expect(page).toHaveURL(/.*#(?!.*login).*/);
    await expect(page.locator(".user")).toContainText("QA Тестер Начелник СП");
    await expect(page.locator("section.content-header h1")).toHaveText(
      "Обавјештења",
    );
  });

  // After login, page reload keeps user authenticated (session persists)
  test("Should persist session after page reload", async ({
    loginPage,
    page,
  }) => {
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/notifications/);
    await page.reload();
    await expect(page).toHaveURL(/notifications/);
  });

  // Logout redirects user back to login page
  test("Should logout successfully", async ({ loginPage, page }) => {
    await loginPage.loginAsAdmin();
    await loginPage.logout();
    await expect(page).toHaveURL(/login/);
  });

  // Pressing Enter submits the login form (keyboard shortcut)
  test("Login with Enter key", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.loginWithEnterKey(
      process.env.ADMIN_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    await expect(page).toHaveURL(/notifications/);
  });
});

test.describe("Login - Negative Tests", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // Empty fields show validation message, user stays on login page
  test("Should not login with empty credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.submitButton.click();
    await expect(loginPage.validationMessages.first()).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  // Non-existent username shows error, user stays on login page
  test("Should not login with invalid username", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(
      process.env.INVALID_USERNAME!,
      process.env.ADMIN_PASSWORD!,
    );
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  // Wrong password shows error, user stays on login page
  test("Should not login with invalid password", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(
      process.env.ADMIN_USERNAME!,
      process.env.INVALID_PASSWORD!,
    );
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.errorMessage).toBeVisible();
  });
});

test.describe("Login - Security Tests (Benign)", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // SQL injection in both fields shows error, does not bypass auth
  test("Should not login with SQL injection attempt", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login("admin' OR '1'='1", "admin' OR '1'='1");
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.errorMessage).toBeVisible();
  });

  // Script tag in username does not trigger alert dialog
  test("Should not login with XSS attempt in username", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(
      "<script>alert('xss')</script>",
      process.env.ADMIN_PASSWORD!,
    );
    await expect(page).toHaveURL(/login/);
    const alertPromise = page.waitForEvent("dialog", { timeout: 1000 });
    await expect(alertPromise).rejects.toThrow();
  });

  // Password field type is "password" and value is not visible in DOM
  test("Should not expose password in DOM", async ({ loginPage, page }) => {
    await loginPage.passwordInput.fill(process.env.ADMIN_PASSWORD!);
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
    await expect(loginPage.passwordInput).not.toHaveText(
      process.env.ADMIN_PASSWORD!,
    );
    const pageContent = await page.content();
    expect(pageContent).not.toContain(`value="${process.env.ADMIN_PASSWORD}"`);
  });

  // Leading/trailing spaces in credentials are rejected via UI
  test("Should not login with whitespace-padded credentials", async ({
    loginPage,
    page,
  }) => {
    await loginPage.login(
      process.env.WHITESPACE_PADDED_USERNAME!,
      process.env.WHITESPACE_PADDED_PASSWORD!,
    );
    await expect(page).toHaveURL(/login/);
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
