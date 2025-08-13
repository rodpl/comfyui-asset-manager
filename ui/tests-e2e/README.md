# E2E tests with Playwright

These tests assume a manually started ComfyUI server is running at `http://localhost:8188` and that the Asset Manager extension is installed and built.

## Prerequisites

- Build the extension so ComfyUI can load it:

```bash
pnpm --filter ./ui build
```

- Ensure ComfyUI is running locally and serving at `http://localhost:8188` with the extension enabled.

## Install browsers

```bash
pnpm --filter ./ui e2e:install
```

## Run tests

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8188 pnpm --filter ./ui e2e
```

Optionally use the UI mode:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:8188 pnpm --filter ./ui e2e:ui
```

You can override the base URL:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8188 pnpm --filter ./ui e2e

## Patterns used

- PageObject pattern for page-level flows: see `tests-e2e/fixtures/pageObjects/*`.
- ComponentObject pattern for reusable UI components: see `tests-e2e/fixtures/components/*` (e.g., `SearchFilterBar.component.ts`, `NetworkStatus.component.ts`).

## Notes

- Tests do not start a dev server and expect the ComfyUI instance to be running already.
- HTML report is generated but not auto-opened. To open the last report:

```bash
pnpm exec playwright show-report
```
```


