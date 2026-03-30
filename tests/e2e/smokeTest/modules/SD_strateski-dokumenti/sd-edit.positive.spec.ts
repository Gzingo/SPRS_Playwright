import { test, expect } from "@fixtures/index";

/**
 * SD: Edit Document - Positive tests
 *
 * TC: SD-010116 (edit draft document)
 *
 * Tests for editing document details (name, description) on draft documents.
 * Edit opens a modal "Измјена стратешког документа" with form fields.
 */

const DATE = new Date().toISOString().slice(2, 10).replace(/-/g, "");
const UID = Math.random().toString(36).slice(2, 5);

const editModal = ".modal";
const nameLabel = "Назив стратешког документа";

test.describe("SD: Edit - Positive", () => {
  test.beforeEach(async ({ adminPage, sidebar }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // TC: SD-010116 - Click edit on a draft document, modal opens with form fields
  test("Edit button opens modal form with populated fields", async ({
    adminPage,
    docDetail,
  }) => {
    await adminPage.locator('table tbody tr:has-text("Драфт")').first().click();
    await docDetail.expectLoaded();

    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });

    const nameInput = adminPage.locator(editModal).getByLabel(nameLabel);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
    const nameValue = await nameInput.inputValue();
    expect(nameValue.length).toBeGreaterThan(0);

    await expect(adminPage.locator(editModal).getByText("Сачувај")).toBeVisible();
    await expect(adminPage.locator(editModal).getByText("Откажи")).toBeVisible();
  });

  // TC: SD-010116 - Change document name, save, verify updated name on detail page
  test("Edit document name and save - name is updated", async ({
    adminPage,
    docDetail,
  }) => {
    await adminPage.locator('table tbody tr:has-text("Драфт")').first().click();
    await docDetail.expectLoaded();

    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });

    const nameInput = adminPage.locator(editModal).getByLabel(nameLabel);
    const originalName = await nameInput.inputValue();
    const newName = `EDIT-${DATE}-${UID}`;
    await nameInput.fill(newName);

    await adminPage.locator(editModal).getByText("Сачувај").click();
    await adminPage.waitForLoadState("networkidle");
    await adminPage.waitForTimeout(1000);

    await expect(adminPage.getByText(newName).first()).toBeVisible({ timeout: 5000 });

    // Restore original name
    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });
    await adminPage.locator(editModal).getByLabel(nameLabel).fill(originalName);
    await adminPage.locator(editModal).getByText("Сачувај").click();
    await adminPage.waitForLoadState("networkidle");
  });

  // TC: SD-010116 - Edit description field, save, verify updated
  test("Edit document description and save", async ({
    adminPage,
    docDetail,
  }) => {
    await adminPage.locator('table tbody tr:has-text("Драфт")').first().click();
    await docDetail.expectLoaded();

    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });

    const descField = adminPage.locator(editModal).locator("textarea");
    const originalDesc = await descField.inputValue();
    const newDesc = `Updated description ${DATE}-${UID}`;
    await descField.fill(newDesc);

    await adminPage.locator(editModal).getByText("Сачувај").click();
    await adminPage.waitForLoadState("networkidle");
    await adminPage.waitForTimeout(1000);

    await expect(adminPage.getByText(newDesc).first()).toBeVisible({ timeout: 5000 });

    // Restore original
    await docDetail.clickEdit();
    await expect(adminPage.locator(editModal)).toBeVisible({ timeout: 5000 });
    await adminPage.locator(editModal).locator("textarea").fill(originalDesc);
    await adminPage.locator(editModal).getByText("Сачувај").click();
    await adminPage.waitForLoadState("networkidle");
  });
});
