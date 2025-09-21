# Technical Debt and Known Issues

## Critical Technical Debt
1. **UI Release Gating**: Local Assets and Model Browser tabs are visible despite incomplete backend wiring; need feature flags or conditional rendering before release.
2. **Cache Invalidation**: `FileSystemModelAdapter` and `OutputService` rely on TTL without filesystem notifications; external file changes require manual refresh.
3. **Documentation Drift**: `docs/development/current-implementation-status.md` still marks driving adapters as “not implemented”, which can mislead contributors.
4. **External API Robustness**: Proxy endpoints lack authentication/throttling safeguards; heavy usage could trigger rate limits or shape changes without resilience.
5. **Version Surfacing**: TODO in `docs/development/TODO.md` to expose extension version in `ui/src/main.tsx` badges remains unresolved.
6. **Spec Backlog Tracking**: Outstanding polish/performance work listed in `.kiro/specs/local-asset-management` (tasks #20–25), `.kiro/specs/simplified-model-browser` (task #11), and `.kiro/specs/simplified-output-gallery` (tasks #7–8) must remain visible when tabs are gated so future releases can complete them.

## Workarounds and Gotchas
- **ComfyUI Path Discovery**: `ComfyUIOutputAdapter` walks filesystem heuristics; ensure tests cover expected install paths or override via constructor.
- **Theme Flash Prevention**: `preventInitialTransitionFlash` must run before UI paints; missing call leads to flicker.
- **Workflow Metadata**: Some outputs may lack JSON sidecars; UI and API must handle missing workflow data gracefully (currently returns failure message).
- **Clipboard Fallbacks**: When ComfyUI APIs unavailable (tests), UI copies file paths instead of injecting nodes—keep this behaviour in mind for UX.
