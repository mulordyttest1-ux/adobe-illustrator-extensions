## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Split `ValidationReportWidget` into internal helper modules so the public postflight widget facade stays stable while the render/chrome/grouping internals become easier to read and extend.
- Execution mode: Focused internal refactor inside `wedding-cep/components/postflight` plus one small architecture note; no postflight behavior change.

## Files To Modify

- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetDom.js`
- `wedding-cep/cep/js/components/postflight/widgetChrome.js`
- `wedding-cep/cep/js/components/postflight/widgetGrouping.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/ARCHITECTURE.md`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`

## Cross-App Impact

- None. `symbol-cep` postflight hooks stay untouched.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_widget_split_scope.md`

## Notes Before Execution

- Keep `ValidationReportWidget.show(...)` and `ValidationReportWidget.close(...)` as the only public UI entrypoints.
- Keep floating widget UX, action button behavior, grouped details, technical disclosure, focus management, and success auto-close unchanged.
- Do not move business logic out of `PostflightValidator` or orchestration out of `PostflightAction`.

## Review Gate

Scope Reviewed: `ValidationReportWidget` public facade, the new internal widget helpers, and the unchanged `PostflightAction -> ValidationReportWidget` consumer boundary.
Top Risks: leaking UI logic back into the facade, changing button/focus/disclosure behavior during the split, or creating an internal helper contract that action/logic layers start importing directly.
Required Fixes: none after implementation; the facade landed at 43 lines and the existing integration tests covered the preserved behavior without extra helper-level churn.
No Blocking Findings: yes; self-review found no blockers after the split and boundary remained presentation-only.
Validation Rerun Needed: yes; reran `test:wedding`, `lint:wedding`, `build:wedding`, `test:smoke:wedding`, and `verify` on the final structure.

## Verification Gate

Claims Verified: `ValidationReportWidget` is now a thin public facade, internal render/chrome/grouping/DOM helpers are split into local modules, the postflight UX remains unchanged, and action/validator did not absorb UI logic.
Evidence Run: `npm run test:wedding`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: there is no separate unit test for the new helper files by design; the public widget integration test remains the contract lock for this internal refactor.
Unverified But Suspected: none.
