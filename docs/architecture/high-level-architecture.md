# High Level Architecture

## Technical Summary
- Python backend implements a hexagonal (ports-and-adapters) architecture hosted inside ComfyUI’s `aiohttp` server.
- React + TypeScript frontend is bundled with Vite and served as static assets through ComfyUI.
- Outputs management is fully wired end-to-end (filesystem scan, workflow metadata, REST API, React UI).
- Local Assets and Model Browser features have UI and partial backend plumbing but will ship later; tabs need gating for the initial release.
- Extensive unit/integration tests exist for both backend and frontend, plus Playwright E2E coverage.
- Upcoming Outputs-first release scope leans on existing logging (no new telemetry) and targets typical ComfyUI workloads; feature gating temporarily hides unfinished tabs while preserving future work.

## Actual Tech Stack (from package.json/requirements.txt)
| Category          | Technology                    | Version      | Notes                                                             |
| ----------------- | ----------------------------- | ------------ | ----------------------------------------------------------------- |
| Backend Runtime    | Python                        | ≥3.12        | Managed via Poetry                                               |
| Web Framework      | aiohttp                       | 3.12.14      | Powers REST API within ComfyUI `PromptServer`                    |
| Imaging/IO         | Pillow                        | 11.0.0       | Thumbnail extraction, metadata parsing                           |
| Frontend Runtime   | Node.js                       | ≥18 (README) | pnpm used for dependency management                              |
| Frontend Framework | React                         | 18.2.0       | TypeScript SPA served by ComfyUI                                 |
| Build Tool         | Vite                          | 7.0.3        | Outputs to `dist/asset_manager`                                   |
| Language           | TypeScript                    | 5.8.3        | Strict typing across UI                                          |
| Testing (frontend) | Vitest, Testing Library       | 3.2.4        | Component and hook coverage                                      |
| Testing (frontend) | Playwright                    | 1.47.2       | E2E specs in `ui/tests-e2e`                                      |
| Testing (backend)  | pytest, pytest-asyncio, cov   | 8.2 / 0.23   | 70% minimum coverage enforced via `--cov-fail-under=70`          |
| Package Manager    | pnpm                          | lockfile     | Vite build and tests                                             |

## Repository Structure Reality Check
- Type: Monorepo containing Python backend and React frontend.
- Package Managers: Poetry for Python, pnpm for frontend.
- Notable Decisions: Hexagonal architecture with explicit ports/adapters; frontend organised by feature folders; `.kiro/steering` supplies standards for AI agents.
