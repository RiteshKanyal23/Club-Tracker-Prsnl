# E2E (Playwright)

Scaffolded Playwright smoke tests for Team Algebra Club Tracker.

## Prerequisites
- Backend API running (default `http://localhost:4000`, DB migrated/seeded)
- Frontend running (default `http://localhost:5173`)
- Install browser binaries once: `npx playwright install chromium` (from `frontend/`)

## Run
From `frontend/`:

```bash
# list tests
npx playwright test --list

# run smoke tests (UI render checks require frontend at baseURL)
npm run test:e2e

# run live login flow (requires frontend+backend+seeded users running)
# PowerShell:
$env:E2E_RUN_LIVE="1"; npm run test:e2e
```

Environment overrides: `E2E_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
