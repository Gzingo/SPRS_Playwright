/**
 * Utility helper functions shared across tests and page objects.
 *
 * Import directly where needed:
 *   import { normalizeText, formatDate } from "../../support/helpers";
 *
 * Usage in tests:
 *
 *   test("Compare text ignoring whitespace", async ({ page }) => {
 *     const text = await page.locator("h1").textContent();
 *     expect(normalizeText(text!)).toBe("strateski dokumenti");
 *   });
 *
 *   test("Verify date format", async ({ docForm }) => {
 *     const today = formatDate(new Date());   // "10.03.2026"
 *     await docForm.fillField("Datum", today);
 *   });
 */

/**
 * Trim, lowercase, and collapse whitespace into single spaces.
 *
 *   normalizeText("  Hello   World  ");   // → "hello world"
 *   normalizeText("Стратешки  документи"); // → "стратешки документи"
 */
export const normalizeText = (text: string): string =>
  text.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Format a Date object as DD.MM.YYYY (Serbian/European date format).
 *
 *   formatDate(new Date(2026, 2, 10));   // → "10.03.2026"
 *   formatDate(new Date());              // → today's date
 */
export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
};
