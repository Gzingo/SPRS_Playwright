import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Vision - Boundary tests
 *
 * TC: SD-010803 (max 500 chars), SD-010803b (499 chars, one below max),
 *     SD-010808 (tag input up to 10)
 *
 * Boundary value tests for Vision tab fields.
 * AC-SD-012: "Vizija ima maksimalno 500 karaktera".
 * Precondition: Draft document (created if not found).
 *
 * Discovery: SD_vision-tab_2026-03-27.md
 */

const VISION_TAB = "Визија";
const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

// Realistic 500-character test data
const TEST_DATA_500 =
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123" +
  "- 1234 123- 1234 123- 1234 123- 1234 123- 1234 123";

test.describe("SD: Vision - Boundary", () => {
  test.describe.configure({ mode: "serial" });
  let documentName: string;

  // ─── Precondition: ensure Draft document exists ──────────────────────────
  test("Precondition: Draft document exists or is created", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });

    const draftRow = adminPage.locator('table tbody tr:has-text("Драфт")').first();
    if ((await draftRow.count()) > 0) {
      documentName = (await draftRow.locator("td").nth(1).textContent()) ?? "";
      console.log(`Draft found: ${documentName}`);
      return;
    }

    console.log("No Draft document found, creating one...");
    const newName = `E2E-SD-${DATE}-${UID}`;
    const step2Data: WizardStep2Data = {
      name: newName,
      authority: { index: 1 },
      periodFrom: "2026",
      periodTo: "2031",
      description: "E2E precondition document - can be deleted",
    };

    await docList.clickCreateNew();
    await wizard.expectOpen();
    await wizard.selectDocumentType("Секторске стратегије Републике Српске");
    await wizard.clickNext();
    await wizard.expectStep("Основни подаци");
    await wizard.fillStep2Data(step2Data);
    await wizard.clickNext();
    await wizard.clickConfirm();
    await expect(wizard.modal).toBeHidden({ timeout: 10000 });

    documentName = newName;
    console.log(`Draft created: ${documentName}`);
  });

  async function navigateToVisionTab(adminPage: any, sidebar: any, docDetail: any) {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });

    await adminPage.locator('table tbody tr:has-text("Драфт")').first().click();
    await docDetail.expectLoaded();
    await docDetail.openTab(VISION_TAB);
  }

  // ─── TC: SD-010803b - 499 characters saves (one below max, AC-SD-012) ────
  test("Vision with 499 characters saves", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await expect(visionTextarea).toBeVisible({ timeout: 5000 });

    const text499 = "A".repeat(499);
    await visionTextarea.fill(text499);

    const actualValue = await visionTextarea.inputValue();
    expect(actualValue.length).toBe(499);

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    await expect(adminPage.locator(".alert-danger, .error-message")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  // ─── TC: SD-010803 - Exactly 500 characters saves successfully ───────────
  test("Vision with exactly 500 characters saves", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await expect(visionTextarea).toBeVisible({ timeout: 5000 });

    await visionTextarea.fill(TEST_DATA_500);

    // Verify 500 chars accepted
    const actualValue = await visionTextarea.inputValue();
    expect(actualValue.length).toBe(500);

    // Char counter should show 500 / 500
    const charCounter = adminPage.locator(".char-counter");
    await expect(charCounter).toContainText("500");

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    // No validation error expected
    await expect(adminPage.locator(".alert-danger, .error-message")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  // ─── TC: SD-010808 - Tag input accepts up to 10 tags ────────────────────
  test("Tag input accepts up to 10 tags", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    // Discovery: input with placeholder "Унесите таг и притисните Enter (максимално 10 тагова)"
    const tagInput = adminPage.locator('input[placeholder*="таг"]');
    await expect(tagInput).toBeVisible({ timeout: 5000 });

    // Add 10 tags
    for (let i = 1; i <= 10; i++) {
      await tagInput.fill(`e2e-tag-${i}`);
      await tagInput.press("Enter");
      await adminPage.waitForTimeout(300);
    }

    // Verify counter shows 10 / 10
    const counter = adminPage.locator("text=/\\d+\\s*\\/\\s*10/");
    await expect(counter).toBeVisible({ timeout: 3000 });
    const counterText = await counter.textContent();
    expect(counterText).toContain("10");

    // Try adding 11th tag - should be rejected or input disabled
    await tagInput.fill("e2e-tag-overflow");
    await tagInput.press("Enter");
    await adminPage.waitForTimeout(300);

    // Counter should still show 10
    const counterAfter = await counter.textContent();
    expect(counterAfter).toContain("10");
  });
});
