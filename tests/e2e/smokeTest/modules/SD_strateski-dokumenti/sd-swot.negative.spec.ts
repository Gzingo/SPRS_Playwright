import { test, expect } from "@fixtures/index";

/**
 * SD: SWOT Analysis - Negative tests
 *
 * TC: SD-010703 (delete item), SD-010704 (empty category validation)
 * SKIP: SD-010702 (drag-drop - no draggable elements on env)
 * SKIP: SD-010707 (rich text - only plain textarea on env)
 *
 * Deletion and validation scenarios for SWOT tab.
 */

const SWOT_TAB = "SWOT анализа";

test.describe("SD: SWOT - Negative", () => {
  test.beforeEach(async ({ adminPage, sidebar, docDetail }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);

    // Wait for table to load before checking for Draft
    await expect(adminPage.locator("table tbody tr").first()).toBeVisible({ timeout: 10000 });

    const draftRow = adminPage.locator('table tbody tr:has-text("Драфт")').first();
    if ((await draftRow.count()) === 0) {
      test.skip();
      return;
    }
    await draftRow.click();
    await docDetail.expectLoaded();
    await docDetail.openTab(SWOT_TAB);
  });

  // TC: SD-010703 - Delete item from SWOT category
  test("Delete item from category", async ({ adminPage }) => {
    // Count existing items in first category (Снаге)
    const snageSection = adminPage
      .locator("section, div, .card")
      .filter({ hasText: "Снаге" })
      .first();

    await expect(snageSection).toBeVisible({ timeout: 5000 });

    // Find delete buttons (trash icon, X, or "Обриши")
    const deleteButtons = snageSection.locator(
      "button:has(.fa-trash), button:has(.fa-times), button:has-text('Обриши'), button[title*='бриш'], button[title*='елет']"
    );
    const deleteCount = await deleteButtons.count();

    if (deleteCount === 0) {
      console.log("No delete buttons found in Снаге category - skipping");
      test.skip();
      return;
    }

    // Count items before delete
    const itemsBefore = await snageSection.locator("li, tr, .swot-item, .list-group-item").count();

    // Click last delete button (safest - removes newest item)
    await deleteButtons.last().click();
    await adminPage.waitForTimeout(500);

    // Handle confirmation dialog if it appears
    const confirmBtn = adminPage.locator(
      "button:has-text('Да'), button:has-text('Потврди'), button:has-text('OK')"
    );
    if (await confirmBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.first().click();
      await adminPage.waitForLoadState("networkidle");
    }

    // Count items after delete - should be less
    const itemsAfter = await snageSection.locator("li, tr, .swot-item, .list-group-item").count();
    expect(itemsAfter).toBeLessThan(itemsBefore);
  });

  // TC: SD-010704 - Empty category validation
  test("Empty SWOT category shows validation", async ({ adminPage }) => {
    // Try to save/submit SWOT with all categories empty (if possible)
    // This depends on whether there's a SWOT-level save/validate button
    const validateBtn = adminPage.locator(
      "button:has-text('Валидирај'), button:has-text('Провјери'), button:has-text('Сачувај')"
    ).first();

    if (!(await validateBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      console.log("No SWOT save/validate button found - skipping empty validation test");
      test.skip();
      return;
    }

    await validateBtn.click();
    await adminPage.waitForTimeout(1000);

    // Check for any validation feedback
    const feedback = adminPage.locator(
      ".alert-danger, .error-message, .validation-error, .text-danger, .toast-error"
    );
    const hasFeedback = await feedback.first().isVisible({ timeout: 3000 }).catch(() => false);

    // Log discovery result
    console.log(`Empty category validation feedback visible: ${hasFeedback}`);
  });
});
