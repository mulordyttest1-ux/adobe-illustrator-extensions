# C2: Wedding Postflight Select Frame Feedback Fix Scope

## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix the postflight `Chon frame` action so click results are no longer silent when frame selection fails or resolves to zero matches.
- Execution mode: Focused app-local `/fix` in `wedding-cep` postflight widget and tests only.

## Files To Modify

- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`
- `wedding-cep/cep/jsx/illustrator.jsx`

## Cross-App Impact

- None expected. The host bridge contract stays unchanged; this fix only makes the widget handle select-frame outcomes explicitly.

## Validation Targets

- `node --test wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js wedding-cep/cep/js/actions/PostflightAction.test.js`
- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_select_frame_feedback_fix_scope.md`

## Notes Before Execution

- Root symptom: click path currently fires `bridge.selectFramesById()` without awaiting or surfacing failure/no-op, so host-side `selected: 0` looks like a dead button.
- Focused repair: keep existing host behavior stable and add clear UI feedback in the postflight widget for success, no-op, and error outcomes.

## Review Gate

Scope Reviewed: `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`, `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`, `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`, and the immediate `bridge.selectFramesById()` result contract (`success`, `selected`, `error`).
Top Risks: host no-op results (`success: true`, `selected: 0`) still looking like a dead button; async click handling swallowing bridge failures or regressing the happy-path selection flow; headless tests accidentally touching the real `UIFeedback` DOM path.
Required Fixes: await the select-frame bridge result and surface explicit success, warning, or error toast feedback; thread an injectable `showToast` seam through the widget facade so tests stay DOM-lite; extend widget coverage for no-op, reject, and missing-bridge cases.
No Blocking Findings: none after focused review of the widget/action path and its immediate bridge contract.
Validation Rerun Needed: yes; reran `npm run lint:wedding`, `npm run build:wedding`, `npm run test:wedding`, and `npm run test:smoke:wedding` on the final state.

## Verification Gate

Claims Verified: postflight `Chon frame` is no longer silent on success, no-op, or bridge error paths; happy-path selection still narrows the Illustrator selection to the target frame in live smoke coverage; widget tests cover success, zero-match warning, rejected bridge call, and missing-bridge safety.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding` (first attempt hit transient `Execution context was destroyed`; immediate rerun passed 23/23 on the same code state).
Remaining Limits: host-side selection still only resolves frames from the current selection set, so a missing target now reports a warning instead of searching the whole document.
Unverified But Suspected: if product intent is to select a frame outside the current selection, that requires a separate host/bridge change rather than this widget feedback fix.
