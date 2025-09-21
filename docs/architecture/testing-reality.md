# Testing Reality

## Current Test Coverage
- **Backend**: pytest suites across domain, adapters, integration (`tests/`); coverage gate set to 70% minimum with HTML reports (`htmlcov/`).
- **Frontend**: Vitest component/unit tests in `ui/src/**/__tests__`; Theme/system integrations covered.
- **E2E**: Playwright specs in `ui/tests-e2e` validate tabs, outputs workflow, and integration touchpoints.

## Running Tests
```bash
# Backend
poetry run pytest                          # full suite with coverage
poetry run pytest tests/domain/services    # focused domain tests

# Frontend unit/integration
cd ui
pnpm run test                              # Vitest run

# Frontend E2E (Playwright)
PLAYWRIGHT_BASE_URL=http://localhost:8188 pnpm --filter ./ui e2e
```
