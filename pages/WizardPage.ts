/**
 * WizardPage - Page Object for multi-step wizard modals.
 *
 * Covers the "Нови стратешки документ" wizard and similar create flows.
 * Wizard has 3 steps: Тип документа → Основни подаци → Потврда.
 *
 * Fixture name: `wizard`
 *
 * Usage in tests:
 *
 *   test("Create SD", async ({ adminPage, sidebar, docList, wizard }) => {
 *     await sidebar.openModule("Стратешки документи");
 *     await docList.clickCreateNew();
 *     await wizard.expectOpen();
 *     await wizard.selectDocumentType("Секторске стратегије Републике Српске");
 *     await wizard.clickNext();
 *
 *     const data = {
 *       name: "Test dokument",
 *       authority: { index: 1 },
 *       periodFrom: "2026",
 *       periodTo: "2031",
 *       description: "Opis",
 *     };
 *     await wizard.fillStep2Data(data);
 *     await wizard.expectStep2FilledCorrectly(data);
 *     await wizard.clickNext();
 *     await wizard.clickConfirm();
 *   });
 */
import { type Locator, type Page, expect } from "@playwright/test";

export interface WizardStep2Data {
  name: string;
  authority: { index: number } | { label: string };
  periodFrom: string;
  periodTo: string;
  internalCode?: string;
  description?: string;
}

export class WizardPage {
  readonly page: Page;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator(".modal");
  }

  // - Navigation -

  async expectOpen() {
    await expect(this.modal).toBeVisible();
  }

  async expectStep(stepLabel: string) {
    await expect(this.modal.getByText(stepLabel)).toBeVisible();
  }

  async clickNext() {
    await this.modal.getByText("Даље").click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickBack() {
    await this.modal.getByText("Назад").click();
  }

  async clickCancel() {
    await this.modal.getByText("Откажи").click();
  }

  async clickConfirm() {
    await this.modal
      .locator(
        'button:has-text("Креирај"), button:has-text("Сачувај"), button:has-text("Потврди")',
      )
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  // - Wizard Step 1: Тип документа -

  async selectDocumentType(label: string) {
    await this.modal.locator("select").first().selectOption({ label });
  }

  async expectDocumentTypeOptions(): Promise<string[]> {
    const options = this.modal.locator("select").first().locator("option");
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push(((await options.nth(i).textContent()) ?? "").trim());
    }
    return texts;
  }

  // - Wizard Step 2: Основни подаци -

  async fillDocumentName(name: string) {
    await this.getInput(1).fill(name);
  }

  async selectResponsibleAuthority(
    option: { index: number } | { label: string },
  ) {
    await this.modal.locator("select").first().selectOption(option);
  }

  async fillPeriodFrom(year: string) {
    await this.getInput(2).fill(year);
  }

  async fillPeriodTo(year: string) {
    await this.getInput(3).fill(year);
  }

  async fillInternalCode(code: string) {
    await this.getInput(4).fill(code);
  }

  async fillDescription(description: string) {
    await this.modal.locator("textarea").fill(description);
  }

  // - Composite actions -

  async fillStep2Data(data: WizardStep2Data) {
    await this.fillDocumentName(data.name);
    await this.selectResponsibleAuthority(data.authority);
    await this.fillPeriodFrom(data.periodFrom);
    await this.fillPeriodTo(data.periodTo);
    if (data.internalCode) await this.fillInternalCode(data.internalCode);
    if (data.description) await this.fillDescription(data.description);
  }

  async expectStep2FilledCorrectly(
    data: WizardStep2Data & { docType?: string },
  ) {
    if (data.docType) await this.expectDocumentTypeReadonly(data.docType);
    await this.expectDocumentName(data.name);
    await this.expectAuthoritySelected();
    await this.expectPeriodFrom(data.periodFrom);
    await this.expectPeriodTo(data.periodTo);
    if (data.internalCode) await this.expectInternalCode(data.internalCode);
    if (data.description) await this.expectDescription(data.description);
  }

  // - Assertions -

  async expectDocumentTypeReadonly(expectedValue: string) {
    const field = this.getFormElements().nth(0);
    await expect(field).toBeDisabled();
    await expect(field).toHaveValue(expectedValue);
  }

  async expectDocumentName(expected: string) {
    await expect(this.getInput(1)).toHaveValue(expected);
  }

  async expectPeriodFrom(expected: string) {
    await expect(this.getInput(2)).toHaveValue(expected);
  }

  async expectPeriodTo(expected: string) {
    await expect(this.getInput(3)).toHaveValue(expected);
  }

  async expectInternalCode(expected: string) {
    await expect(this.getInput(4)).toHaveValue(expected);
  }

  async expectDescription(expected: string) {
    await expect(this.modal.locator("textarea")).toHaveValue(expected);
  }

  async expectAuthoritySelected() {
    const value = await this.modal.locator("select").first().inputValue();
    expect(value).not.toContain("null");
  }

  async expectNextDisabled() {
    const btn = this.modal.getByText("Даље");
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  }

  async expectNextEnabled() {
    const btn = this.modal.getByText("Даље");
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  }

  // - Private helpers -

  private getFormElements(): Locator {
    return this.modal.locator("input, select, textarea");
  }

  private getInput(index: number): Locator {
    return this.modal.locator("input").nth(index);
  }
}
