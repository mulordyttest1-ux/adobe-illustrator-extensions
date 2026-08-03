# Symbol Config Refactor Tasks

- [x] Characterize the current 22-preset runtime contract.
- [x] Isolate legacy preset hydration behind `legacy_preset_adapter.js`.
- [x] Implement canonical draft model, serializer, migrator, and runtime adapter.
- [x] Add storage version 5 and mixed V4/V5 repository methods.
- [x] Add unknown-extension save rejection and repository coverage.
- [x] Add `ConfigDraftStore` and connect ConfigTab baseline/dirty state.
- [x] Add the nine-section registry with A/B/C ownership metadata.
- [x] Add canonical, migration, mixed-storage, and registry tests.
- [x] Remove remaining compatibility-only config persistence branches after all
  external callers are migrated.
- [x] Run final validation gates and record fresh evidence.

## Phase 2: Completion

- [x] T001 Add canonical-only persistence characterization coverage in `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.test.mjs`.
- [x] T002 Remove Config persistence fallback branches from `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.js`.
- [x] T003 Move save-directory patching to `getDraftById()`/`saveDraft()` only in `symbol-cep/cep/js/features/imposition/config_tab.js` and its tests.
- [x] T004 Extract standard/dense/compact control creation from `symbol-cep/cep/js/features/imposition/config_pane_renderer.js` into a context-injected adapter.
- [x] T005 Add control-adapter characterization tests under `symbol-cep/cep/js/features/imposition/`.
- [x] T006 Update `symbol-cep/ARCHITECTURE.md`, `symbol-cep/FEATURE_MAP.md`, `symbol-cep/PROJECT_STATUS.md`, and `REPO_FUNCTION_INVENTORY.md`.
- [ ] T007 Run encoding, Symbol lint/build/unit, and Illustrator 2026 smoke validation.
