import { test, expect } from "@fixtures/index";

/**
 * SD: Status Workflow - Negative tests
 *
 * TC: SD-010114 (unauthorized user cannot change status)
 *
 * Role-based restriction: Načelnik SP should not see transition buttons.
 */

test.describe("SD: Status - Negative", () => {
  // TC: SD-010114 - User without permission should not see transition buttons
  test("Načelnik SP cannot transition document status", async ({
    nacelnikSPPage,
    sidebar,
    docDetail,
  }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(nacelnikSPPage).toHaveURL(/#.*strateski-dokument/);

    // Wait for table to load before checking for Draft
    await expect(nacelnikSPPage.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });

    const draftRow = nacelnikSPPage
      .locator('table tbody tr:has-text("Драфт")')
      .first();

    if ((await draftRow.count()) === 0) {
      test.skip();
      return;
    }

    await draftRow.click();
    await docDetail.expectLoaded();

    // Transition button should NOT be visible for this role
    const transitionBtn = docDetail.statusButton("Интерна провјера");
    await expect(transitionBtn).toBeHidden({ timeout: 3000 });
  });
});
