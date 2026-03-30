import { test, expect } from "@fixtures/index";

/**
 * SD: SWOT Analysis - Boundary tests
 *
 * TC: SD-010705 (15-item limit per category)
 * !!!UNCLEAR!!! - spec says max 15 items per category but UI limit not confirmed
 *
 * Boundary value test for SWOT category item count.
 */

const SWOT_TAB = "SWOT анализа";

test.describe("SD: SWOT - Boundary", () => {
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

  // TC: SD-010705 - 15-item limit per category (!!!UNCLEAR!!!)
  test("Category item count limit discovery", async ({ adminPage }) => {
    // Discovery test: count existing items in each category to understand limits
    const categories = ["Снаге", "Слабости", "Прилике", "Пријетње"];

    for (const category of categories) {
      const section = adminPage
        .locator("section, div, .card")
        .filter({ hasText: category })
        .first();

      if (!(await section.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log(`Category "${category}" not visible`);
        continue;
      }

      // Count items in this category
      const items = section.locator("li, tr, .swot-item, .list-group-item");
      const count = await items.count();
      console.log(`Category "${category}": ${count} items`);

      // Check if +Додај button is still visible (if at limit, button may be hidden/disabled)
      const addButton = section.locator("button").filter({ hasText: /Додај|\+/i }).first();
      const addVisible = await addButton.isVisible({ timeout: 1000 }).catch(() => false);
      const addDisabled = addVisible ? await addButton.isDisabled() : false;
      console.log(`Category "${category}": add button visible=${addVisible}, disabled=${addDisabled}`);
    }

    // This is a discovery test - always passes, logs findings for future TC validation
    expect(true).toBeTruthy();
  });
});
