# C2: Symbol Stable-Core OCP Hardening Scope

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Harden `symbol-cep` around explicit Open/Closed seams by moving boot wiring into registries, inverting feature coordinators onto injected repositories and gateways, decomposing preset persistence behind a facade, replacing Wedding Suite runtime patching with named host endpoints, and adding regression guards so new features can extend stable core contracts without editing them directly.
- Execution mode: Milestone-sized `/build` refactor inside `symbol-cep` panel + host boundaries, with no intended operator UX redesign.

## Files To Modify

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/runtime/appBoot.js`
- `symbol-cep/cep/js/features/runtime/ruleRegistry.js`
- `symbol-cep/cep/js/features/runtime/tabRegistry.js`
- `symbol-cep/cep/js/features/runtime/debugSurface.js`
- `symbol-cep/cep/js/features/runtime/appBoot.test.mjs`
- `symbol-cep/cep/js/features/runtime/architectureGuard.test.mjs`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/action_tab.test.mjs`
- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_tab.test.mjs`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/data_store.js`
- `symbol-cep/cep/js/features/imposition/preset_repository.js`
- `symbol-cep/cep/js/features/imposition/impositionHostGateway.js`
- `symbol-cep/cep/js/features/imposition/schema_editor.js`
- `symbol-cep/cep/js/features/imposition/schema_mutation_service.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.test.mjs`
- `symbol-cep/cep/js/features/imposition/preset-config/configPersistenceService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configEventService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configSchemaEditService.js`
- `symbol-cep/cep/js/features/imposition/preset-config/configTabStateService.js`
- `symbol-cep/cep/js/features/imposition/storage/CepPresetRepository.js`
- `symbol-cep/cep/js/features/imposition/storage/CepStorageEnvironment.js`
- `symbol-cep/cep/js/features/imposition/storage/LastActiveStore.js`
- `symbol-cep/cep/js/features/imposition/storage/PresetFileStore.js`
- `symbol-cep/cep/js/features/imposition/storage/StorageHealthService.js`
- `symbol-cep/cep/js/features/imposition/storage/UsageMetadataStore.js`
- `symbol-cep/cep/js/features/imposition/storage/storageHelpers.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/preferencesStore.js`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/imposition_run_service.js`
- `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None intended. The refactor stayed app-local to `symbol-cep` and did not modify `libs/shared` or `wedding-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`

## Notes Before Execution

- `app.js` was still the knowledge hub for every tab and every rule, so adding runtime surfaces required editing stable core instead of extending descriptors.
- `ActionTab`, `ConfigTab`, and `WeddingSuiteTab` still knew too much about concrete infrastructure such as `dataStore`, `localStorage`, or raw bridge transport.
- `data_store.js` still mixed preset payload IO, usage sidecar handling, storage health probing, and last-active persistence in one concrete service.
- Wedding Suite still crossed the boundary through runtime patching/string policy blobs instead of explicit host endpoints, which made extension fragile and hard to reason about.

## Review Gate

Scope Reviewed: boot/runtime registries, repository/gateway inversion, persistence decomposition, schema mutation seam, and Wedding Suite host boundary cleanup.
Top Risks: boot wiring could silently stop mounting tabs if registry assembly drifted; postflight could appear wired while still relying on stale bridge-only context; Wedding Suite could regress dirty-output guard or review-state behavior while removing runtime patching.
Required Fixes: move tab/rule assembly behind registries; make coordinators consume injected seams instead of raw infrastructure; preserve backward-compatible `data_store` facade; replace Wedding Suite monkey-patching with named endpoints; fix the postflight success path so `hostGateway` actually reaches the orchestrator; stabilize the dirty-open-output warning at the panel boundary so runtime smoke does not depend on mojibake-prone host strings.
No Blocking Findings: yes
Validation Rerun Needed: yes

## Verification Gate

Claims Verified: yes
- `symbol-cep` now boots through a runtime slice with registries and thin `app.js` composition.
- Feature coordinators now depend on injected repositories/gateways/preferences seams instead of direct raw infrastructure imports.
- Preset persistence is decomposed behind a public repository facade, while legacy callers still retain compatibility through `data_store.js`.
- Wedding Suite no longer patches live host runtime functions from panel JS; it calls explicit named host endpoints and the host owns open/close/review state for output files.
- Runtime smoke is green after the final integration fixes, including postflight host-gateway wiring and the unsaved-open-output guard.

Evidence Run: yes
- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`

Remaining Limits: yes
- Architecture guardrails are currently enforced by focused tests rather than custom ESLint import-restriction rules, so the seam is protected but not yet lint-enforced repo-wide.
- Wedding Suite remains in AI-first debug output mode from prior workflow decisions; this refactor did not attempt to revert it to PDF-only delivery.

Unverified But Suspected: no
