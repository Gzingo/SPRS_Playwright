/**
 * DocumentDetailPage - Page Object for document detail view (tabs, fields, status, actions).
 *
 * Fixture name: `docDetail`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   test("View document details", async ({ adminPage, sidebar, docList, docDetail }) => {
 *     await sidebar.openModule("Стратешки документи");
 *     await docList.clickRowByText("Test dokument");
 *     await docDetail.expectLoaded();
 *     await expect(docDetail.fieldValue("Статус")).toHaveText("Драфт");
 *   });
 */
import { type Locator, type Page, expect } from "@playwright/test";

export class DocumentDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly tabs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator("h1, h2").filter({ hasText: /документа/i });
    this.backButton = page.getByText("Повратак на листу");
    this.editButton = page.getByText("Измјени");
    // Tabs: ul.nav-tabs > li.nav-item > a.nav-link
    this.tabs = page.locator(".nav-tabs li");
  }

  // Verify the detail page has loaded
  async expectLoaded() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  // Verify URL contains document ID pattern
  async expectUrl() {
    await expect(this.page).toHaveURL(/strateski-dokument\/\d+/);
  }

  // Get the value element for a field label (e.g., "Статус", "Назив стратешког документа")
  fieldValue(labelText: string): Locator {
    return this.page.locator(`label:has-text("${labelText}") + *, label:has-text("${labelText}") ~ *`).first();
  }

  // Get all tab names
  async getTabNames(): Promise<string[]> {
    return (await this.tabs.allTextContents()).map((t) => t.trim());
  }

  // Click a specific tab by name
  async openTab(tabName: string) {
    await this.tabs.filter({ hasText: tabName }).click();
    await this.page.waitForLoadState("networkidle");
  }

  // Expect a tab to be visible
  async expectTabVisible(tabName: string) {
    await expect(this.tabs.filter({ hasText: tabName })).toBeVisible();
  }

  // Click "Повратак на листу" to go back to document list
  async clickBackToList() {
    await this.backButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  // Click "Измјени" to enter edit mode
  async clickEdit() {
    await this.editButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  // Expect edit button to be visible (user has edit permission)
  async expectEditVisible() {
    await expect(this.editButton).toBeVisible();
  }

  // Expect edit button to NOT be visible (read-only or no permission)
  async expectEditHidden() {
    await expect(this.editButton).toBeHidden();
  }

  // Get status transition button (dynamic text based on available transition)
  statusButton(statusName: string): Locator {
    return this.page.locator(`button:has-text("${statusName}")`);
  }
}
