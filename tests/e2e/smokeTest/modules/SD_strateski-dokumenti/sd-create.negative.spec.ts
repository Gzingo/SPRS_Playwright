import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Create - Negative tests
 *
 * TC: SD-010102 (missing name), SD-010103 (missing type),
 *     SD-010104 (period validation)
 *
 * Validation scenarios: wizard prevents creation when required data is missing or invalid.
 */

const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

test.describe("SD: Create - Negative", () => {
  // ─── TC SD-010102 - Validation, document name missing ─────────────────────

  test("Validacija - kreiranje bez naziva dokumenta", async ({
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

    // Fill all fields EXCEPT name
    await wizard.selectResponsibleAuthority({ index: 1 });
    await wizard.fillPeriodFrom("2026");
    await wizard.fillPeriodTo("2031");

    // "Next" button should be disabled (client-side validation prevents advancing)
    await wizard.expectNextDisabled();

    // Wizard should stay on Step 2 (Основни подаци)
    await wizard.expectStep("Основни подаци");
  });

  // ─── TC SD-010103 - Validation, document type not selected ────────────────

  test("Validacija - kreiranje bez tipa dokumenta", async ({
    adminPage,
    sidebar,
    docList,
    wizard,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    await docList.clickCreateNew();
    await wizard.expectOpen();

    // Do NOT select document type, try to advance from Step 1
    await wizard.expectNextDisabled();
  });

  // ─── TC SD-010104 - Validation, period end before period start ────────────

  test("Validacija - Period do manji od Period od", async ({
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

    // Fill with invalid period range
    await wizard.fillStep2Data({
      name: `E2E-INVALID-PERIOD-${DATE}-${UID}`,
      authority: { index: 1 },
      periodFrom: "2030",
      periodTo: "2025",
    });

    // Try to advance - should fail validation
    await wizard.clickNext();

    // Wizard should stay on Step 2
    await wizard.expectStep("Основни подаци");
  });
});
