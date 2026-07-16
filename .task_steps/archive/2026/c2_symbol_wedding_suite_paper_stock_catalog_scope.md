# C2: Wedding Suite Paper Stock Catalog

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Update F180 to 320 x 480 mm and move Wedding Suite paper-stock dimensions into an operator-editable JSON catalog.
- Execution mode: Approved direct implementation in `symbol-cep`; retain the existing F180 id for saved-state compatibility.

## Files To Modify

- `symbol-cep/cep/data/wedding_suite_paper_stocks.json`
- `symbol-cep/cep/data/README.md`
- `symbol-cep/cep/js/features/wedding-suite-standard/paperStockConfig.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/paperStockConfig.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- generated `symbol-cep/cep/js/bundle.js`

## Consumers Verified

- Wedding Suite paper selector and preview.
- Wedding Suite planner and host build request.
- QA and production artboard geometry smoke assertions.
- Existing saved state that references `f180_480x330`.

## Cross-App Impact

- None. No `wedding-cep`, `libs/shared`, or shared-domain code changed.

## Validation Targets

- F180 resolves to 320 x 480 mm and 310 x 470 mm usable area.
- Catalog changes can be made in JSON without editing planner or UI code.
- Missing or invalid catalog falls back safely.
- Runtime build and Illustrator 2026 host smoke remain healthy.

## Notes Before Execution

- Normalized request receipt: intent = feature/config migration; route = build; goal = update F180 and make future stock changes data-driven; success criteria = panel, planner, build, and smoke all consume the same catalog; constraints = `symbol-cep` only and no 2025 smoke; unknowns = none; approval needed = no.
- The legacy F180 id is intentionally retained even though its dimensions are encoded in the old id text.

## Review Gate

Scope Reviewed: Paper-stock loader, planner injection, Wedding Suite rendering, unit coverage, generated bundle, and 2026 smoke geometry.
Top Risks: CEP filesystem availability; saved-state id compatibility; geometry assertions drifting back to hardcoded stock dimensions.
Required Fixes: The first 2026 smoke exposed one remaining hardcoded QA size assertion; it was replaced with a catalog-derived assertion.
No Blocking Findings: Final review found no boundary leak, cross-app impact, or unresolved consumer mismatch.
Validation Rerun Needed: Yes; lint and 2026 smoke were rerun after the smoke assertion correction.

## Verification Gate

Claims Verified: F180 is 320 x 480 mm; the panel loads paper stocks from JSON; planner supports injected catalogs; fallback is safe; production and QA geometry follow the configured stock; the 2026 host lane builds successfully.
Evidence Run: `npm.cmd run lint:symbol`; `npm.cmd --workspace imposition-panel-cep run test` (158/158); `npm.cmd run build:symbol`; `node --check symbol-cep/cep/debug_scripts/test_smoke.cjs`; `npm.cmd --workspace imposition-panel-cep run test:smoke:2026` (46/46).
Remaining Limits: Editing the JSON requires a panel reload before the constructor reloads the catalog. Illustrator 2025 smoke was intentionally not run.
Unverified But Suspected: None.
