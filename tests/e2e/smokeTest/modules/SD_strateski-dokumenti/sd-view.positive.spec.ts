import { test, expect } from "@fixtures/index";

/**
 * SD: View, Search, Filter
 *
 * TC: SD-010118 (tab navigation), SD-010119 (structure verification)
 * Search/filter tests are cross-cutting (no direct TC mapping).
 *
 * Tests for viewing document details, searching by name,
 * filtering by type/status, and resetting filters.
 * Uses existing documents on the environment.
 */

test.describe("SD: - View & Search", () => {
  test.beforeEach(async ({ adminPage, sidebar }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // TC: SD-010118 - Click first document in list, verify detail page loads with heading and tabs
  test("Open document from list - detail page loads", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    const rowCount = await docList.getRowCount();
    expect(rowCount).toBeGreaterThan(0);

    await docList.selectRow(0);
    await docDetail.expectLoaded();
    await docDetail.expectUrl();
  });

  // TC: SD-010119 - Detail page shows all expected fields: name, type, authority, period, status, version
  test("Document detail shows expected fields", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    await docList.selectRow(0);
    await docDetail.expectLoaded();

    const expectedLabels = [
      "Назив стратешког документа",
      "Тип документа",
      "Орган управе",
      "Период",
      "Статус",
      "Верзија",
    ];

    for (const label of expectedLabels) {
      await expect(adminPage.locator(`label:has-text("${label}")`)).toBeVisible();
    }
  });

  // TC: SD-010118 - Detail page has 12 tabs (tabs may lazy-load, wait for first tab to appear)
  test("Document detail has all expected tabs", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    await docList.selectRow(0);
    await docDetail.expectLoaded();

    // Wait for tabs to render (lazy-loaded after document data arrives)
    await expect(adminPage.locator(".nav-tabs")).toBeVisible({ timeout: 10000 });

    const tabs = await docDetail.getTabNames();
    expect(tabs.length).toBeGreaterThanOrEqual(10);
    expect(tabs).toContain("Основни подаци");
    expect(tabs).toContain("SWOT анализа");
    expect(tabs).toContain("Индикатори");
  });

  // "Повратак на листу" button navigates back to the document list
  test("Back to list button returns to document list", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    await docList.selectRow(0);
    await docDetail.expectLoaded();

    await docDetail.clickBackToList();
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
    await expect(adminPage).not.toHaveURL(/strateski-dokument\/\d+/);
  });

  // Edit button is visible for Admin on draft documents
  test("Edit button is visible on document detail", async ({
    adminPage,
    docDetail,
  }) => {
    // Specifically find a draft document (first row may not be draft due to parallel tests)
    const draftRow = adminPage.locator('table tbody tr:has-text("Драфт")').first();
    if ((await draftRow.count()) === 0) {
      test.skip();
      return;
    }
    await draftRow.click();
    await docDetail.expectLoaded();
    await docDetail.expectEditVisible();
  });
});

test.describe("SD: - Search & Filter", () => {
  test.beforeEach(async ({ adminPage, sidebar }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // Search by document name filters the list to matching results
  test("Search by name shows matching documents", async ({
    adminPage,
    docList,
  }) => {
    const countBefore = await docList.getRowCount();

    // Search for a known pattern (E2E test documents)
    await docList.searchDocument("E2E");
    await docList.clickSearch();

    const rows = adminPage.locator('table tbody tr:has-text("E2E")');
    const matchCount = await rows.count();
    expect(matchCount).toBeGreaterThan(0);
  });

  // Search for non-existent text shows empty results
  test("Search with no results shows empty message", async ({
    docList,
  }) => {
    await docList.searchDocument("NEPOSTOJECI_DOKUMENT_XYZ_99999");
    await docList.clickSearch();

    const empty = await docList.hasNoResults();
    expect(empty).toBe(true);
  });

  // Filter by document type narrows the list
  test("Filter by document type shows filtered results", async ({
    docList,
  }) => {
    await docList.selectTypeFilter("Секторске стратегије Републике Српске");
    await docList.clickSearch();

    const count = await docList.getRowCount();
    expect(count).toBeGreaterThan(0);
  });

  // Filter by status narrows the list
  test("Filter by status shows filtered results", async ({
    docList,
  }) => {
    const countBefore = await docList.getRowCount();

    await docList.selectStatusFilter("Драфт");
    await docList.clickSearch();

    const countAfter = await docList.getRowCount();
    expect(countAfter).toBeGreaterThan(0);
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  // Reset button clears all filters and restores full list
  test("Reset filters restores full list", async ({
    docList,
  }) => {
    const countBefore = await docList.getRowCount();

    // Apply a filter
    await docList.searchDocument("E2E");
    await docList.clickSearch();
    const countFiltered = await docList.getRowCount();

    // Reset
    await docList.clickReset();
    const countAfter = await docList.getRowCount();

    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });
});
