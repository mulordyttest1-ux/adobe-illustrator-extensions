## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: The postflight report currently collapses every global finding into one generic `Toàn cục` section, which hides the distinction between global errors and global warnings even though the validator already emits real severities.
- Goal: Keep the same `wedding-cep/Postflight` detection logic, but present global findings by severity so operators can scan risk faster and the Milestone 1 pilot proves agents can route to the correct UI/report seam.
- Non-goals: Do not reclassify findings, change rule ordering, alter postflight action behavior, or generalize anything into cross-app shared code.

## Scope Lock

- Summary: Run Milestone 1 of the continuation protocol by improving the `wedding-cep` postflight report UI so global findings are split by severity instead of being collapsed into one generic `Toàn cục` section.
- Execution mode: Focused `wedding-cep/Postflight` presentation change only; keep validator rule semantics, action orchestration, and cross-app taxonomy unchanged.

## Files To Modify

- `wedding-cep/cep/js/components/postflight/widgetGrouping.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`

## Consumers Verified

- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`

## Cross-App Impact

- None. `symbol-cep` `postflight/hooks` remains untouched.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_global_severity_pilot_scope.md`

## Notes Before Execution

- Treat this as a `T1` single-app, single-context pilot task under the operating model baseline.
- Do not reclassify findings or change rule outputs; only present existing severities more clearly inside the report widget.
- Keep `ValidationReportWidget.show(...)` and `ValidationReportWidget.close(...)` stable.
- Keep action-button behavior, grouped details, technical disclosure, focus management, and success auto-close unchanged.

## Implementation Note

- Updated `widgetGrouping.js` so `groupIssues(report)` now separates global findings into `errors`, `warnings`, and `infos` buckets while leaving frame-level grouping unchanged.
- Updated `widgetIssueRendering.js` so the widget renders dedicated sections for `Toàn cục - Lỗi`, `Toàn cục - Cảnh báo`, and `Toàn cục - Thông tin`, while preserving the existing frame-level `Lỗi` and `Cảnh báo` sections.
- Expanded the widget integration test to assert that a mixed global payload renders split severity sections and still exposes action buttons only for frame-level actionable findings.

## Review Gate

Scope Reviewed: `wedding-cep` postflight presentation only, limited to `widgetGrouping.js`, `widgetIssueRendering.js`, and the public widget integration test.
Top Risks: accidentally changing finding semantics instead of presentation, breaking the `Chọn frame` action path, or leaving global `info` items merged into warnings.
Required Fixes: none after implementation; the patch stayed inside the widget slice and did not pull validator or action logic into the change.
No Blocking Findings: yes; self-review found no boundary violations or behavior drift outside section rendering.
Validation Rerun Needed: yes; reran `test:wedding`, `lint:wedding`, `build:wedding`, `test:smoke:wedding`, and `verify` on the final patch.

## Verification Gate

Claims Verified: global postflight findings now render in separate severity sections, frame-level findings keep their existing sections and action buttons, and the pilot remained inside the `wedding-cep/Postflight` presentation boundary.
Evidence Run: `npm run test:wedding`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: there is still no dedicated smoke that asserts the exact new section headings for mixed global severities; coverage is currently integration-test plus full wedding smoke regression.
Unverified But Suspected: none.

## Postmortem

- Pilot outcome: success. The explorer routed the task to the correct feature slice immediately, and the implementation stayed within the 3-file scope lock without churn in validator or action layers.
- What this says about the operating model: `wedding-cep/FEATURE_MAP.md` and the postflight boundary are strong enough for a small `T1` UI/report task; this is a good signal for moving to Milestone 2 next.
- Follow-up signal: if future postflight work needs larger UX changes, the widget slice is ready, but rule policy and document-sync behavior should remain a separate milestone to avoid hidden `T2` scope creep.
