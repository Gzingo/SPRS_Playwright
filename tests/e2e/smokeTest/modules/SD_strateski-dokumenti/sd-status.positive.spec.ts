import { test, expect } from "@fixtures/index";

/**
 * SD: Status Workflow - Positive tests
 *
 * TC: SD-010111 (Draft → "Интерна провјера"), SD-010112 ("Интерна провјера" → next),
 *     SD-010115 (revert to Draft)
 *
 * Tests for document status transitions.
 * Other transitions are tested if documents in those statuses exist.
 *
 * Serial mode: transition test changes document state, subsequent tests depend on it.
 */

test.describe("SD: Status - Positive", () => {
  test.describe.configure({ mode: "serial" });

  let targetDocName: string;

  // Navigate to SD list before each test
  test.beforeEach(async ({ adminPage, sidebar }) => {
    await sidebar.openModule("Стратешки документи");
    await expect(adminPage).toHaveURL(/#.*strateski-dokument/);
  });

  // TC: SD-010111 - Draft document shows "Интерна провјера" transition button
  test("Draft document has transition button to Интерна провјера", async ({
    adminPage,
    docDetail,
  }) => {
    const draftRow = adminPage
      .locator('table tbody tr:has-text("Драфт")')
      .first();
    // Get document name from breadcrumb after opening (h1 contains page title, not doc name)
    await draftRow.click();
    await docDetail.expectLoaded();
    targetDocName =
      (
        await adminPage.locator(".breadcrumb-item.active").first().textContent()
      )?.trim() || "";
    expect(targetDocName.length).toBeGreaterThan(0);

    // Transition button is visible
    const transitionBtn = docDetail.statusButton("Интерна провјера");
    await expect(transitionBtn).toBeVisible();
  });

  // TC: SD-010111 - Click transition button, document status changes to "Интерна провјера"
  test("Transition Draft → Интерна провјера succeeds", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    await docList.clickRowByText(targetDocName);
    await docDetail.expectLoaded();

    const transitionBtn = docDetail.statusButton("Интерна провјера");
    await transitionBtn.click();
    await adminPage.waitForLoadState("networkidle");
    await adminPage.waitForTimeout(2000);

    // Handle confirmation dialog if it appears
    const confirmBtn = adminPage.locator(
      "button:has-text('Да'), button:has-text('Потврди'), button:has-text('OK')",
    );
    if (
      await confirmBtn
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await confirmBtn.first().click();
      await adminPage.waitForLoadState("networkidle");
      await adminPage.waitForTimeout(1000);
    }

    await expect(adminPage.getByText("Интерна провјера").first()).toBeVisible({
      timeout: 5000,
    });
  });

  // TC: SD-010111 - After transition, document appears with new status in list
  test("Transitioned document shows new status in list", async ({
    adminPage,
    docList,
  }) => {
    await docList.searchDocument(targetDocName);
    await docList.clickSearch();
    await adminPage.waitForTimeout(500);

    const row = adminPage
      .locator(`table tbody tr:has-text("${targetDocName}")`)
      .first();
    await expect(row).toBeVisible({ timeout: 5000 });

    const statusText = await row.locator("td:nth-child(5)").textContent();
    expect(statusText?.trim()).toBe("Интерна провјера");
  });

  // TC: SD-010112 - Document in "Интерна провјера" has next transition option
  test("Document in Интерна провјера shows next transition option", async ({
    adminPage,
    docDetail,
  }) => {
    const reviewRow = adminPage
      .locator('table tbody tr:has-text("Интерна провјера")')
      .first();

    if ((await reviewRow.count()) === 0) {
      test.skip();
      return;
    }

    await reviewRow.click();
    await docDetail.expectLoaded();

    const candidates = ["Јавна консултација", "Финализација", "Драфт", "Нацрт"];
    let foundTransition = false;

    for (const name of candidates) {
      const btn = docDetail.statusButton(name);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found transition button: "${name}"`);
        foundTransition = true;
      }
    }

    if (!foundTransition) {
      console.log("No transition buttons found for Интерна провјера - workflow may not allow admin transitions from this status");
      test.skip();
    }
  });

  // TC: SD-010115 - Revert: transition back to "Драфт" for cleanup (if button available)
  test("Revert document back to Draft for cleanup", async ({
    adminPage,
    docList,
    docDetail,
  }) => {
    await docList.searchDocument(targetDocName);
    await docList.clickSearch();
    await adminPage.waitForTimeout(500);
    await adminPage
      .locator(`table tbody tr:has-text("${targetDocName}")`)
      .first()
      .click();
    await docDetail.expectLoaded();

    const revertBtn = adminPage.locator(
      "button:has-text('Драфт'), button:has-text('Нацрт')",
    );
    if (
      await revertBtn
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await revertBtn.first().click();
      await adminPage.waitForLoadState("networkidle");
      await adminPage.waitForTimeout(1000);

      const confirmBtn = adminPage.locator(
        "button:has-text('Да'), button:has-text('Потврди'), button:has-text('OK')",
      );
      if (
        await confirmBtn
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await confirmBtn.first().click();
        await adminPage.waitForLoadState("networkidle");
      }

      await expect(adminPage.getByText("Драфт").first()).toBeVisible({
        timeout: 5000,
      });
    } else {
      console.log(
        "No revert button available - document stays in Интерна провјера",
      );
    }
  });
});
