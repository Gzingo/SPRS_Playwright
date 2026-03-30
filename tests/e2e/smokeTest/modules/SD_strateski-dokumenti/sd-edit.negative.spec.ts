import { test, expect } from "@fixtures/index";

/**
 * SD: Edit Document - Negative tests
 *
 * TC: SD-010116 (cancel discards changes), SD-010117 (edit blocked on adopted)
 *
 * Cancel and restriction scenarios for document editing.
 */

const editModal = ".modal";
const nameLabel = "Назив стратешког документа";

test.describe("SD: Edit - Negative", () => {
  test.beforeEach(async ({ adminPage, sidebar }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // TC: SD-010116 - Cancel edit discards changes, original values remain
  test("Cancel edit discards changes", async ({
    adminPage,
    docDetail,
  }) => {
    await adminPage.locator('table tbody tr:has-text("Драфт")').first().click();
    await docDetail.expectLoaded();

    const originalName = await adminPage.locator("h1").first().textContent();

    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });

    await adminPage.locator(editModal).getByLabel(nameLabel).fill("SHOULD-NOT-BE-SAVED");
    await adminPage.locator(editModal).getByText("Откажи").click();
    await adminPage.waitForTimeout(1000);

    await expect(adminPage.locator(editModal)).toBeHidden();
    await expect(adminPage.locator(`text=${originalName?.trim()}`)).toBeVisible();
  });

  // TC: SD-010117 - Document in "Усвајање" status should not have edit button
  test("Edit button hidden on adopted document", async ({
    adminPage,
    docDetail,
  }) => {
    const adoptedRow = adminPage.locator('table tbody tr:has-text("Усвајање")').first();

    if ((await adoptedRow.count()) === 0) {
      test.skip();
      return;
    }

    await adoptedRow.click();
    await docDetail.expectLoaded();
    await docDetail.expectEditHidden();
  });
});
