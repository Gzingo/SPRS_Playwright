/**
 * CommonComponents - Page Object for shared UI elements (modals, toasts, tabs, buttons, pagination).
 *
 * Fixture name: `common`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   test("Save and verify toast", async ({ docForm, common }) => {
 *     await docForm.clickSave();
 *     await expect(common.toastSuccess).toBeVisible();
 *   });
 *
 *   test("Delete with confirmation", async ({ common }) => {
 *     await common.clickButton("Obriši");
 *     await expect(common.confirmDialog).toBeVisible();
 *     await common.confirmAction();
 *     await expect(common.toastSuccess).toBeVisible();
 *   });
 *
 *   test("Switch tab", async ({ common, page }) => {
 *     await common.clickTab("Detalji");
 *     await expect(page.locator(".tab-pane.active")).toContainText("Detalji");
 *   });
 *
 *   // Pagination -- iterate through all pages of a table:
 *   test("Process all pages", async ({ common }) => {
 *     let pageNum = 1;
 *     do {
 *       console.log(`Page ${pageNum}, total: ${await common.getPaginationInfo()}`);
 *       // ... process rows on current page ...
 *       pageNum++;
 *     } while (await common.goToNextPage());
 *   });
 *
 *   // Or jump directly:
 *   await common.goToPage(3);
 *   await common.goToFirstPage();
 *   await common.goToLastPage();
 */
import { type Locator, type Page } from '@playwright/test';

export class CommonComponents {
  readonly page: Page;
  readonly toastSuccess: Locator;
  readonly toastError: Locator;
  readonly modal: Locator;
  readonly confirmDialog: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toastSuccess = page.locator('.toast-success, .alert-success');
    this.toastError = page.locator('.toast-error, .alert-danger');
    this.modal = page.locator('.modal, [role="dialog"]');
    this.confirmDialog = page.getByRole('dialog');
    this.loadingSpinner = page.locator('.spinner, .loading');
  }

  /**
   * Close the currently open modal by clicking its X button.
   *
   *   await common.closeModal();
   *   await expect(common.modal).toBeHidden();
   */
  async closeModal() {
    await this.page.locator('.modal .close, [aria-label="Close"]').first().click();
  }

  /**
   * Click "OK" / "Da" / "Potvrdi" in a confirmation dialog.
   * Typically called after an action that triggers a confirm prompt (e.g. delete).
   *
   *   await common.clickButton("Obriši");
   *   await expect(common.confirmDialog).toBeVisible();
   *   await common.confirmAction();
   */
  async confirmAction() {
    await this.page.getByRole('button', { name: /OK|Da|Potvrdi/ }).click();
  }

  /**
   * Click "Cancel" / "Ne" / "Otkaži" in a confirmation dialog.
   *
   *   await common.clickButton("Obriši");
   *   await expect(common.confirmDialog).toBeVisible();
   *   await common.cancelAction();
   *   // document should NOT be deleted
   */
  async cancelAction() {
    await this.page.getByRole('button', { name: /Cancel|Ne|Otkaži/ }).click();
  }

  /**
   * Dismiss any open modal by pressing Escape. Safe to call even if no modal is open.
   * Useful in beforeEach/afterEach hooks to clean up state.
   *
   *   test.afterEach(async ({ common }) => {
   *     await common.dismissModalIfOpen();
   *   });
   */
  async dismissModalIfOpen() {
    const modalVisible = this.page.locator('.modal.show');
    if (await modalVisible.count() > 0) {
      await this.page.keyboard.press('Escape');
      await modalVisible.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
    }
  }

  /**
   * Click a tab by its visible text.
   *
   *   await common.clickTab("Detalji");
   *   await common.clickTab("Indikatori");
   *   await common.clickTab("Dokumenta");
   */
  async clickTab(tabName: string) {
    await this.page.locator(`[role="tab"]:has-text("${tabName}"), .nav-tabs .nav-link:has-text("${tabName}")`).first().click();
  }

  /**
   * Click any button or button-styled link by its visible text.
   *
   *   await common.clickButton("Obriši");
   *   await common.clickButton("Preuzmi");
   *   await common.clickButton("Štampaj");
   */
  async clickButton(buttonText: string) {
    await this.page.locator(`button:has-text("${buttonText}"), a.btn:has-text("${buttonText}")`).first().click();
  }

  // ═══════════════════════════════════════════════════
  //  Pagination -- Angular/ngx style
  // ═══════════════════════════════════════════════════
  //
  //  DOM structure:
  //    <li class="page-item disabled"><a class="page-link"><<</a></li>  ← first
  //    <li class="page-item disabled"><a class="page-link"><</a></li>   ← prev
  //    <li class="page-item active"><a class="page-link">1</a></li>    ← current
  //    <li class="page-item"><a class="page-link">2</a></li>
  //    <li class="page-item"><a class="page-link">></a></li>           ← next
  //    <li class="page-item"><a class="page-link">>></a></li>          ← last

  /**
   * Find a pagination link by its exact visible text (e.g. ">", "<<", "3").
   * Returns null if not found or if its parent <li> is disabled.
   */
  private async findPageLink(
    text: string,
    opts: { allowDisabled?: boolean } = {},
  ) {
    const links = await this.page
      .locator("li.page-item > a.page-link")
      .all();

    for (const link of links) {
      const linkText = (await link.innerText()).trim();
      if (linkText === text) {
        if (!opts.allowDisabled) {
          const disabled = await link.evaluate(
            (el) => el.parentElement?.classList.contains("disabled") ?? false,
          );
          if (disabled) return null;
        }
        return link;
      }
    }
    return null;
  }

  /**
   * Navigate to the next page. Returns true if navigation happened,
   * false if already on the last page.
   *
   *   while (await common.goToNextPage()) {
   *     // process rows on the new page
   *   }
   */
  async goToNextPage(): Promise<boolean> {
    const next = await this.findPageLink(">");
    if (!next) return false;
    await next.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
    return true;
  }

  /**
   * Navigate to the previous page. Returns true if navigation happened,
   * false if already on the first page.
   *
   *   if (await common.goToPrevPage()) {
   *     console.log("Went back one page");
   *   }
   */
  async goToPrevPage(): Promise<boolean> {
    const prev = await this.findPageLink("<");
    if (!prev) return false;
    await prev.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
    return true;
  }

  /**
   * Jump to the first page. Returns false if already there.
   *
   *   await common.goToFirstPage();
   */
  async goToFirstPage(): Promise<boolean> {
    const first = await this.findPageLink("<<");
    if (!first) return false;
    await first.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
    return true;
  }

  /**
   * Jump to the last page. Returns false if already there.
   *
   *   await common.goToLastPage();
   */
  async goToLastPage(): Promise<boolean> {
    const last = await this.findPageLink(">>");
    if (!last) return false;
    await last.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
    return true;
  }

  /**
   * Jump to a specific page number (1-based). Returns false if the
   * page number link doesn't exist or is already active.
   *
   *   await common.goToPage(3);
   */
  async goToPage(pageNumber: number): Promise<boolean> {
    const link = await this.findPageLink(String(pageNumber));
    if (!link) return false;
    await link.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
    return true;
  }

  /**
   * Get the currently active page number (1-based).
   * Returns 0 if no pagination is visible.
   *
   *   const current = await common.getCurrentPage(); // e.g. 2
   */
  async getCurrentPage(): Promise<number> {
    const active = this.page.locator("li.page-item.active > a.page-link");
    if ((await active.count()) === 0) return 0;
    const text = (await active.first().innerText()).trim();
    return parseInt(text, 10) || 0;
  }

  /**
   * Get pagination info: current page, total visible pages, whether
   * next/prev are available.
   *
   *   const info = await common.getPaginationInfo();
   *   // { currentPage: 2, visiblePages: [1,2,3], hasNext: true, hasPrev: true }
   */
  async getPaginationInfo(): Promise<{
    currentPage: number;
    visiblePages: number[];
    hasNext: boolean;
    hasPrev: boolean;
    hasFirst: boolean;
    hasLast: boolean;
  }> {
    const currentPage = await this.getCurrentPage();
    const visiblePages: number[] = [];

    const links = await this.page
      .locator("li.page-item > a.page-link")
      .all();

    for (const link of links) {
      const text = (await link.innerText()).trim();
      const num = parseInt(text, 10);
      if (!isNaN(num)) visiblePages.push(num);
    }

    return {
      currentPage,
      visiblePages,
      hasNext: (await this.findPageLink(">")) !== null,
      hasPrev: (await this.findPageLink("<")) !== null,
      hasFirst: (await this.findPageLink("<<")) !== null,
      hasLast: (await this.findPageLink(">>")) !== null,
    };
  }

  /**
   * Check if pagination exists on the page.
   *
   *   if (await common.hasPagination()) { ... }
   */
  async hasPagination(): Promise<boolean> {
    return (await this.page.locator("li.page-item").count()) > 0;
  }
}
