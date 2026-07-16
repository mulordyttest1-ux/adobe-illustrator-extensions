## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Align `symbol-cep / Wedding Suite Standard` output with the operator-correct production reference by removing non-print overlays from production/envelope artboards and keeping QA summary content inside the QA artboard.
- Execution mode: Focused app-local host fix in the Wedding Suite island. Keep the one-button fixed-page workflow and linked PDF placement seam; change only output rendering policy plus targeted regression validation.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`

## Consumers Verified

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `symbol-cep/cep/js/app.js`

## Cross-App Impact

- None. Scope stays inside `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run build:symbol`
- `npm run test:smoke:symbol`
- live probe against the customer PDF in `symbol-cep/`
- output-fidelity probe that reopens the generated PDF in Illustrator and checks per-artboard item counts
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_output_fidelity_fix_scope.md`

## Notes Before Execution

- Problem:
  - Wedding Suite had already been pivoted to linked PDF placement, but the generated output still drifted from the operator-correct production reference.
  - The user-edited reference AI showed production artboards should contain only placed artwork, with no placeholder frames and no text overlays; QA should keep only one compact summary text frame.
- Expected vs actual:
  - Expected: `Envelope` and `Production` artboards contain only placed source artwork; `QA` keeps one compact summary that stays inside the QA artboard.
  - Actual: generated output still emitted placeholder frames and label text in production/envelope, and the QA summary point-text bounds spilled into the `Envelope` artboard.
- Verified evidence:
  - Illustrator probe on the user-adjusted reference AI showed:
    - `QA`: `1` text frame, `0` path items
    - `Envelope`: `0` text frames, `0` path items
    - `Production`: `0` text frames, `0` path items, `8` placed items
  - Illustrator probe on the generated output before this fix showed:
    - `Production`: `8` placed items but non-print overlays had existed earlier
    - `Envelope`: `1` intersecting text frame because the QA summary line was too wide

## Review Gate

Scope Reviewed: Wedding Suite host rendering policy only, with no scanner, bridge payload, or generic symbol workflow changes.
Top Risks: Removing overlays could also remove the only operator-visible QA guidance; shrinking QA summary could accidentally hide source identity or break the one-text-frame reference contract.
Required Fixes: Strip placeholder and production/envelope label rendering from the host path; keep one compact QA summary; verify output by reopening the generated PDF in Illustrator and counting artboard-local items.
No Blocking Findings: Completed. Output now matches the production-reference shape on the live customer PDF probe.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Production and envelope artboards no longer emit non-print text/placeholder overlays; QA summary remains but stays inside the QA artboard; live Wedding Suite output now matches the user-adjusted AI reference characteristics.
Evidence Run: `npm run build:symbol`; `npm run test:smoke:symbol` -> `40/40`; live panel build probe against the customer PDF; Illustrator reopen probe on generated `live_actual_pdf.pdf` -> `QA: 1 text / 3 placed / 0 path`, `Envelope: 0 text / 1 placed / 0 path`, `Production: 0 text / 8 placed / 0 path`; `npm run verify`.
Remaining Limits: QA still uses a single point-text summary block rather than a richer constrained layout; output remains PDF-only, so deeper item inspection still depends on reopening the generated PDF in Illustrator.
Unverified But Suspected: none.

## Postmortem

- Root cause verified:
  - The linked-placement pivot fixed content loading, but the rendering policy still reflected debug/operator scaffolding rather than production print output.
  - Placeholder rectangles and label text were still drawn directly into production/envelope artboards, and the QA summary used an unbounded point-text line that crossed the QA artboard boundary.
- False signal / false hypothesis:
  - The earlier “blank PDF” bug made it tempting to keep using simple “file exists” validation, but that was not enough to catch print-fidelity drift once linked placement started working.
- Guardrail that should have existed earlier:
  - A runtime probe that reopens the generated output in Illustrator and checks per-artboard `textFrames/pathItems/placedItems` against the expected production contract.
- Reusable lesson:
  - For Illustrator-generated print files, “output exists” is not a strong enough regression guard. Reopening the generated file and checking artboard-local item shape is a much better smoke-level fidelity check.
