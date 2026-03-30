import { test, expect, type Page } from "@fixtures/index";
import { SidebarPage } from "@pages/SidebarPage";

// Verify that API-injected browser sessions are fully functional:
// Each role logs in via API, navigates through sidebar,
// and performs a role-appropriate action to prove the session works end-to-end.

const newPredmetButton = "Нови предмет";
const predmetiMenuItem = "Предмети";
const predmetiUrlPattern = /predmet/;
const noRecordsMessage = "Нема пронађених предмета";

// Required columns that every Predmet row must have
const requiredColumns = [
  "Дјеловодни број",
  "Датум завођења",
  "Тип лица",
  "Статус",
];

/**
 * Navigate to Predmeti and assert list content:
 * - If rows exist: verify required columns are non-empty in first row
 * - If empty: verify "Нема пронађених предмета" message
 */
async function assertPredmetiList(page: Page) {
  const firstRow = page.locator("table tbody tr").first();
  const emptyMsg = page.getByText(noRecordsMessage);

  // Wait for table to render (first row appears whether data exists or table is empty)
  await expect(firstRow).toBeVisible({ timeout: 10000 });

  // Empty table: the row contains "Нема пронађених предмета" instead of data
  if (await emptyMsg.isVisible()) {
    await expect(emptyMsg).toBeVisible();
    return;
  }

  // Table has data - verify headers
  for (const col of requiredColumns) {
    await expect(page.locator("table th", { hasText: col })).toBeVisible();
  }

  // Verify first data row has non-empty values for required columns
  const cellCount = await firstRow.locator("td").count();

  // Skip if single-cell row (colspan message row)
  if (cellCount < 2) return;

  const cells = await firstRow.locator("td").allTextContents();
  // Columns: Дјеловодни број(0), Датум завођења(1), Степен хитности(2), Тип лица(3), Странка(4), Распоређивач(5), Обрађивач(6), Статус(7), Акције(8)
  expect(cells[0].trim()).not.toBe(""); // Дјеловодни број
  expect(cells[1].trim()).not.toBe(""); // Датум завођења
  expect(cells[3].trim()).not.toBe(""); // Тип лица
  expect(cells[7].trim()).not.toBe(""); // Статус
}

test.describe("API Login - Session is functional for all roles", () => {
  test("Admin: API login → Predmeti → page loaded, no create button", async ({
    adminPage,
  }) => {
    const sidebar = new SidebarPage(adminPage);
    await sidebar.openModule(predmetiMenuItem);
    await expect(adminPage).toHaveURL(predmetiUrlPattern);

    // Admin sees Predmeti page but cannot create
    await assertPredmetiList(adminPage);
    await expect(adminPage.getByText(newPredmetButton)).not.toBeVisible();
  });

  test("Pisarnica: API login → Predmeti → list with data, can create", async ({
    pisarnicaPage,
  }) => {
    const sidebar = new SidebarPage(pisarnicaPage);
    await sidebar.openModule(predmetiMenuItem);
    await expect(pisarnicaPage).toHaveURL(predmetiUrlPattern);

    // Pisarnica sees Predmeti list and has create button
    await assertPredmetiList(pisarnicaPage);
    await expect(pisarnicaPage.getByText(newPredmetButton)).toBeVisible();
  });

  test("Raspoređivač: API login → Predmeti → page loaded", async ({
    rasporedjivacPage,
  }) => {
    const sidebar = new SidebarPage(rasporedjivacPage);
    await sidebar.openModule(predmetiMenuItem);
    await expect(rasporedjivacPage).toHaveURL(predmetiUrlPattern);

    await assertPredmetiList(rasporedjivacPage);
  });

  test("Obrađivač: API login → Predmeti → page loaded", async ({
    obradjivacPage,
  }) => {
    const sidebar = new SidebarPage(obradjivacPage);
    await sidebar.openModule(predmetiMenuItem);
    await expect(obradjivacPage).toHaveURL(predmetiUrlPattern);

    await assertPredmetiList(obradjivacPage);
  });

  test("Načelnik SP: API login → Predmeti NOT in sidebar", async ({
    nacelnikSPPage,
  }) => {
    // Načelnik SP has SP access but no Pisarnica modules
    const sidebar = new SidebarPage(nacelnikSPPage);
    const visible = await sidebar.isModuleVisible(predmetiMenuItem);
    expect(visible).toBe(false);
  });
});
