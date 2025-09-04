# Testing Map (Specs → Tests)

This document maps feature requirements (from `.kiro/specs`) to existing tests (backend + frontend), and lists gaps for future coverage.

## 1) Simplified Output Gallery

Spec: `.kiro/specs/simplified-output-gallery/design.md`

Covered by:
- Backend
  - Integration: `tests/integration/test_output_api_endpoints.py` — GET `/outputs`, details, load-workflow, system ops (open/show). Verifies PNG metadata extraction and API wiring.
  - Services: `tests/domain/services/test_output_service.py` and `.../test_output_service_sorting_filtering.py` — enrich, sort, filter, cache behavior.
  - Adapters: `tests/adapters/driven/test_filesystem_output_adapter.py` (scan, thumbnails, error handling) and `test_comfyui_output_adapter.py` (workflow metadata extraction, prompting/load heuristics).
- Frontend (UI)
  - `ui/src/features/outputs/__tests__/OutputsTab.test.tsx` — loading states, toolbar controls (view/sort/refresh), gallery render, modal open/close, a11y roles.
  - `ui/src/features/outputs/__tests__/OutputModal.test.tsx` — modal behavior, navigation between outputs, load‑workflow confirmation & feedback (covers presence of metadata prompts and graph application attempts).
  - `ui/src/features/outputs/__tests__/OutputContextMenu.test.tsx` — context menu positioning, keyboard navigation, system actions (open/show/copy path).

Gaps / Ideas:
- E2E: happy-path against running ComfyUI (Playwright) for Outputs, including load‑workflow success/failure visuals.
- Negative tests for corrupted metadata in UI layer (strings vs objects) beyond backend coverage.

## 2) ComfyUI Theme Integration

Spec: `.kiro/specs/comfyui-theme-integration/requirements.md`

Covered by:
- Frontend code & demos:
  - `ui/src/hooks/useComfyUITheme.ts` — detection + transition management.
  - Demos: `ui/test-theme-variables.html`, `ui/validate-theme-system.html` for visual validation.
- Unit tests: focused tests around theme hook aren’t present; theme variables are validated indirectly by component rendering.

Gaps / Ideas:
- Add unit tests for `useComfyUITheme` (light/dark, transition, performance-mode class behavior).
- Visual regression (Playwright) to validate CSS variable inheritance in both themes.

## 3) Local Asset Management

Spec: `.kiro/specs/local-asset-management/requirements.md`

Covered by:
- Backend
  - Adapters: `tests/adapters/driven/test_filesystem_model_adapter.py`, `test_comfyui_folder_adapter.py` — folder discovery and model enumeration.
  - Driving adapter: `tests/adapters/driving/test_web_api_adapter_metadata.py` — model metadata update (single/bulk), tags, validation & error mapping.
  - Ports: `tests/domain/ports/test_driving_ports.py` — port compliance for model/folder use cases.
- Frontend (UI)
  - `ui/src/features/local-assets/components/__tests__/ModelGrid.test.tsx` — rendering, keyboard navigation, roles.
  - `ui/src/features/local-assets/components/__tests__/ModelDetailModal.test.tsx` — tabs (details/metadata/usage), switching; metadata presence.
  - `ui/src/features/local-assets/components/__tests__/SearchFilterBar.test.tsx` — filtering/search interactions.

Gaps / Ideas:
- E2E: select folder → list models → open details → edit metadata → verify via API.
- Drag‑and‑drop to ComfyUI graph (future): add tests when implemented.

## 4) Simplified Model Browser

Spec: `.kiro/specs/simplified-model-browser/requirements.md`

Covered by:
- Backend
  - External model endpoints & proxies tested indirectly via adapters: `tests/adapters/driven/test_civitai_external_model_adapter.py`, `.../test_huggingface_external_model_adapter.py`.
- Frontend (UI)
  - `ui/src/features/model-browser/services/__tests__/huggingfaceService.test.ts` — normalization, tags/description behavior, name extraction, filters.
  - Component tests (ModelCard/Modal) present; cover details rendering and tab switch behavior.

Gaps / Ideas:
- Add tests for CORS proxy fallbacks (frontend) when direct platform calls fail.
- E2E: switch platform tabs, search/filter, open details.

## 5) Cross‑Cutting

- Notification integration with ComfyUI:
  - `ui/src/services/__tests__/notificationService.test.ts` and `notificationIntegration.test.ts` — capability detection and fallbacks via ExtensionManager/UI dialog/native toast.
- Application setup & DI:
  - `tests/integration/test_application_setup.py` — container wiring, web adapter creation.

## Test Debt Summary
- Add dedicated unit tests for `useComfyUITheme` behavior.
- Add feature‑flag UI tests once the REST config is introduced.
- Expand Playwright E2E for Outputs and Local Assets happy paths.

