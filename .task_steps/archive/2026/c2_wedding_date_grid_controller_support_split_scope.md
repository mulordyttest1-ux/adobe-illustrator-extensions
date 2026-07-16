## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/date-grid/DateGridController.js` is the main orchestration seam for the date-grid widget, but it still mixes controller orchestration with local support rules for dependent-row gating, offset mapping, date-row constants, and time-style application.
- Goal: split those controller-local support mechanics into a helper while keeping `DateGridController` as the public orchestration seam and preserving current date-grid behavior.
- Non-goals: do not redesign `DateGridWidget`, change date-grid UX, or move controller logic into shared/domain code.

## Scope Lock

- Summary: add a controller-local helper for dependent-row gating, offset mapping, row constants, and time-style application; refactor `DateGridController.js` to delegate to it; and add focused helper coverage.
- Execution mode: single-writer local refactor in `wedding-cep` `Date Intelligence`.

## Files To Modify

- `wedding-cep/cep/js/components/date-grid/DateGridController.js`
- `wedding-cep/cep/js/components/date-grid/dateGridControllerSupport.js`
- `wedding-cep/cep/js/components/date-grid/dateGridControllerSupport.test.js`
- `.task_steps/c2_wedding_date_grid_controller_support_split_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/date-grid/DateGridWidget.js`
- `wedding-cep/cep/js/components/date-grid/DateGridController.test.js`
- `wedding-cep/cep/js/components/date-grid/DateGridDOM.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local date-grid maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_date_grid_controller_support_split_scope.md`

## Notes Before Execution

- Keep `DateGridController` as the public controller seam.
- Keep the new helper internal to the date-grid slice.
- Preserve current dependent-row sync, time-style, and trigger-compute behavior.

## Implementation Note

- Added `dateGridControllerSupport.js` as a controller-local helper for dependent-row target selection, offset mapping, stable row keys, master-input sync gating, and time-style application.
- Refactored `DateGridController.js` so the public controller seam keeps orchestration responsibilities while delegating those local support mechanics to the helper.
- Added `dateGridControllerSupport.test.js` to lock the new helper behavior directly, while keeping `DateGridController.test.js` as the integration guard for blur handling, dependent sync, and trigger-compute orchestration.

## Verification Gate

Claims Verified: `DateGridController` remains the public date-grid orchestration seam; controller-local support mechanics now live in a helper; and dependent-row offsets, time-style skip behavior, and trigger-compute row coverage remain unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_date_grid_controller_support_split_scope.md`.
Remaining Limits: this round only splits controller-local support logic; it does not refactor `DateGridWidget` wiring or widen into shared/domain date behavior.
Unverified But Suspected: if another `Date Intelligence` cleanup lands soon, `DateGridRenderer.js` or `DateGridWidget.js` will be a better next target than re-opening the controller, because controller orchestration is now materially thinner.
