import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Create - Positive tests
 *
 * TC: SD-010101 (happy path + verify in list), SD-010109 (empty description)
 *
 * Happy path CRUD: create → verify in list.
 * Cancel and back navigation (no direct TC) prove wizard UI works correctly.
 *
 * Serial mode: tests 1 and 2 share created document (timestamp isolation).
 */

const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);
const DOC_NAME = `E2E-SD-${DATE}-${UID}`;

const step2Data: WizardStep2Data = {
  name: DOC_NAME,
  authority: { index: 1 },
  periodFrom: "2026",
  periodTo: "2031",
  internalCode: `SEK-E2E-${DATE}-${UID}`,
  description: "E2E test document - can be deleted",
};

test.describe("SD: Create - Positive", () => {
  test.describe.configure({ mode: "serial" });

  // ─── TC SD-010101 - Happy path, create complete document ──────────────────

  test("Kreiranje strateškog dokumenta - happy path (wizard kompletno)", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.clickCreateNew();
    await wizard.expectOpen();

    await wizard.selectDocumentType("Секторске стратегије Републике Српске");
    await wizard.clickNext();
    await wizard.expectStep("Основни подаци");

    await wizard.fillStep2Data(step2Data);
    await wizard.expectStep2FilledCorrectly({
      ...step2Data,
      docType: "Секторске стратегије Републике Српске",
    });

    await wizard.clickNext();
    await wizard.clickConfirm();

    await expect(wizard.modal).toBeHidden({ timeout: 10000 });
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // ─── TC SD-010101 - Verify created document in list ───────────────────────

  test("Verifikacija dokumenta u listi nakon kreiranja", async ({
    adminPage,
    sidebar,
    docList,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.searchDocument(DOC_NAME);
    await adminPage.waitForLoadState("networkidle");

    const rows = adminPage.locator(`table tbody tr:has-text("${DOC_NAME}")`);
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

  // ─── Cancel closes wizard modal (no direct TC) ───────────────────────────

  test("Wizard - Cancel zatvara modal", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.clickCreateNew();
    await wizard.expectOpen();

    await wizard.clickCancel();

    await expect(wizard.modal).toBeHidden();
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // ─── Back navigation preserves data (no direct TC) ───────────────────────

  test("Wizard - Back navigacija čuva selektovane podatke", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.clickCreateNew();
    await wizard.expectOpen();

    await wizard.selectDocumentType("Секторске стратегије Републике Српске");
    await wizard.clickNext();
    await wizard.expectStep("Основни подаци");

    const backTestData: WizardStep2Data = {
      name: `E2E-BACK-NAV-${DATE}-${UID}`,
      authority: { index: 1 },
      periodFrom: "2026",
      periodTo: "2031",
    };
    await wizard.fillStep2Data(backTestData);

    await wizard.clickBack();
    await wizard.clickNext();
    await wizard.expectStep("Основни подаци");

    await wizard.expectDocumentName(backTestData.name);
    await wizard.expectPeriodFrom(backTestData.periodFrom);
    await wizard.expectPeriodTo(backTestData.periodTo);
  });

  // ─── TC SD-010109 - Create without description (optional field) ───────────

  test("Kreiranje dokumenta bez opisa - opis je opcionalan", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.clickCreateNew();
    await wizard.expectOpen();

    await wizard.selectDocumentType("Секторске стратегије Републике Српске");
    await wizard.clickNext();
    await wizard.expectStep("Основни подаци");

    const noDescData: WizardStep2Data = {
      name: `E2E-NO-DESC-${DATE}-${UID}`,
      authority: { index: 1 },
      periodFrom: "2026",
      periodTo: "2031",
    };
    await wizard.fillStep2Data(noDescData);

    await wizard.clickNext();
    await wizard.clickConfirm();

    await expect(wizard.modal).toBeHidden({ timeout: 10000 });
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });
});
