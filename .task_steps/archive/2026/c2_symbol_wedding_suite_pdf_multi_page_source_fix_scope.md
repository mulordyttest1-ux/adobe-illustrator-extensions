## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix `symbol-cep / Wedding Suite Standard` so multi-page PDF sources are inspected and built from real PDF pages instead of the single default Illustrator document/artboard returned by `app.open(...)`.
- Execution mode: Focused app-local bug fix in the Wedding Suite island with host-side page handling, no legacy `symbol` engine or shared-lib changes.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.test.mjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/index.html`

## Cross-App Impact

- None. Scope stays inside `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- targeted real probe against the user PDF source
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_pdf_multi_page_source_fix_scope.md`

## Notes Before Execution

- Symptom:
  - User source PDF is known-good and contains 4 pages (`page 1 envelope`, `page 2 info`, `page 3-4 invites`).
  - Wedding Suite currently reads only `1` page from that file.
- Expected vs actual:
  - Expected: `inspectSource(...)` returns real PDF pages 1..n, capped to 5 for the fixed workflow.
  - Actual: host opens the PDF once and reports `doc.artboards.length`, which returns `1` for this file.
- Verified evidence:
  - Raw PDF scan on disk shows `/Count=4`.
  - Current runtime probe on the same file reports `totalPages: 1`.
- Hypotheses:
  1. Picker/path transport is corrupting the file path before host open.
  2. Illustrator `app.open(File)` on a PDF defaults to one document/page, and the host is treating that as a full source manifest.
  3. Planner/build request is truncating the manifest after the bridge.
- Isolation result:
  - Hypothesis 1 rejected: Unicode bridge/path handling now roundtrips correctly.
  - Hypothesis 3 rejected: planner reflects whatever manifest it receives.
  - Hypothesis 2 confirmed as current root cause candidate.

## Review Gate

Scope Reviewed: Wedding Suite island only, centered on host-side PDF page handling.
Top Risks: Misusing Illustrator PDF open preferences and regressing AI-source handling; fixing `inspectSource` but leaving `buildJob` on the old single-doc path; reintroducing false-positive smoke that does not exercise the real page contract.
Required Fixes: Add a PDF-aware host source abstraction shared by `inspectSource` and `buildJob`; preserve ES3 compatibility in `.jsx`; validate against the real user PDF, not just mocked smoke.
No Blocking Findings: Completed. The fix stayed app-local, preserved the AI/artboard path, and added one real-host smoke against a 4-page PDF fixture instead of only mocked adapter coverage.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: `inspectSource(...)` now returns real PDF pages 1..n instead of a single default-opened artboard; `buildJob(...)` now consumes PDF pages through the same page-aware source session instead of assuming one opened document owns the whole PDF; AI/artboard sources still keep the legacy single-document path; Wedding Suite smoke now contains a real-host PDF fixture check instead of relying only on mocked manifests.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol`; `npm run verify`; real host probe against `symbol-cep/runtime_probe_ascii.pdf` -> `totalPages: 4`; real host probe against the user PDF in `symbol-cep/` -> `totalPages: 4`, pages `1,2,3,4`; real host build probe against the user PDF with `jobQuantity=1` -> PDF output created successfully, then probe output file removed.
Remaining Limits: The live build probe used `jobQuantity=1` because the current hidden manual-invite quantity path is still stricter than the quick probe setup, and the real-host smoke fixture still resolves from workspace-path candidates instead of a packaged CEP fixture.
Unverified But Suspected: none.

## Postmortem

- Root cause verified:
  - Wedding Suite opened a PDF once with `app.open(...)` and treated the resulting Illustrator document/artboards as the full source manifest.
  - For the user file, Illustrator default-opened only one page/document, so the app reported `totalPages: 1` even though the raw PDF had `/Count=4`.
- False signals that slowed the fix:
  - The earlier picker and Unicode-path bugs were real, but after they were fixed they still masked the deeper PDF-page bug.
  - A manual runtime probe accidentally hit a mocked panel adapter left behind by smoke state, which briefly produced a fake manifest; direct `CSInterface.evalScript(...)` host probes corrected that.
- Guardrail that should have existed earlier:
  - A real-host smoke that inspects an actual multi-page PDF fixture.
- Reusable lesson:
  - In CEP/Illustrator, PDF sources must be treated as page-addressable inputs, not assumed to behave like multi-artboard AI documents after a single `open()`.
