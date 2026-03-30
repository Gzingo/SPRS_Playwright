/**
 * DocumentFormPage - Page Object for form views (create/edit document, modal forms, etc.).
 *
 * Fixture name: `docForm`
 * Import: import { test, expect } from "../../fixtures/index";
 *
 * Usage in tests:
 *
 *   test("Fill and save form", async ({ docList, docForm, common }) => {
 *     await docList.clickCreateNew();
 *     await docForm.fillField("Naziv", "Strategija RS 2025-2030");
 *     await docForm.selectDropdown("Status", "Aktivan");
 *     await docForm.checkCheckbox("Javni dokument");
 *     await docForm.clickSave();
 *     await expect(common.toastSuccess).toBeVisible();
 *   });
 *
 *   test("Negative - empty required field", async ({ docList, docForm }) => {
 *     await docList.clickCreateNew();
 *     await docForm.clearField("Naziv");
 *     await docForm.clickSave();
 *     // assert validation error
 *   });
 *
 *   test("Cancel form", async ({ docList, docForm, page }) => {
 *     await docList.clickCreateNew();
 *     await docForm.fillField("Naziv", "Test");
 *     await docForm.clickCancel();
 *     await expect(docForm.form).toBeHidden();
 *   });
 */
import { type Locator, type Page } from '@playwright/test';

export class DocumentFormPage {
  readonly page: Page;
  readonly form: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('form, .modal-body');
    this.saveButton = page.locator('button:has-text("Sačuvaj"), button:has-text("Kreiraj")');
    this.cancelButton = page.locator('button:has-text("Otkaži"), button:has-text("Zatvori")');
  }

  /**
   * Fill an input field found by its label text or placeholder.
   *
   *   await docForm.fillField("Naziv", "Strategija RS 2025-2030");
   *   await docForm.fillField("Opis", "Opis dokumenta za testiranje");
   */
  async fillField(fieldName: string, value: string) {
    const input = this.page.locator(`label:has-text("${fieldName}") + input, label:has-text("${fieldName}") ~ input, input[placeholder*="${fieldName}"]`).first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(value);
  }

  /**
   * Clear an input field (set to empty). Use for negative tests (required field validation).
   *
   *   await docForm.clearField("Naziv");
   *   await docForm.clickSave();
   *   // expect validation error
   */
  async clearField(fieldName: string) {
    const input = this.page.locator(`label:has-text("${fieldName}") + input, label:has-text("${fieldName}") ~ input, input[placeholder*="${fieldName}"]`).first();
    await input.fill('');
  }

  /**
   * Select a value from a dropdown. Handles both native <select> and Bootstrap dropdowns.
   *
   *   await docForm.selectDropdown("Status", "Aktivan");
   *   await docForm.selectDropdown("Tip dokumenta", "Strategija");
   */
  async selectDropdown(label: string, value: string) {
    const nativeSelect = this.page.locator(`label:has-text("${label}") ~ select, select[aria-label*="${label}"]`).first();
    const isNativeSelect = await nativeSelect.isVisible().catch(() => false);

    if (isNativeSelect) {
      await nativeSelect.selectOption({ label: value });
    } else {
      const trigger = this.page.locator(`[class*="select"]:has-text("${label}"), .dropdown:has-text("${label}")`).first();
      await trigger.click();
      await this.page.locator(`.dropdown-menu.show a:has-text("${value}"), .dropdown-item:has-text("${value}"), [role="option"]:has-text("${value}")`).first().click();
    }
  }

  /**
   * Check a checkbox found by its label text.
   *
   *   await docForm.checkCheckbox("Javni dokument");
   *   await docForm.checkCheckbox("Aktivan");
   */
  async checkCheckbox(label: string) {
    const checkbox = this.page.locator(`label:has-text("${label}") input[type="checkbox"]`).first();
    await checkbox.check();
  }

  /**
   * Uncheck a checkbox found by its label text.
   *
   *   await docForm.uncheckCheckbox("Javni dokument");
   */
  async uncheckCheckbox(label: string) {
    const checkbox = this.page.locator(`label:has-text("${label}") input[type="checkbox"]`).first();
    await checkbox.uncheck();
  }

  /**
   * Select a radio button found by its label text.
   *
   *   await docForm.selectRadio("Da");
   *   await docForm.selectRadio("Ne");
   */
  async selectRadio(label: string) {
    const radio = this.page.locator(`label:has-text("${label}") input[type="radio"]`).first();
    await radio.check();
  }

  /**
   * Click the "Sačuvaj" / "Kreiraj" button. Typically followed by toast assertion.
   *
   *   await docForm.clickSave();
   *   await expect(common.toastSuccess).toBeVisible();
   */
  async clickSave() {
    await this.saveButton.first().click();
  }

  /**
   * Click the "Otkaži" / "Zatvori" button to discard changes.
   *
   *   await docForm.clickCancel();
   *   await expect(docForm.form).toBeHidden();
   */
  async clickCancel() {
    await this.cancelButton.first().click();
  }
}
