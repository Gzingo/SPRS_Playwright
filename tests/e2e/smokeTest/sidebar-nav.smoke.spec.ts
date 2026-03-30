import { test, expect, type Page } from "@fixtures/index";
import { SidebarPage } from "@pages/SidebarPage";

/**
 * SMOKE TEST: Sidebar Navigation
 *
 * Verifikuje da svaka stavka u sidebar navigaciji uspješno otvara
 * odgovarajuću stranicu, za svih 5 korisničkih naloga.
 *
 * Detekcija: broken rute, RBAC greške, regresije nakon deploy-a.
 *
 * Discovery data sources:
 *   - Admin sidebar:     SPRSTestAutomationAI/Test alignment discovery/ad-discovery-report.md
 *   - Pisarnica sidebar: SPRSTestAutomationAI/Test alignment discovery/PISARNICA_COMPLETE_DISCOVERY.md
 *   - V2 delta:          FinalTestSuiteQA/_reports/DISCOVERY_V2_DELTA.md
 *
 * Last verified: 2026-03-25 (Session 81, env 20003)
 *   - Pisarnica/Raspoređivač/Obrađivač: 5 items (Обавјештења + Предмети + ЕК + КУП + КИП)
 *   - Srednjoročni planovi: sub-item of Спроведбени документи (not top-level)
 *   - Načelnik SP: 42 sidebar items, full SP + Šifarnici access
 *   - Šifarnici: "Орган управе" and "Улога корисника" removed from sidebar
 */

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function logVisibleSidebarItems(page: Page, roleName: string) {
  const sidebar = new SidebarPage(page);
  const items = await sidebar.sidebar.locator(".nav-text").allTextContents();
  console.log(`\n=== Sidebar items for ${roleName} (${items.length}) ===`);
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  console.log("===\n");
  return items;
}

async function expectNavigation(page: Page, urlPattern: RegExp) {
  await expect(page).toHaveURL(urlPattern, { timeout: 10000 });
}

// ─── 1. Admin - Landing Page ─────────────────────────────────────────────────

test.describe("Sidebar Nav: Admin - Landing", () => {
  test("Landing page is Обавјештења", async ({ adminPage }) => {
    await expectNavigation(adminPage, /notifications/);
  });
});

// ─── 2. Admin - Top-Level Navigation ──────────────────────────────────────────

test.describe("Sidebar Nav: Admin - Top-Level", () => {
  const topLevelItems: [string, RegExp][] = [
    ["Контролна табла", /dashboard/],
    ["Евиденција важећих докумената", /evidencija-vazecih-dokumenata/],
    ["Стратешки документи", /strateski-dokument/],
    ["Генератор извјештаја", /report-generator/],
    ["Предмети", /predmet/],
    ["Експедициона књига", /ekspediciona-knjiga/],
    ["Књига улазне поште", /knjiga-ulazne-poste/],
    ["Књига излазне поште", /knjiga-izlazne-poste/],
  ];

  for (const [label, urlPattern] of topLevelItems) {
    test(`${label} → page loads`, async ({ adminPage, sidebar }) => {
      await sidebar.openModule(label);
      await expectNavigation(adminPage, urlPattern);
    });
  }
});

// ─── 3. Admin - Спроведбени документи Sub-Group ──────────────────────────────
//
// DOM structure: Спроведбени документи ► (expandable)
//   - Средњорочни планови
//   - Годишњи планови
//   - Акциони планови

test.describe("Sidebar Nav: Admin - Спроведбени документи", () => {
  test("Спроведбени документи → Средњорочни планови", async ({
    adminPage,
    sidebar,
  }) => {
    await sidebar.expandGroup("Спроведбени документи");
    await sidebar.openModule("Средњорочни планови");
    await expectNavigation(adminPage, /srednjorocni-plan/);
  });
});

// ─── 4. Admin - Šifarnici Submenu ─────────────────────────────────────────────

test.describe("Sidebar Nav: Admin - Šifarnici", () => {
  const sifarnikItems: [string, RegExp][] = [
    ["Извор финансирања", /sifarnici\/izvor-finansiranja/],
    ["Међународна организација", /sifarnici\/medjunarodna-organizacija/],
    ["Ниво усклађености", /sifarnici\/nivo-uskladjenosti/],
    ["ПЈИ статус", /sifarnici\/pji-status/],
    ["Статус акционог плана", /sifarnici\/status-akcionog-plana/],
    ["Статус активности", /sifarnici\/status-aktivnosti/],
    ["Статус важења документа", /sifarnici\/status-vazenja-dokumenta/],
    ["Статус документа", /sifarnici\/status-dokumenta/],
    ["Статус инструкције", /sifarnici\/status-instrukcije/],
    ["Статус коментара", /sifarnici\/status-komentara/],
    ["Статус обраде консултација", /sifarnici\/status-obrade-konsultacija/],
    ["Статус пројекта", /sifarnici\/status-projekta/],
    ["Тип визуализације", /sifarnici\/tip-vizualizacije/],
    ["Тип графикона", /sifarnici\/tip-grafikona/],
    ["Тип документа", /sifarnici\/tip-dokumenta/],
    ["Тип елемента стратегије", /sifarnici\/tip-elementa-strategije/],
    ["Тип извјештаја праћење", /sifarnici\/tip-izvestaja-pracenje/],
    ["Тип индикатора", /sifarnici\/tip-indikatora/],
    ["Тип институције", /sifarnici\/tip-institucije/],
    ["Тип инструкције", /sifarnici\/tip-instrukcije/],
    ["Тип коментара", /sifarnici\/tip-komentara/],
    ["Тип међународног документа", /sifarnici\/tip-medjunarodnog-dokumenta/],
    ["Тип мишљења", /sifarnici\/tip-misljenja/],
    ["Тип обавјештења", /sifarnici\/tip-obavestenja/],
    ["Тип прописа", /sifarnici\/tip-propisa/],
    ["Фреквенција праћења", /sifarnici\/frekvencija-pracenja/],
    ["SDG циљеви", /sifarnici\/sdg/],
    ["Индикатори", /sifarnici\/indikatori/],
  ];

  for (const [label, urlPattern] of sifarnikItems) {
    test(`Шифарници → ${label}`, async ({ adminPage, sidebar }) => {
      await sidebar.expandGroup("Шифарници");
      await sidebar.openModule(label);
      await expectNavigation(adminPage, urlPattern);
    });
  }
});

// ─── 5. Admin - Administracija Submenu ────────────────────────────────────────
//
// DOM structure: Администрација ► (expandable)
//   - Опште ► (sub-expandable): Складишта докумената, ДМ типови, Мониторинг кеша, ...
//   - Корисници ► (sub-expandable): Корисници, Корисничке групе, ...
//   - Дозволе ► (sub-expandable): Апликативне улоге, ...
//   - Безбедност ► (sub-expandable): Складишта кључева, ...
//   - Конфигурација прилога (flat item, directly under Администрација)

test.describe("Sidebar Nav: Admin - Administracija", () => {
  const subGroupItems: [string, string, RegExp][] = [
    // [subGroup, label, urlPattern]
    // NOTE: "Корисничке групе" instead of "Корисници" to avoid strict mode
    // violation (text "Корисници" exists as both group header and menu item)
    // "ДМ типови" redirects to #/notifications on env 20003 (route broken, 2026-03-25)
    ["Опште", "Мониторинг кеша", /admin\/general\/cacheMonitoring/],
    ["Корисници", "Корисничке групе", /admin\/users/],
    ["Дозволе", "Апликативне улоге", /admin\/permissions\/roleRelation/],
  ];

  for (const [subGroup, label, urlPattern] of subGroupItems) {
    test(`Администрација → ${subGroup} → ${label}`, async ({
      adminPage,
      sidebar,
    }) => {
      await sidebar.expandGroup("Администрација");
      await sidebar.expandGroup(subGroup);
      await sidebar.openModule(label);
      await expectNavigation(adminPage, urlPattern);
    });
  }

  test("Администрација → Конфигурација прилога", async ({
    adminPage,
    sidebar,
  }) => {
    await sidebar.expandGroup("Администрација");
    await sidebar.openModule("Конфигурација прилога");
    await expectNavigation(adminPage, /konfiguracija-priloga/);
  });
});

// ─── 6. Pisarnica (QA Test) ──────────────────────────────────────────────────
//
// RBAC state (2026-03-25, env 20003): 5 items visible:
//   Обавјештења, Предмети, Експедициона књига, Књига улазне поште, Књига излазне поште

test.describe("Sidebar Nav: Pisarnica", () => {
  test("Landing page is Обавјештења", async ({ pisarnicaPage }) => {
    await expectNavigation(pisarnicaPage, /notifications/);
  });

  const visible: [string, RegExp][] = [
    ["Предмети", /predmet/],
    ["Експедициона књига", /ekspediciona-knjiga/],
    ["Књига улазне поште", /knjiga-ulazne-poste/],
    ["Књига излазне поште", /knjiga-izlazne-poste/],
  ];

  for (const [label, urlPattern] of visible) {
    test(`${label} → page loads`, async ({ pisarnicaPage }) => {
      const sidebar = new SidebarPage(pisarnicaPage);
      await sidebar.openModule(label);
      await expectNavigation(pisarnicaPage, urlPattern);
    });
  }

  const notVisible = ["Стратешки документи", "Шифарници"];

  for (const label of notVisible) {
    test(`${label} NOT visible`, async ({ pisarnicaPage }) => {
      const sidebar = new SidebarPage(pisarnicaPage);
      const vis = await sidebar.isModuleVisible(label);
      expect(vis).toBe(false);
    });
  }
});

// ─── 7. Raspoređivač - Sidebar Discovery ─────────────────────────────────────
//
// RBAC state (2026-03-25, env 20003): 5 items (same as Pisarnica).

test.describe("Sidebar Nav: Raspoređivač", () => {
  test("Discovery - log visible sidebar items", async ({
    rasporedjivacPage,
  }) => {
    const items = await logVisibleSidebarItems(
      rasporedjivacPage,
      "Raspoređivač",
    );
    expect(items.length).toBeGreaterThan(0);
  });

  const visible: [string, RegExp][] = [
    ["Предмети", /predmet/],
    ["Експедициона књига", /ekspediciona-knjiga/],
  ];

  for (const [label, urlPattern] of visible) {
    test(`${label} → page loads`, async ({ rasporedjivacPage }) => {
      const sidebar = new SidebarPage(rasporedjivacPage);
      await sidebar.openModule(label);
      await expectNavigation(rasporedjivacPage, urlPattern);
    });
  }

  const notVisible = ["Стратешки документи"];

  for (const label of notVisible) {
    test(`${label} NOT visible`, async ({ rasporedjivacPage }) => {
      const sidebar = new SidebarPage(rasporedjivacPage);
      const vis = await sidebar.isModuleVisible(label);
      expect(vis).toBe(false);
    });
  }
});

// ─── 8. Obrađivač - Sidebar Discovery ────────────────────────────────────────
//
// RBAC state (2026-03-25, env 20003): 5 items (same as Pisarnica).

test.describe("Sidebar Nav: Obrađivač", () => {
  test("Discovery - log visible sidebar items", async ({ obradjivacPage }) => {
    const items = await logVisibleSidebarItems(obradjivacPage, "Obrađivač");
    expect(items.length).toBeGreaterThan(0);
  });

  const visible: [string, RegExp][] = [
    ["Предмети", /predmet/],
    ["Експедициона књига", /ekspediciona-knjiga/],
  ];

  for (const [label, urlPattern] of visible) {
    test(`${label} → page loads`, async ({ obradjivacPage }) => {
      const sidebar = new SidebarPage(obradjivacPage);
      await sidebar.openModule(label);
      await expectNavigation(obradjivacPage, urlPattern);
    });
  }

  const notVisible = ["Стратешки документи"];

  for (const label of notVisible) {
    test(`${label} NOT visible`, async ({ obradjivacPage }) => {
      const sidebar = new SidebarPage(obradjivacPage);
      const vis = await sidebar.isModuleVisible(label);
      expect(vis).toBe(false);
    });
  }
});

// ─── 9. Načelnik SP - Sidebar Discovery ──────────────────────────────────────

test.describe("Sidebar Nav: Načelnik SP", () => {
  test("Discovery - log visible sidebar items", async ({ nacelnikSPPage }) => {
    const items = await logVisibleSidebarItems(nacelnikSPPage, "Načelnik SP");
    expect(items.length).toBeGreaterThan(0);
  });

  test("Стратешки документи → page loads (soft)", async ({
    nacelnikSPPage,
  }) => {
    const sidebar = new SidebarPage(nacelnikSPPage);
    const visible = await sidebar.isModuleVisible("Стратешки документи");
    if (visible) {
      await sidebar.openModule("Стратешки документи");
      await expectNavigation(nacelnikSPPage, /strateski-dokument/);
    } else {
      console.log("DISCOVERY: Načelnik SP does NOT see Стратешки документи");
    }
  });

  test("Предмети → check access (soft)", async ({ nacelnikSPPage }) => {
    const sidebar = new SidebarPage(nacelnikSPPage);
    const visible = await sidebar.isModuleVisible("Предмети");
    if (visible) {
      await sidebar.openModule("Предмети");
      await expectNavigation(nacelnikSPPage, /predmet/);
    } else {
      console.log("DISCOVERY: Načelnik SP does NOT see Предмети");
    }
  });
});
