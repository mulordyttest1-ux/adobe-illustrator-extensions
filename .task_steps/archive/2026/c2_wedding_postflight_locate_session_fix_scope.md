## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix `wedding-cep` postflight locate so a report opened from a multi-frame selection can keep locating multiple issues without destroying the original selection context.
- Execution mode: Root-cause fix in `wedding-cep` only, with host-backed session state and widget/report updates.

## Files To Modify

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetChrome.js`
- `wedding-cep/cep/js/components/postflight/widgetGrouping.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/cep/js/infrastructure/bridge.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/logic/validators/rules/EmptyOverrideRule.js`
- `wedding-cep/cep/js/logic/validators/rules/LeftoverMarkerRule.js`
- `wedding-cep/cep/js/logic/validators/rules/SuspiciousDataRule.js`
- `wedding-cep/cep/js/logic/validators/rules/TruncationRule.js`
- `wedding-cep/cep/jsx/illustrator.jsx`
- `wedding-cep/cep/js/actions/PostflightAction.test.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `wedding-cep/cep/js/infrastructure/bridge.test.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/TabbedPanel.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`

## Cross-App Impact

- none; change stays inside `wedding-cep` app runtime and host bridge.

## Validation Targets

- `node --test wedding-cep/cep/js/actions/PostflightAction.test.js`
- `node --test wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `node --test wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `node --test wedding-cep/cep/js/infrastructure/bridge.test.js`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_locate_session_fix_scope.md`

## Notes Before Execution

- Normalized receipt:
  - `intent`: bug fix
  - `route`: `/fix`
  - `goal`: keep postflight issue browsing stable for multi-frame selection sessions
  - `success_criteria`: locate issue A then issue B still works, original selection can be restored, and locate no longer depends on current `doc.selection`
  - `scope_guess`: postflight action/widget, bridge, and JSX host selection handling
  - `constraints`: keep change app-local, preserve InjectSchema legacy `selectFramesById(ids)` behavior, keep ES3 compatibility in `.jsx`
  - `unknowns`: no repo-side automated Illustrator harness confirmed for live host session smoke
  - `approval_needed`: no
- Symptom:
  - Expected: after postflight opens from a selected group of frames, the user can click multiple report items in sequence and still inspect each target while preserving the original selection context.
  - Actual: first locate click rewrites `doc.selection`, so later locate clicks operate on a reduced selection and often fail or lose the ability to inspect the rest of the issues.
  - Reproduce path: run postflight from a multi-frame selection, click locate on one frame-level issue, then click locate on a second issue from the same report.
- Hypotheses:
  - H1: host `selectFramesById` resolves ids from the live `doc.selection`, then overwrites that same selection, so the lookup context shrinks after the first click.
  - H2: widget action semantics are too implicit, so frame-level findings without explicit action are treated as locate targets even when the report has no stable host session behind them.
  - H3: report lifecycle leaves stale selection context alive across close/reopen paths, so the host can act on outdated state when the widget is reused.
- Isolation:
  - Confirmed by inspection that `selectFramesById` builds its frame map from `doc.selection` and immediately replaces `doc.selection` with the requested match set.
  - Confirmed by inspection that `PostflightValidator` and `widgetGrouping` currently infer locate action from `frameId`, not only from explicit actions.
  - Confirmed by inspection that `ValidationReportWidget.close()` currently removes the widget only and does not clear any host-side postflight selection state.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `wedding-cep` postflight session ownership across [`PostflightAction.js`](C:/Projects/adobe-illustrator-extensions/wedding-cep/cep/js/actions/PostflightAction.js), [`bridge.js`](C:/Projects/adobe-illustrator-extensions/wedding-cep/cep/js/infrastructure/bridge.js), and [`illustrator.jsx`](C:/Projects/adobe-illustrator-extensions/wedding-cep/cep/jsx/illustrator.jsx), plus the new regression coverage in the related test files.
Top Risks: Unrelated callers of `readSelectionObjects()` reseeding or clearing an open postflight session; breaking legacy array-based `selectFramesById(ids)` consumers that still rely on live selection lookup; declaring the fix complete without any explicit regression coverage for repeated locate/restore flows.
Required Fixes: Make postflight session seeding opt-in from `PostflightAction` instead of implicit in every `readSelectionObjects()` call; keep default `Bridge.readSelectionObjects()` unseeded for generic callers such as selection-plan flows; add regression coverage for repeated report browsing and restore from one session-backed report.
No Blocking Findings: Explorer review from `019d61d3-9c8a-7261-bb6c-fbf43e90726b` found no blocking implementation defects after the opt-in seeding change landed; one low residual gap remains because there is still no direct automated host-runtime test that seeds a postflight session, performs an unrelated plain `readSelectionObjects()`, then proves both session-backed locate and legacy live-selection `selectFramesById(ids)` still behave correctly.
Validation Rerun Needed: After broadening coverage with a live smoke regression in `debug_scripts/smoke_suites/postflight_smoke_tests.cjs`, validation reran on the final diff with `npm run test:wedding`, `npm run test:smoke:wedding`, and `npm run check:encoding`.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `PostflightAction` now opts into postflight session seeding explicitly instead of relying on the generic `readSelectionObjects()` default; ordinary `Bridge.readSelectionObjects()` calls remain unseeded, so non-postflight selection reads no longer rotate the active report session by default; session-backed locate requests continue to use the stored postflight session, and the report can issue multiple locate clicks before restore within one report session; legacy array-based `selectFramesById(ids)` behavior still routes through `live-selection` for existing non-postflight consumers; the live smoke suite now verifies the exact sequence seed postflight session -> unrelated plain `readSelectionObjects()` -> locate A -> locate B -> restore original selection -> legacy live-selection locate; wedding app tests, live smoke, encoding checks, and gate checks pass on the final diff.
Evidence Run: `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:encoding`; `npm run check:gates -- --file .task_steps/c2_wedding_postflight_locate_session_fix_scope.md`.
Remaining Limits: The new live smoke covers the critical regression path on the current local CEP/Illustrator setup, but it still exercises one concrete host fixture shape (`postflight_select`) rather than every possible multi-group or nested-selection variant.
Unverified But Suspected: No additional blocker is currently suspected after the live smoke passed; any further residual risk is limited to untested host selection shapes outside the exercised fixture scenario.

## Postmortem

- Root cause confirmed: [`illustrator.jsx`](C:/Projects/adobe-illustrator-extensions/wedding-cep/cep/jsx/illustrator.jsx) originally seeded postflight session state from the generic `readSelectionObjects()` path, so any later selection read could rotate the stored session and make an open report expire unexpectedly.
- False lead rejected: the remaining instability was not primarily a widget-label or toast problem after the first pass; the real issue lived in host-session ownership and when that host state was reseeded.
- Guardrail that should have been used earlier: an explicit regression assertion for "postflight-only session seeding" would have caught the review finding before the first review pass.
- Reusable lesson: when CEP panel UX depends on host-side browsing state, session creation must belong to the owning workflow rather than a shared read helper.
