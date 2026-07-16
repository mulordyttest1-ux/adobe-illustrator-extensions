# C2: Symbol Preset Config V2 Persistence Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Open the first `Preset / Config V2` slice by moving save/load/dry-run workflow behind a named `preset-config` service while keeping `config_persistence.js` as the stable facade for `config_events.js`.
- Execution mode: focused runtime refactor inside `symbol-cep` config persistence workflow only

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/config_events.js`

## Cross-App Impact

- None. This round stays inside `symbol-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_config_v2_persistence_service_scope.md`

## Notes Before Execution

- Keep the public `ConfigPersistence` method signatures stable for `config_events.js`.
- Do not widen this round into `config_pane_renderer.js`, `config_tab.js`, host/bridge code, or storage format changes.
- This round is valid only if it creates a named service seam for operator-facing persistence workflow rather than a cosmetic wrapper.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Preset / Config V2` persistence workflow only, centered on moving save/load/dry-run orchestration behind `preset-config/configPersistenceService.js` while keeping `config_persistence.js` as the stable facade imported by `config_events.js`.
Top Risks: the service move could silently change preset save/update behavior, tab state rehydration, or dry-run preset shaping; breaking `ConfigPersistence` method signatures would disconnect the config tab event shell from its workflow entrypoint.
Required Fixes: keep `ConfigPersistence.loadPreset(...)`, `handleSave(...)`, and `handleDryRun(...)` signatures stable; keep storage format and `data_store.js` contracts unchanged; add direct service tests for load, save, and dry-run paths.
No Blocking Findings: Yes. This round opens a real `Preset / Config V2` seam without widening into renderer, host, or storage-format work.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `config_persistence.js` now acts as a thin facade over a named `preset-config` service; load/save/dry-run workflow lives in `preset-config/configPersistenceService.js`; `config_events.js` keeps using the same public facade; direct tests now cover the new service seam; symbol lint, build, focused tests, smoke, and repo verify all stay green.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: `config_tab.js` still owns shell rendering and state capture directly; pane layout/render policy is still separate from this persistence slice; no route-doc updates were made in this runtime round.
Unverified But Suspected: none
