## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Replace `symbol-cep / Wedding Suite Standard` PDF inspect with a panel-side lightweight manifest scanner so the operator path no longer opens PDF pages in Illustrator just to read page count and page sizes.
- Execution mode: Focused app-local build in the Wedding Suite island. Keep host `.jsx` as the build owner, keep one-button operator UX, and make PDF manifest inspection panel-owned and PDF-only.

## Files To Modify

- `symbol-cep/cep/package.json`
- `symbol-cep/cep/js/features/wedding-suite-standard/pdfManifestScanner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/pdfManifestScanner.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `package-lock.json`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/runtime_probe_ascii.pdf`

## Cross-App Impact

- None. Scope stays inside `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_lightweight_pdf_manifest_scanner_scope.md`

## Notes Before Execution

- Problem:
  - Wedding Suite currently inspects PDF sources by opening them via Illustrator host code, which is slow enough to feel like a freeze.
- Expected vs actual:
  - Expected: choosing a PDF should read only manifest metadata (`totalPages`, page 1-5 size/orientation) on the panel side, then keep the host reserved for build/render only.
  - Actual: the operator path still routes PDF inspect through host open logic.
- Scope constraints:
  - PDF-only for V1.
  - Fail fast on malformed/encrypted/unsupported sources.
  - No fallback to host-open inspect for PDF.

## Review Gate

Scope Reviewed: `symbol-cep` Wedding Suite island only, centered on the operator-path inspect boundary (`WeddingSuiteTab`, `bridgeAdapter`, new `pdfManifestScanner`) while keeping host `.jsx` build ownership intact.
Top Risks: Shipping a scanner that still falls back to host-open inspect on PDF; breaking the one-button workflow state shape expected by `planner.js`; reading PDF bytes with a runtime-specific path that only works in tests but not in the CEP panel.
Required Fixes: Add a panel-side PDF scanner with a stable manifest contract; make `WeddingSuiteTab.refreshSourceManifest()` PDF-only and scanner-owned; restrict the picker to PDF; add unit coverage for scanner, tab routing, and bridge picker args; replace mocked host-inspect smoke with a real scanner smoke and explicit host-inspect non-usage assertion.
No Blocking Findings: Completed. The operator path no longer uses host inspect for PDF, downstream plan shape stayed stable, and real scanner probes now read the 4-page fixture and the user PDF correctly.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Wedding Suite PDF inspect is now panel-side and PDF-only; the scanner returns `totalPages` plus page 1-5 dimensions from real PDF metadata without opening Illustrator; `WeddingSuiteTab` no longer calls `hostAdapter.inspectSource()` for PDF sources; the one-button fixed-page workflow still maps `page 1 envelope`, `page 2 info`, and `page 3-5 invites`; picker args are now PDF-only.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test` -> `70/70`; `npm run build:symbol`; `npm run verify`; direct Node probe via `scanPdfManifest()` against `symbol-cep/runtime_probe_ascii.pdf` -> `totalPages: 4`; direct Node probe via `scanPdfManifest()` against the user PDF in `symbol-cep/` -> `totalPages: 4`, pages `1,2,3,4`; attempted `npm run test:smoke:symbol` -> blocked by environment because no listener on `127.0.0.1:9098`.
Remaining Limits: The CEP smoke lane could not be rerun in this session because the `symbol-cep` panel was not open on its debug port `9098`. I verified the scanner on real PDFs directly, but not through the live CEP panel runtime lane in this round.
Unverified But Suspected: Build path performance is still host-owned and may remain slow on large PDFs because this round only removed the heavy inspect path, not the host build/render path.
