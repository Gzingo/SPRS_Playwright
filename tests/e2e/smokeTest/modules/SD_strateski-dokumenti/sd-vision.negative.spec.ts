import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Vision - Negative tests
 *
 * TC: SD-010804 (501 chars, Save disabled, AC-SD-012),
 *     SD-010806 (horizont outside period)
 *
 * Validation and error scenarios for Vision tab.
 * AC-SD-012: "Vizija ima maksimalno 500 karaktera".
 * Precondition: Draft document (created if not found).
 *
 * Discovery: SD_vision-tab_2026-03-27.md
 */

const VISION_TAB = "Визија";
const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

test.describe("SD: Vision - Negative", () => {
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

  // ─── TC: SD-010804 - 501 chars disables Save button (AC-SD-012: max 500) ──
  test("501 characters disables Save button", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    const visionTextarea = adminPage.locator("textarea#tekstVizije");
    await expect(visionTextarea).toBeVisible({ timeout: 5000 });

    // maxlength=501 allows typing 501, but app should disable Save above 500
    const text501 = "A".repeat(501);
    await visionTextarea.fill(text501);

    const actualValue = await visionTextarea.inputValue();
    expect(actualValue.length).toBe(501);

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeDisabled({ timeout: 2000 });
  });

  // ─── TC: SD-010806 - Horizont year outside document period ───────────────
  test("Horizont outside document period fails validation", async ({ adminPage, sidebar, docDetail }) => {
    await navigateToVisionTab(adminPage, sidebar, docDetail);

    // Discovery: select#horizont, document period 2026-2031, options go to 2050
    const horizont = adminPage.locator("select#horizont");
    await expect(horizont).toBeVisible({ timeout: 5000 });

    // Select 2050 (far outside document period 2026-2031)
    await horizont.selectOption({ label: "2050" });

    const saveBtn = adminPage.locator("button:has-text('Сачувај'):not(:has-text('напомену'))").first();
    await expect(saveBtn).toBeEnabled({ timeout: 2000 });
    await saveBtn.click();
    await adminPage.waitForTimeout(1000);

    // Expect validation error for horizont outside period
    const errorMsg = adminPage.locator(".alert-danger, .error-message, .validation-error, .text-danger");
    await expect(errorMsg.first()).toBeVisible({ timeout: 3000 });
  });
});
