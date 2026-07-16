# C2: Symbol Preset Config V2 Schema Edit Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Preset / Config V2` by moving config-tab schema-edit workflow behind a named `preset-config` service while keeping `ConfigTab` public methods stable for renderer callers.
- Execution mode: focused runtime refactor inside `symbol-cep` config schema-edit workflow only

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configSchemaEditService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configSchemaEditService.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. This round stays inside `symbol-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_config_v2_schema_edit_service_scope.md`

## Notes Before Execution

- Keep `ConfigTab.requestRemoveField(...)`, `requestRemoveRow(...)`, `handleModalConfirm()`, and `openAddFieldModal(...)` stable for renderer callers.
- Do not widen this round into `config_pane_renderer.js`, host/bridge code, or storage format changes.
- This round is valid only if it creates a testable schema-edit workflow seam rather than another generic helper.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Preset / Config V2` schema-edit workflow only, centered on moving add/remove field-row and modal-confirm workflow behind `preset-config/configSchemaEditService.js` while keeping `ConfigTab` public methods stable for renderer callers.
Top Risks: the service move could silently break edit-mode field removal, row removal, or modal add-field workflow; changing the public `ConfigTab` methods would break `config_pane_renderer.js` even if direct service tests passed.
Required Fixes: keep `ConfigTab.requestRemoveField(...)`, `requestRemoveRow(...)`, `handleModalConfirm()`, and `openAddFieldModal(...)` stable; keep schema mutations delegated through `ConfigEngine`; add direct tests for remove field, remove row, modal confirm, and modal open flow.
No Blocking Findings: Yes. This round opens a real schema-edit workflow seam inside the same `Preset / Config V2` island without widening into renderer internals or host code.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `ConfigTab` now delegates schema-edit workflow to `preset-config/configSchemaEditService.js`; renderer-facing `ConfigTab` methods stayed stable; direct tests cover remove field, remove row, modal confirm, and modal open behavior; symbol lint, build, focused tests, smoke, and repo verify all remain green.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: `config_pane_renderer.js` still owns the larger pane layout/render mechanics; `ConfigTab` still owns shell markup and top-level composition; route docs were not updated in this runtime round.
Unverified But Suspected: none
