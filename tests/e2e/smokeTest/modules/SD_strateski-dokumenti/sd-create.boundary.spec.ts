import { test, expect } from "@fixtures/index";
import type { WizardStep2Data } from "@pages/WizardPage";

/**
 * SD: Create - Boundary tests
 *
 * TC: SD-010110 (special characters in name)
 *
 * Boundary value test: document name with parentheses, quotes, ampersand.
 */

const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

test.describe("SD: Create - Boundary", () => {
  // ─── TC SD-010110 - Special characters in document name ───────────────────

  test("Kreiranje dokumenta sa specijalnim karakterima u nazivu", async ({
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

    // Name with parentheses, dashes, quotes - legitimate special chars
    const specialName = `E2E-SPEC (RS) "test" & plan - ${DATE}-${UID}`;
    const specialData: WizardStep2Data = {
      name: specialName,
      authority: { index: 1 },
      periodFrom: "2026",
      periodTo: "2031",
      description: "E2E test document - special characters in name",
    };
    await wizard.fillStep2Data(specialData);

    await wizard.clickNext();
    await wizard.clickConfirm();

    // Should succeed - special characters are valid in document names
    await expect(wizard.modal).toBeHidden({ timeout: 10000 });
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });
});
