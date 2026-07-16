## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Standardize postflight/report findings in `wedding-cep`, add hook-run observability in `symbol-cep`, and keep cross-app sharing limited to vocabulary rather than runtime extraction.
- Execution mode: focused cross-app runtime patch with local tests and smoke receipts

## Files To Modify

- `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
- `wedding-cep/cep/js/logic/validators/rules/*.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.test.js`
- `wedding-cep/cep/js/logic/validators/PostflightValidator.test.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`
- `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/imposition/postflight/*.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `wedding-cep` uses postflight as `postflight/report` with `PostflightAction`, `PostflightValidator`, and `ValidationReportWidget`.
- `symbol-cep` uses postflight as `postflight/hooks` with `PostflightOrchestrator` and `PasteboardInfoRule`.
- Cross-app taxonomy remains rooted in `POSTFLIGHT_TAXONOMY.md`; this round does not extract runtime code into `libs/shared`.

## Cross-App Impact

- `wedding-cep` report contract and UI semantics become stricter but remain app-local.
- `symbol-cep` hook execution now returns a summary and exposes it through debug surfaces for smoke/debug receipts.
- No shared runtime API or shared library contract changes in this round.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm --workspace imposition-panel-cep run test`
- `npm run lint:symbol`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_cross_app_postflight_v2_scope.md`

## Notes Before Execution

- Keep `postflight/report` and `postflight/hooks` separate in runtime code.
- Do not introduce shared validator/widget/orchestrator abstractions.
- Prefer compatibility shims inside app-local contracts where needed rather than changing cross-app taxonomy.

## Review Gate

Scope Reviewed: cross-app postflight/report and postflight/hooks runtime changes, including tests and smoke receipts.
Top Risks: `wedding-cep` report normalization could break actionable frame selection; `symbol-cep` hook summary could accidentally turn hook failures into main-flow failures.
Required Fixes: keep `wedding` actionability scoped to frame findings only; keep `symbol` postflight soft-fail and observational.
No Blocking Findings: yes. Widget compatibility kept `id || frameId` action resolution for frame-scoped findings, and `symbol-cep` hook failures remain summarized without halting the main success path.
Validation Rerun Needed: no further rerun needed after the recorded validation set below.

## Verification Gate

Claims Verified: `wedding-cep` postflight findings now carry normalized severity/scope/action semantics with global findings non-actionable and grouped in the widget; `symbol-cep` postflight hooks now return an observable summary and can be exercised through CI-safe tests plus a debug-smoke receipt without turning hooks into a report UI.
Evidence Run: `npm run test:wedding`; `npm --workspace imposition-panel-cep run test`; `npm run lint:wedding`; `npm run lint:symbol`; `npm run build:wedding`; `npm run build:symbol`; `npm run test:smoke:wedding`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: root `npm run verify` still does not include `symbol-cep` unit tests or smoke by default, so those receipts are tracked separately in this round's evidence list.
Unverified But Suspected: none.
