## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Pivot `symbol-cep / Wedding Suite Standard` build from `app.open(page) -> duplicate pageItems` to linked PDF placement so fixed-page Wedding Suite can build real customer PDFs reliably.
- Execution mode: Focused app-local bug fix in the Wedding Suite island. Keep the one-button PDF-only operator flow and the panel-side PDF manifest scanner; change only host-side build mechanics plus targeted smoke coverage.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/pdfManifestScanner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/js/app.js`

## Cross-App Impact

- None. Scope stays inside `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- real live probe against the customer PDF in `symbol-cep/`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_linked_pdf_placement_fix_scope.md`

## Notes Before Execution

- Problem:
  - Wedding Suite build opened PDF pages in Illustrator and duplicated pageItems into the output document.
  - On the real customer PDF, `app.open()` succeeded for page 1 but failed at page 2 with `the operation was cancelled`.
- Expected vs actual:
  - Expected: fixed-page Wedding Suite should build `QA -> Envelope -> Production` from page-linked PDF content and write one PDF output.
  - Actual: inspect had already been fixed, but build still used the wrong seam and failed or stalled on real PDFs.
- Verified evidence:
  - Panel-side scanner reads the real customer PDF quickly and correctly (`4` pages).
  - Direct host probe showed linked placement via `PDFFileOptions.pageToOpen + PlacedItem.file` succeeds for pages `1..4` on the same PDF.

## Review Gate

Scope Reviewed: Wedding Suite island only, centered on host build mechanics and runtime smoke. No shared UI or legacy imposition engine ownership changes.
Top Risks: Replacing the failing `open -> copy` seam with a linked placement seam but accidentally changing operator workflow, artboard order, or rotation behavior; leaving smoke on mocked build paths only; leaking test stubs across Wedding Suite smokes.
Required Fixes: Build from linked `PlacedItem`s staged once per used source page; keep rotation-on-landscape behavior for info/invite pages; add a real-host Wedding Suite smoke that writes an output PDF; reset Wedding Suite test deps between smokes.
No Blocking Findings: Completed. Host build now uses linked PDF placement, smoke covers real output writing, and Wedding Suite test deps reset to defaults between runtime tests.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Wedding Suite build no longer depends on opening PDF pages as documents; linked placement succeeds on the runtime fixture and the real customer PDF; smoke now proves the host build writes a PDF from fixed pages; the one-button PDF-only workflow and artboard order remain intact.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol` -> `40/40`; `npm run verify`; live panel probe against the customer PDF -> inspect `4` pages in ~`11ms`, build output PDF written in ~`5.2s`.
Remaining Limits: The progress/info toast still remains visible during the host-blocking build, so the queued success toast is delayed behind it instead of showing immediately when build returns. Output generation itself is verified and successful.
Unverified But Suspected: none.

## Postmortem

- Root cause verified:
  - The Wedding Suite build path treated source PDFs like artboard documents and duplicated pageItems after opening pages in Illustrator.
  - That seam was unstable on the real customer PDF, even after inspect had already been repaired.
- What changed:
  - Inspect stays panel-side and lightweight.
  - Build now stages linked `PlacedItem`s per used page, duplicates those into QA/envelope/production targets, and exports one PDF.
- Guardrail added:
  - A real-host smoke that writes an output PDF from the fixed-page runtime fixture instead of only mocking `buildJob`.
