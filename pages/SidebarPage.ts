/**
 * SidebarPage - Page Object for the left sidebar navigation.
 *
 * Fixture name: `sidebar`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   test("Navigate to module", async ({ loginPage, sidebar, page }) => {
 *     await loginPage.goto();
 *     await loginPage.login("admin", "x");
 *     await sidebar.openModule("Стратешки документи");
 *     await expect(page).toHaveURL(/strateski-dokument/);
 *   });
 *
 *   test("Expand group and open sub-item", async ({ sidebar }) => {
 *     await sidebar.expandGroup("Шифарници");
 *     await sidebar.openModule("Врста документа");
 *   });
 *
 *   test("Check module visibility per role", async ({ sidebar }) => {
 *     const visible = await sidebar.isModuleVisible("Администрација");
 *     expect(visible).toBe(true);
 *   });
 */
import { type Locator, type Page } from '@playwright/test';

export class SidebarPage {
  readonly page: Page;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.sp-sidebar, nav.sidebar, .sidebar');
  }

  /**
   * Click a module link in the sidebar and wait for navigation to complete.
   *
   *   await sidebar.openModule("Стратешки документи");
   *   await sidebar.openModule("Предмети");
   */
  async openModule(moduleName: string) {
    const item = this.sidebar.getByText(moduleName);
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Expand a collapsible sidebar group to reveal sub-items.
   * Call this before openModule() when the target is nested.
   *
   *   await sidebar.expandGroup("Шифарници");
   *   await sidebar.openModule("Врста документа");
   */
  async expandGroup(groupName: string) {
    const group = this.sidebar.locator(`.nav-item-expandable .nav-text:has-text("${groupName}")`).first();
    await group.scrollIntoViewIfNeeded();
    await group.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if a module link is visible in the sidebar.
   * Useful for testing role-based sidebar visibility.
   *
   *   const visible = await sidebar.isModuleVisible("Администрација");
   *   expect(visible).toBe(true);
   */
  async isModuleVisible(moduleName: string): Promise<boolean> {
    return this.sidebar.getByText(moduleName).isVisible();
  }
}
