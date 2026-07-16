## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/bootstrap/startupResources.js` is the small but central startup resource pipeline for calendar, bridge ping, autocomplete, and schema loading, and it still inlines phase updates plus best-effort bridge handling in one file.
- Goal: extract local startup-resource support helpers so the startup pipeline reads as a clearer sequence while preserving current boot behavior and ready-state phases.
- Non-goals: do not redesign startup ordering, change ready-state semantics, or modify CEP host/resource paths.

## Scope Lock

- Summary: add a local startup support helper for phase execution, best-effort bridge ping, and autocomplete resource loading; refactor `startupResources.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Runtime / Boot`.

## Files To Modify

- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/bootstrap/startupResourceSupport.js`
- `wedding-cep/cep/js/bootstrap/startupResourceSupport.test.js`
- `.task_steps/c2_wedding_startup_resources_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/startupResources.test.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local startup maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_startup_resources_support_split_scope.md`

## Notes Before Execution

- Keep `startupResources.js` as the public startup resource pipeline.
- Keep the new helper local to `bootstrap/`.
- Preserve phase order: `calendar -> bridge -> autocomplete -> schema`.
- Preserve best-effort bridge ping and current schema failure behavior.

## Implementation Note

- Added `startupResourceSupport.js` as a local bootstrap helper for phase execution, best-effort bridge ping, and grouped autocomplete-resource loading.
- Refactored `startupResources.js` so the public startup resource pipeline now reads as explicit phase sequencing while preserving the same host/resource calls and ready-state transitions.
- Added `startupResourceSupport.test.js` as direct coverage for startup phase updates, best-effort bridge handling, and shared-host loading of autocomplete resources.

## Verification Gate

Claims Verified: `startupResources.js` remains the public startup resource pipeline; local startup support now owns phase sequencing and best-effort bridge behavior; and startup phase order plus schema failure behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_startup_resources_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local startup support; it does not redesign startup ordering, ready-state semantics, or downstream controller boot.
Unverified But Suspected: if `Runtime / Boot` gets another cleanup pass soon, `startup.js` or `tabBoot.js` is now a more meaningful orchestration target than reopening `startupResources`, because the resource phase pipeline is already thin and directly covered.
