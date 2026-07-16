## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/date-grid/DateGridWidget.js` is the public widget seam, but it still mixes controller fallback setup, event binding rules, checkbox base-key lookup, and dependent-row lock scheduling in one file.
- Goal: extract local widget support helpers so `DateGridWidget` stays the public instance seam while local event/lifecycle behavior becomes easier to scan and test directly.
- Non-goals: do not redesign the date-grid public API, change controller behavior, or alter dependent-row locking semantics.

## Scope Lock

- Summary: add a local date-grid widget support helper for controller fallback, widget event binding, checkbox base-key resolution, and dependent-row lock scheduling; refactor `DateGridWidget.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` `Date Intelligence`.

## Files To Modify

- `wedding-cep/cep/js/components/date-grid/DateGridWidget.js`
- `wedding-cep/cep/js/components/date-grid/dateGridWidgetSupport.js`
- `wedding-cep/cep/js/components/date-grid/dateGridWidgetSupport.test.js`
- `.task_steps/c2_wedding_date_grid_widget_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/date-grid/DateGridWidget.test.js`
- `wedding-cep/cep/js/components/compact-form/FormComponents.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local date-grid maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_date_grid_widget_support_split_scope.md`

## Notes Before Execution

- Keep `DateGridWidget.js` as the public instance-owned widget seam.
- Keep the new helper local to `components/date-grid/`.
- Preserve current event binding behavior, controller fallback warning, and dependent-row lock scheduling.

## Implementation Note

- Added `dateGridWidgetSupport.js` as a local widget helper for controller fallback, widget event binding, checkbox base-key resolution, and dependent-row lock scheduling.
- Refactored `DateGridWidget.js` so the public instance seam now delegates local event/lifecycle mechanics to the support helper while preserving the dynamic controller lookup behavior after `setChangeHandler(...)`.
- Added `dateGridWidgetSupport.test.js` as direct coverage for fallback controller creation, event binding against the latest controller, checkbox base-key resolution, and dependent-row lock scheduling.

## Verification Gate

Claims Verified: `DateGridWidget.js` remains the public instance-owned widget seam; local support now owns widget event/lifecycle mechanics; and controller fallback plus dependent-row lock behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_date_grid_widget_support_split_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local widget support; it does not redesign date-grid public APIs, change controller behavior, or alter DOM/render contracts.
Unverified But Suspected: if `Date Intelligence` gets another cleanup pass soon, `DateGridWidget` is now thin enough that another target outside the widget seam would likely be higher-value than reopening its local event support.
