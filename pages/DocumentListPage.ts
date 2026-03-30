/**
 * DocumentListPage - Page Object for table/list views (document lists, registries, etc.).
 *
 * Fixture name: `docList`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   test("Search and open document", async ({ docList, page }) => {
 *     await docList.searchDocument("Strategija RS");
 *     await docList.clickRowByText("Strategija RS 2025");
 *     await expect(page).toHaveURL(/strateski-dokument\/\d+/);
 *   });
 *
 *   test("Create new document", async ({ docList, docForm, common }) => {
 *     await docList.clickCreateNew();
 *     await docForm.fillField("Naziv", "Test dokument");
 *     await docForm.clickSave();
 *     await expect(common.toastSuccess).toBeVisible();
 *   });
 *
 *   test("Verify table has data", async ({ docList }) => {
 *     const count = await docList.getRowCount();
 *     expect(count).toBeGreaterThan(0);
 *     await expect(docList.emptyMessage).toBeHidden();
 *   });
 */
import { type Locator, type Page } from "@playwright/test";

export class DocumentListPage {
  readonly page: Page;
  readonly table: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly rows: Locator;
  readonly emptyMessage: Locator;
  readonly typeFilter: Locator;
  readonly statusFilter: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly resultCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator("table");
    this.createButton = page.locator('button:has-text("Нови документ")');
    this.searchInput = page.locator(
      'input[type="search"], input[placeholder*="Pretraži"], input[placeholder*="Претражи"]',
    );
    this.rows = page.locator("table tbody tr");
    this.emptyMessage = page.locator(".empty-state, .no-results");
    this.typeFilter = page.locator("select").nth(0);
    this.statusFilter = page.locator("select").nth(2);
    this.searchButton = page.getByText("Претражи");
    this.resetButton = page.getByText("Поништи");
    this.resultCount = page.locator("text=/\\d+ од \\d+ резултата/");
  }

  /**
   * Click the "Kreiraj" / "Dodaj" button to open the create form.
   * Typically followed by docForm.fillField() + docForm.clickSave().
   *
   *   await docList.clickCreateNew();
   *   await docForm.fillField("Naziv", "Novi dokument");
   *   await docForm.clickSave();
   */
  async clickCreateNew() {
    await this.createButton.first().click();
  }

  /**
   * Type a search query into the search/filter input.
   * Typically followed by clickRowByText() or assertion on rows.
   *
   *   await docList.searchDocument("Plan 2026");
   *   await expect(docList.rows).toHaveCount(1);
   */
  async searchDocument(query: string) {
    await this.searchInput.first().fill(query);
  }

  /**
   * Click a table row by its index (0-indexed).
   *
   *   await docList.selectRow(0);   // click first row
   *   await docList.selectRow(2);   // click third row
   */
  async selectRow(index: number) {
    await this.rows.nth(index).click();
  }

  /**
   * Click the first table row containing the given text, then wait for navigation.
   * Use this to open a specific document from the list.
   *
   *   await docList.clickRowByText("Strategija RS 2025");
   *   await expect(page).toHaveURL(/strateski-dokument\/\d+/);
   */
  async clickRowByText(text: string) {
    await this.page
      .locator(`table tbody tr:has-text("${text}")`)
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Return the number of visible rows in the table body.
   *
   *   const count = await docList.getRowCount();
   *   expect(count).toBeGreaterThan(0);
   */
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  /**
   * Select a document type from the filter dropdown.
   *
   *   await docList.selectTypeFilter("Секторске стратегије Републике Српске");
   */
  async selectTypeFilter(label: string) {
    await this.typeFilter.selectOption({ label });
  }

  /**
   * Select a status from the filter dropdown.
   *
   *   await docList.selectStatusFilter("Драфт");
   */
  async selectStatusFilter(label: string) {
    await this.statusFilter.selectOption({ label });
  }

  /**
   * Click the search/filter button.
   */
  async clickSearch() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click reset button to clear all filters.
   */
  async clickReset() {
    await this.resetButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if "no results" message is visible (handles both empty-state and colspan row).
   */
  async hasNoResults(): Promise<boolean> {
    const noResultsText = this.page.locator("text=/Нема пронађених/");
    // Wait briefly for the message to appear after search
    await this.page.waitForTimeout(1000);
    return noResultsText.isVisible().catch(() => false);
  }
}
