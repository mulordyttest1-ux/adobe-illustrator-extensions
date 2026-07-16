## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Make Wedding Suite Build PDF use the latest operator paper-stock JSON and align F180 fallback/tests to 480 x 320 mm.
- Execution mode: Focused Symbol panel configuration fix; Illustrator 2026 validation only.

## Files To Modify

- `symbol-cep/cep/data/wedding_suite_paper_stocks.json`
- `symbol-cep/cep/js/features/wedding-suite-standard/paperStockConfig.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/paperStockConfig.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/smoke_suites/wedding_suite_smoke_tests.cjs`

## Consumers Verified

- Wedding Suite planner request generation
- Wedding Suite panel stock selector and build action
- Wedding Suite host artboard creation through `payload.plan`

## Cross-App Impact

- None. Configuration and runtime changes stay inside Symbol CEP.

## Validation Targets

- `npm --workspace imposition-panel-cep run test`
- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test:smoke:2026`

## Notes Before Execution

- Expected: Anh Kim is 483 x 320 mm and F180 is 480 x 320 mm; editing the JSON must affect the next build without rebuilding the bundle.
- Actual: the panel loads the catalog once in the tab constructor, so an open panel keeps stale dimensions in memory. Fallback code and tests also still encode the previous 320 x 480 interpretation.
- Hypothesis 1: host hardcodes sheet dimensions. Rejected; host consumes `payload.plan.productionSheets` dimensions.
- Hypothesis 2: the installed wrapper reads a different JSON. Rejected; root-linked wrapper data points to the source folder.
- Hypothesis 3: panel catalog is stale in memory. Confirmed by constructor-only load and `_buildPlannerState()` reusing `this.paperStockCatalog`.
- Live follow-up: the operator result was an open `__wss_pdf...` staging document whose production artboard measured 320 x 480 mm and retained the old label. This proves the work panel had both a stale panel request and a stale in-memory host runtime. The host now independently reconciles the received plan with the external stock JSON before rendering.

## Review Gate

Scope Reviewed: Operator JSON ownership, panel refresh boundary, host stale-request reconciliation, QA/production dimension consistency, and 2026 smoke lifecycle.
Top Risks: Host reconciliation must not mutate plans when JSON cannot be read and must keep QA/production dimensions consistent.
Required Fixes: Completed a 2026 stale-request smoke assertion that deliberately sends F180 as 320 x 480 and requires 480 x 320 output.
No Blocking Findings: Yes.
Validation Rerun Needed: Completed after the host follow-up.

## Verification Gate

Claims Verified: F180 resolves to 480 x 320 mm; Anh Kim remains 483 x 320 mm; Build PDF reloads JSON panel-side; host corrects a stale 320 x 480 request from the external JSON before rendering; final production artboards are 480 x 320 mm.
Evidence Run: `npm --workspace imposition-panel-cep run test` (164/164); `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test:smoke:2026` (46/46 with deliberately stale F180 request); direct host helper probe changed stale plan 320 x 480 to 480 x 320; direct Illustrator artboard inspection measured 480 x 320 mm.
Remaining Limits: Illustrator 2025 smoke was intentionally not run. The legacy technical id `f180_480x330` remains to avoid breaking saved selection state. The operator's earlier failed run left a `__wss_pdf...` staging document open; it was inspected but not closed or deleted automatically.
Unverified But Suspected: None.

## Postmortem

- Root cause: the JSON file was external to the bundle, but its parsed catalog was retained for the entire tab lifetime, so external edits did not reach `_buildPlannerState()` until panel reload. A still-open work panel also retained the old bundle and old host globals.
- False signal: seeing the corrected JSON through the live link proved the file was synchronized, not that the panel had re-read it.
- Guardrail: every Build PDF now refreshes the catalog before request planning, with a unit test that starts from stale dimensions and verifies the next build uses the updated values.
- Defense in depth: host rendering independently reconciles stock dimensions from the same JSON, so an already-open stale panel cannot impose swapped dimensions.
- Reusable lesson: editable runtime config must define an explicit refresh boundary; being outside the bundle alone does not make in-memory state live.
