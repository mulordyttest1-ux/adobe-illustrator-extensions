## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Harden `wedding-cep` postflight widget so it behaves predictably on narrow CEP panels and is torn down on tab switch instead of leaking across tab contexts.
- Execution mode: Focused app-local fix in `components/postflight/` and `components/TabbedPanel*` only.

## Files To Modify

- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetChrome.js`
- `wedding-cep/cep/js/components/postflight/widgetDom.js`
- `wedding-cep/cep/js/components/postflight/widgetChrome.test.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `wedding-cep/cep/js/components/TabbedPanel.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.js`
- `wedding-cep/cep/js/components/TabbedPanel.test.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`

## Consumers Verified

- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/TabbedPanel.js`
- `npm run test:smoke:wedding`

## Cross-App Impact

- None expected. `ValidationReportWidget` is app-local and `TabbedPanel` cleanup remains inside `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_postflight_widget_narrow_panel_tab_switch_fix_scope.md`

## Notes Before Execution

- Symptom:
  - the postflight widget used a fixed desktop-like shell that crowded narrow CEP panels
  - transient postflight UI was not part of the tab-switch cleanup seam, so it could survive into a different tab context
- Expected vs actual:
  - Expected: widget stays bounded within the panel viewport and disappears when the operator changes tabs.
  - Actual: shell used hard-coded width/body-height offsets, and tab cleanup only knew about autocomplete overlays.
- Scope guardrails:
  - Do not change validator logic or postflight finding taxonomy.
  - Do not touch shared libs, JSX, bridge payloads, or global panel layout outside this widget lifecycle.

## Symptom

- Narrow panel UX degrades because the postflight widget shell is sized like a desktop overlay.
- Tab changes can leave postflight UI visible in a different tab context.

## Hypotheses

- H1: The root narrow-panel issue is the hard-coded shell contract in `widgetChrome.js` (`width: 350px`, fixed offsets, fixed body height), not the report rendering logic.
- H2: The tab-switch leak exists because `cleanupTabbedOverlays(...)` only removes autocomplete overlays and has no postflight widget teardown path.
- H3: The correct fix is lifecycle-focused inside `ValidationReportWidget` + `TabbedPanel`, not in `PostflightAction` or validator code.

## Isolation

- Code inspection confirmed the shell sizing is defined entirely in `components/postflight/widgetChrome.js`.
- Code inspection confirmed `PostflightAction` only delegates to `ValidationReportWidget.show(...)` and does not own viewport or tab lifecycle logic.
- Code inspection confirmed `cleanupTabbedOverlays(...)` only handled `.autocomplete-list`, so postflight teardown was currently out of band.
- Smoke now proves the widget stays inside the live CEP viewport and is removed by a real tab switch, so the fix is locked to runtime behavior instead of code inspection only.

## Root Cause

- The widget shell was implemented as a fixed, hard-coded overlay without viewport-bounded sizing rules, so narrow panels inherited a desktop-sized report surface. In parallel, the tab-switch cleanup seam only removed autocomplete lists, leaving `ValidationReportWidget` outside the transient UI lifecycle.

## Verification Gate

Claims Verified: `ValidationReportWidget` now computes bounded shell metrics for the live viewport, applies a narrow layout mode for tighter panels, and cleans up without stealing focus during tab-switch teardown; `TabbedPanel` now routes tab-switch cleanup through the existing overlay seam and closes postflight widget UI when switching contexts; smoke now locks both viewport-bounded rendering and real tab-switch teardown for the postflight widget.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`.
Remaining Limits: the smoke asserts viewport bounds, not pixel-perfect spacing or typography; no additional exploratory receipt was recorded for every possible panel size outside the current live CEP window.
Unverified But Suspected: none.

## Postmortem

- Root cause confirmed: narrow-panel pain came from hard-coded widget shell dimensions, while stale tab behavior came from postflight not participating in the same transient UI cleanup seam as autocomplete.
- False signal or discarded hypothesis: `PostflightAction` and validator/report grouping were not the source; they stayed untouched.
- Guardrail that should have existed earlier: smoke should have included one widget lifecycle assertion for viewport bounds and tab teardown before the autocomplete cleanup round exposed the broader overlay problem.
- Reusable lesson: for CEP overlays, “looks fine on my panel” is not enough. Any transient UI surface should either live under a bounded responsive shell or participate in a shared cleanup seam when the operator changes context.
