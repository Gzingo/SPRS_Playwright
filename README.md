# SPRS - Playwright E2E Test Suite

Automated E2E and API test suite for SPRS (Strategic Planning System for the Coordination of Supervision of Public Enterprises) — a document management system for strategic planning and reporting workflows in the government sector.

Built with Playwright and TypeScript using Page Object Model architecture.

> **Note:** This is a sanitized portfolio version. All internal URLs and credentials have been removed.

## Tech Stack

- **Playwright 1.58.2** — E2E and API test framework
- **TypeScript 5.8.3** — type-safe test development
- **dotenv 16.5.0** — environment configuration

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- **Browser:** Chromium, Firefox, WebKit (installed via `npx playwright install`)

## Installation

```bash
npm install
npx playwright install
cp .env.example .env   # fill in credentials
```

## Running Tests

```bash
# Headed mode (visible browser)
npm test

# Headless mode
npm run test:headless

# E2E tests only
npm run test:e2e

# API tests only
npm run test:api

# All browser projects x all tests
npm run test:all

# Open last HTML report
npm run report

# Specific browser project
npx playwright test --project=chromium
npx playwright test --project=edge
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Browser Projects

| Project | Description |
|---------|-------------|
| `headed` | Default browser, visible window, 1 retry |
| `headless` | No window, 2 retries |
| `chromium` | Desktop Chrome |
| `edge` | Desktop Edge |
| `firefox` | Desktop Firefox |
| `webkit` | Desktop Safari |

## Project Structure

```
api/                        # API objects
  AuthApi.ts                # Authentication & session injection
pages/                      # Page Object Model classes
  LoginPage.ts              # Login form interactions
  SidebarPage.ts            # Navigation sidebar
  DocumentListPage.ts       # Table/list views, search & filters
  DocumentFormPage.ts       # Form interactions
  DocumentDetailPage.ts     # Document detail view
  CommonComponents.ts       # Shared UI (modals, toasts, tabs, pagination)
  WizardPage.ts             # Multi-step wizard modals
fixtures/                   # Playwright custom fixtures
  index.ts                  # Combined fixtures (pages + API + pre-auth)
  page.fixture.ts           # Page-only fixtures
  api.fixture.ts            # API-only fixtures
support/
  helpers.ts                # Utility functions
tests/
  api/                      # API tests
    auth.spec.ts            # Authentication (positive, negative, security, brute force)
    healthCheck.spec.ts     # Health check tests
  e2e/                      # End-to-end tests
    smokeTest/
      uiLoginTest.spec.ts          # UI login tests
      apiLoginTest.spec.ts          # API login via fixtures
      sidebar-nav.smoke.spec.ts     # Navigation smoke tests
      modules/
        SD_strateski-dokumenti/     # Strategic Documents module
          sd-create.positive.spec.ts
          sd-create.negative.spec.ts
          sd-create.boundary.spec.ts
          sd-edit.positive.spec.ts
          sd-edit.negative.spec.ts
          sd-status.positive.spec.ts
          sd-status.negative.spec.ts
          sd-vision.positive.spec.ts
          sd-vision.negative.spec.ts
          sd-vision.boundary.spec.ts
          sd-swot.positive.spec.ts
          sd-swot.negative.spec.ts
          sd-swot.boundary.spec.ts
          sd-view.positive.spec.ts
```

## Architecture

### Custom Fixtures

Tests use pre-built Playwright fixtures for page objects and pre-authenticated sessions:

```typescript
import { test } from "@fixtures/index";

test("example with page objects", async ({ loginPage, sidebar, docList }) => {
  await loginPage.loginAsAdmin();
  await sidebar.openModule("Стратешки документи");
  await docList.searchDocument("test");
});

test("example with pre-authenticated page", async ({ adminPage, sidebar }) => {
  // Already logged in as Admin via API session injection
  await sidebar.openModule("Стратешки документи");
});
```

### API Session Injection

Fast authentication (~5s) by injecting JWT tokens directly into `localStorage`, bypassing the UI login flow:

```typescript
import { test } from "@fixtures/index";

test("fast login via API", async ({ adminPage }) => {
  // adminPage is already authenticated - ready to use
});
```

### Path Aliases

Configured in `tsconfig.json` for clean imports:

```typescript
import { LoginPage } from "@pages/LoginPage";
import { AuthApi } from "@api/AuthApi";
import { test } from "@fixtures/index";
import { normalizeText } from "@support/helpers";
```

## Test Coverage

**API Auth** — 34 tests
- Login per role, JWT structure validation
- Negative: invalid credentials, empty fields, SQL injection
- Brute force protection

**API Health Check** — 37 tests
- Endpoint health checks

**UI Login** — 15 tests
- Login form scenarios (positive, negative)

**API Login (fixtures)** — 5 tests
- Session injection verification per role

**Sidebar Navigation** — 18 tests
- Module navigation smoke tests

**Strategic Documents (SD) Module** — 47 tests
- Create: positive (5), negative (3), boundary (1)
- Edit: positive (3), negative (2)
- Status: positive (5), negative (1)
- Vision: positive (5), negative (3), boundary (4)
- SWOT: positive (2), negative (2), boundary (1)
- View: positive (10)

## Conventions

### Naming

- **Page Objects:** PascalCase (e.g. `LoginPage.ts`, `DocumentListPage.ts`)
- **Test files:** `<module>-<action>.<type>.spec.ts` (e.g. `sd-create.positive.spec.ts`)
- **Test types:** `.positive.spec.ts`, `.negative.spec.ts`, `.boundary.spec.ts`
- **Fixtures:** `<scope>.fixture.ts` (e.g. `page.fixture.ts`, `api.fixture.ts`)
- **Exports:** class instances via fixtures, not direct imports in tests

### Import Pattern

```typescript
// Tests import fixtures, never page objects directly
import { test } from "@fixtures/index";

test("example", async ({ adminPage, sidebar, docList }) => {
  // Page objects injected via fixtures
});
```

## Environment Variables

All sensitive values (URLs, credentials) are stored in `.env` and loaded via `dotenv`. See `.env.example` for the full list.

Key groups:
- **Base URL** — application URL
- **Credentials** — Admin, Pisarnica, Rasporedjivac, Obradjivac, Nacelnik SP roles
- **Security tests** — SQL injection, brute force payloads
- **Negative tests** — invalid and whitespace-padded credentials

## Reporting

Playwright generates an HTML report with:
- Pass/fail/skip status per test
- Screenshots and traces on failure
- Execution duration

```bash
npm run report   # Open last HTML report
```

## Other Root Files

- **`playwright.config.ts`** — Playwright configuration (browser projects, retries, timeouts)
- **`tsconfig.json`** — TypeScript configuration with path aliases

## Author

[**Nikola Nikolić** — QA Automation Engineer](https://github.com/Gzingo)
