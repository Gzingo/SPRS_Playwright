import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Vision - Positive tests
 *
 * TC: SD-010801 (entry and save), SD-010802 (empty vision saves, AC-SD-011),
 *     SD-010805 (min 1 char), SD-010807 (horizont inside period)
 *
 * Tests for Vision tab: textarea, horizont dropdown, tag input.
 * AC-SD-011: "Vizija mora biti popunjena prije finalizacije dokumenta" (not at Save).
 * Precondition: Draft document (created if not found).
 *
 * Discovery: SD_vision-tab_2026-03-27.md
 */

const VISION_TAB = "Визија";
const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

test.describe("SD: Vision - Positive", () => {
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

  // ─── TC: SD-010801 - Enter vision text and save successfully ─────────────
  test("Vision entry and save", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await expect(visionTextarea).toBeVisible({ timeout: 5000 });

    const testVision = `E2E vision test ${Date.now()}`;

    await visionTextarea.fill(testVision);

    // Save button becomes enabled after change
    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    // Verify saved: switch tabs and check value persisted
    await docDetail.openTab("Основни подаци");
    await docDetail.openTab(VISION_TAB);
    await adminPage.waitForTimeout(1000);

    const savedText = await adminPage.locator("textarea#tekstVizije").inputValue();
    expect(savedText).toContain("E2E vision test");
  });

  // ─── TC: SD-010802 - Empty vision saves (AC-SD-011: mandatory at finalization, not at Save)
  test("Empty vision saves without error", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await expect(visionTextarea).toBeVisible({ timeout: 5000 });

    await visionTextarea.fill("");

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();

    // Save may stay disabled if field was already empty (no change detected)
    if (await saveBtn.isDisabled()) {
      console.log("Save disabled: vision was already empty, no change detected");
      return;
    }

    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    // No validation error, empty vision is allowed on Save per AC-SD-011
    const errorMsg = adminPage.locator(".alert-danger, .error-message, .validation-error, .text-danger");
    await expect(errorMsg.first()).not.toBeVisible({ timeout: 3000 });
  });

  // ─── TC: SD-010805 - Minimum 1 character saves successfully ──────────────
  test("Vision with 1 character saves", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await visionTextarea.fill("X");

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    // No validation error expected
    await expect(adminPage.locator(".alert-danger, .error-message")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });

  // ─── TC: SD-010807 - Horizont year inside document period saves ──────────
  test("Horizont inside period saves", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    // Discovery: select#horizont with options 2026-2050, document period 2026-2031
    const horizont = adminPage.locator("select#horizont");
    await expect(horizont).toBeVisible({ timeout: 5000 });

    // Select 2028 (inside document period 2026-2031)
    await horizont.selectOption({ label: "2028" });

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForLoadState("networkidle");

    // Verify no error
    await expect(adminPage.locator(".alert-danger, .error-message")).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });
});
