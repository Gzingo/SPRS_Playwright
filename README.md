# SPRS - Playwright Test Automation Framework

Test automation framework for SPRS (Strategic Planning and Reporting System), a Serbian document management system. Built with Playwright and TypeScript using Page Object Model architecture.

## Tech Stack

- **Playwright** with TypeScript
- **Page Object Model** with custom fixtures
- **API-based session injection** for fast test setup
- **dotenv** for environment configuration

## Project Structure

```
SPRS/
├── api/                        # API objects
│   └── AuthApi.ts              # Authentication & session injection
├── pages/                      # Page Object Model classes
│   ├── LoginPage.ts            # Login form interactions
│   ├── SidebarPage.ts          # Navigation sidebar
│   ├── DocumentListPage.ts     # Table/list views, search & filters
│   ├── DocumentFormPage.ts     # Form interactions
│   ├── DocumentDetailPage.ts   # Document detail view
│   ├── CommonComponents.ts     # Shared UI (modals, toasts, tabs, pagination)
│   └── WizardPage.ts           # Multi-step wizard modals
├── fixtures/                   # Playwright custom fixtures
│   ├── index.ts                # Combined fixtures (pages + API + pre-auth)
│   ├── page.fixture.ts         # Page-only fixtures
│   └── api.fixture.ts          # API-only fixtures
├── support/
│   └── helpers.ts              # Utility functions
├── tests/
│   ├── api/                    # API tests
│   │   ├── auth.spec.ts        # Authentication (positive, negative, security, brute force)
│   │   └── healthCheck.spec.ts # Health check tests
│   └── e2e/                    # End-to-end tests
│       └── smokeTest/
│           ├── uiLoginTest.spec.ts         # UI login tests
│           ├── apiLoginTest.spec.ts        # API login via fixtures
│           ├── sidebar-nav.smoke.spec.ts   # Navigation smoke tests
│           └── modules/
│               └── SD_strateski-dokumenti/ # Strategic Documents module
│                   ├── sd-create.positive.spec.ts
│                   ├── sd-create.negative.spec.ts
│                   ├── sd-create.boundary.spec.ts
│                   ├── sd-edit.positive.spec.ts
│                   ├── sd-edit.negative.spec.ts
│                   ├── sd-status.positive.spec.ts
│                   ├── sd-status.negative.spec.ts
│                   ├── sd-vision.positive.spec.ts
│                   ├── sd-vision.negative.spec.ts
│                   ├── sd-vision.boundary.spec.ts
│                   ├── sd-swot.positive.spec.ts
│                   ├── sd-swot.negative.spec.ts
│                   ├── sd-swot.boundary.spec.ts
│                   └── sd-view.positive.spec.ts
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
└── .env.example                # Environment variables template
```

## Setup

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
git clone https://github.com/Gzingo/SPRS_Playwright.git
cd SPRS_Playwright
npm install
npx playwright install
```

### Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `BASE_URL` - Application URL
- Role credentials (Admin, Pisarnica, Rasporedjivac, Obradjivac, Nacelnik SP)
- Security test credentials
- Invalid/whitespace-padded credentials for negative tests

## Running Tests

```bash
npm test                # Headed mode (visible browser)
npm run test:headless   # Headless mode
npm run test:e2e        # E2E tests only
npm run test:api        # API tests only
npm run test:all        # All browser projects x all tests
npm run report          # Open last HTML report
```

### Browser Projects

The framework supports multiple browser configurations defined in `playwright.config.ts`:

| Project | Description |
|---------|-------------|
| `headed` | Default browser, visible window, 1 retry |
| `headless` | No window, 2 retries |
| `chromium` | Desktop Chrome |
| `edge` | Desktop Edge |
| `firefox` | Desktop Firefox |
| `webkit` | Desktop Safari |

Run a specific project:

```bash
npx playwright test --project=chromium
```

## Key Patterns

### Custom Fixtures

Tests use pre-built fixtures for page objects and pre-authenticated sessions:

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

### Test Naming Convention

Test files follow a consistent naming pattern:
- `.positive.spec.ts` - Happy path scenarios
- `.negative.spec.ts` - Validation failures and error handling
- `.boundary.spec.ts` - Edge cases and limits

## Path Aliases

Configured in `tsconfig.json`:

```typescript
import { LoginPage } from "@pages/LoginPage";
import { AuthApi } from "@api/AuthApi";
import { test } from "@fixtures/index";
import { normalizeText } from "@support/helpers";
```
