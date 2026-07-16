## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/bootstrap/startup.js` is the public app bootstrap seam, but it still mixes override resolution, DOM readiness helpers, input auto-select wiring, and dependency-wrapper construction in one file.
- Goal: extract local startup bootstrap support helpers so `initApp(...)` remains the public boot seam while the support concerns become easier to scan and test directly.
- Non-goals: do not redesign startup ordering, ready-state semantics, or boot the app through a different entrypoint.

## Scope Lock

- Summary: add a local bootstrap support helper for override resolution, DOM readiness, input auto-select, and startup dependency wiring; refactor `startup.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Runtime / Boot`.

## Files To Modify

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/startupSupport.js`
- `wedding-cep/cep/js/bootstrap/startupSupport.test.js`
- `.task_steps/c2_wedding_startup_bootstrap_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.test.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local bootstrap maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_startup_bootstrap_support_split_scope.md`

## Notes Before Execution

- Keep `startup.js` as the public app bootstrap seam.
- Keep the new helper local to `bootstrap/`.
- Preserve current `initApp(...)` behavior, app-ready state changes, and error handling.

## Implementation Note

- Added `startupSupport.js` as a local bootstrap helper for override resolution, DOM readiness, input auto-select wiring, document lookup, and startup dependency-wrapper construction.
- Refactored `startup.js` so `initApp(...)` stays the public app bootstrap seam while local dependency assembly now lives in `createStartupDeps(...)`.
- Added `startupSupport.test.js` as direct coverage for override precedence, DOM readiness waiting, input auto-select wiring, and the wrapper behavior of startup dependency resolution.

## Verification Gate

Claims Verified: `startup.js` remains the public bootstrap seam; local support now owns startup dependency assembly and small DOM helpers; and ready-state plus startup error handling behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_startup_bootstrap_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local bootstrap support; it does not redesign boot ordering, ready-state semantics, or downstream tab/controller orchestration.
Unverified But Suspected: if `Runtime / Boot` gets another cleanup pass soon, `startup.js` itself is now thin enough that `tabBoot.js` or another orchestration seam would be a better target than reopening the bootstrap support helper.
