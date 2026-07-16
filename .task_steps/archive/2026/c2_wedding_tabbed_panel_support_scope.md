## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `wedding-cep/cep/js/components/TabbedPanel.js` is the public tab navigation seam, but it still mixes DOM discovery, click binding, active-state syncing, and load-context resolution in one file.
- Goal: extract local tabbed-panel support helpers so `TabbedPanel.js` remains the public navigation seam while the DOM/query/sync mechanics become easier to scan and test directly.
- Non-goals: do not redesign tab behavior, change lazy-load semantics, or alter the current loading/error rendering copy.

## Scope Lock

- Summary: add a local tabbed-panel support helper for DOM discovery, tab click binding, active-state sync, and load-context resolution; refactor `TabbedPanel.js` to use it; and add direct tests for the support seam.
- Execution mode: single-writer local refactor in `wedding-cep` UI runtime.

## Files To Modify

- `wedding-cep/cep/js/components/TabbedPanel.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.test.js`
- `.task_steps/c2_wedding_tabbed_panel_support_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/components/TabbedPanel.test.js`
- `wedding-cep/cep/js/bootstrap/tabBoot.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local tab navigation maintenance.

## Validation Targets

- `npm.cmd run lint:wedding`
- `npm.cmd run build:wedding`
- `npm.cmd run test:wedding`
- `npm.cmd run test:smoke:wedding`
- `npm.cmd run check:gates -- --file .task_steps/c2_wedding_tabbed_panel_support_scope.md`

## Notes Before Execution

- Keep `TabbedPanel.js` as the public tab navigation seam.
- Keep the new helper local to `components/`.
- Preserve current lazy-load/reload behavior and existing loading/error render output.

## Implementation Note

- Added `tabbedPanelSupport.js` as a local tabbed-panel helper for DOM discovery, tab click binding, active-state sync, and load-context resolution.
- Refactored `TabbedPanel.js` so the public tab navigation seam now delegates DOM/query/sync mechanics to the support helper while preserving the same lazy-load, reload, and loading/error rendering behavior.
- Added `tabbedPanelSupport.test.js` as direct coverage for DOM resolution, click binding, active-state sync, and safe warning behavior when controller or content load context is missing.

## Verification Gate

Claims Verified: `TabbedPanel.js` remains the public tab navigation seam; local support now owns DOM discovery, click binding, active-state sync, and load-context resolution; and lazy-load/reload plus loading/error rendering behavior stay unchanged.
Evidence Run: `npm.cmd run lint:wedding`; `npm.cmd run build:wedding`; `npm.cmd run test:wedding`; `npm.cmd run test:smoke:wedding`; `npm.cmd run check:gates -- --file .task_steps/c2_wedding_tabbed_panel_support_scope.md`; `npm.cmd run verify`.
Remaining Limits: this round only extracts local tabbed-panel support and adds direct tests; it does not redesign tab behavior, change lazy-load semantics, or alter the existing loading/error rendering copy.
Unverified But Suspected: after this helper split, `TabbedPanel.js` should no longer be the highest-value target inside the components slice; a different orchestration seam will likely be a better next cleanup candidate.
