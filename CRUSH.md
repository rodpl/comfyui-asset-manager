# CRUSH.md

## Commands

**Python Backend (Poetry):**
- Install: `poetry install`
- Lint: `poetry run ruff check src/ tests/`
- Lint Fix: `poetry run ruff check --fix src/ tests/`
- Test: `poetry run pytest tests/`
- Single Test: `poetry run pytest tests/path/to/test_file.py::test_function`
- Run: `poetry run python src/main.py`

**React Frontend:**
- Install: `cd ui && npm install`
- Dev: `cd ui && npm run dev`
- Build: `cd ui && npm run build`
- Lint: `cd ui && npm run lint`
- Lint Fix: `cd ui && npm run lint:fix`
- Typecheck: `cd ui && npm run typecheck`
- Test: `cd ui && npm run test`
- Single Test: `cd ui && npm run test path/to/test_file.tsx`
- E2E: `cd ui && npm run e2e`
- E2E Single: `cd ui && npx playwright test tests-e2e/specific.spec.ts`

**GitHub Workflows:**
- Python CI: `.github/workflows/python-ci.yml` (runs on push/PR)
- React CI: `.github/workflows/react-ci.yml`
- React Build: `.github/workflows/react-build.yml`

## Code Style

**Python (src/, tests/):**
- Linting: Ruff (ruff.toml if present)
- Imports: Absolute from `src/` (e.g., `from src.domain.services import ...`)
- Formatting: Black (line length 88)
- Types: Full type hints required; use `typing` or `from __future__ import annotations`
- Naming: snake_case; classes PascalCase; constants UPPER_CASE
- Error Handling: Use custom exceptions from `src.domain.exceptions`; log with `src.utils.logger`
- Testing: pytest; 70%+ coverage; unit/integration markers

**TypeScript/React (ui/src/):**
- Linting: ESLint (eslint.config.js); Prettier integration
- Imports: Sorted with `@trivago/prettier-plugin-sort-imports`:
  1. `@core/*`
  2. Third-party (e.g., `react`, `i18next`)
  3. `@/*` (aliases)
  4. Relative `./`
- Formatting: Prettier (semi: true, singleQuote: true, trailingComma: 'es5', printWidth: 100, tabWidth: 2)
- Types: Strict TS (tsconfig.json); no `any`; use interfaces/types from `ui/src/types/`
- Naming: camelCase vars/functions; PascalCase components; descriptive (e.g., `useComfyUITheme`)
- Error Handling: Try/catch with logging; use `ErrorBoundary` component; show user-friendly messages
- Testing: Vitest for unit (`npm test`); Playwright for E2E (`npm run e2e`); 80%+ coverage
- Hooks: Custom hooks in `ui/src/hooks/`; follow React rules (eslint-plugin-react-hooks)

**General:**
- Hexagonal Architecture: Adapters (driven/driving), domain (entities/services/ports), use DI in `src/container.py`
- ComfyUI Integration: Follow `ui/src/services/comfyuiIntegration.ts` patterns; types in `ui/src/types/comfyui.ts`
- Cursor Rules: Use BMAD agents (@dev, @qa, etc.) from `.cursor/rules/bmad/` for workflows; Playwright MCP auto-restart allowed
- No secrets in code; use env vars; commit messages: "feat/fix: description"