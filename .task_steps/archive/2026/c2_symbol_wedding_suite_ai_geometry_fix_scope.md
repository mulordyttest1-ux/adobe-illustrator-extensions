## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Pivot Wedding Suite away from generic fit/center geometry and into deterministic print placement: F180 production cards resize directly into fixed `117.5 x 160mm` slots from the `5mm` paper margin, while envelope now follows the clarified production rule `rotate 45° counter-clockwise -> keep the golden scale -> place at the fixed reference position`, even though that makes the envelope overflow its own artboard bounds.
- Execution mode: Focused app-local fix inside the Wedding Suite island. Keep the fixed-page one-button workflow, keep the panel-side PDF scanner, and repair only the host placement/save seam, artboard spacing, and the smoke/runtime guardrails that validate the AI-debug contract.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `.task_steps/c2_symbol_wedding_suite_ai_geometry_fix_scope.md`

## Consumers Verified

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/pdfManifestScanner.js`
- `symbol-cep/cep/js/app.js`

## Cross-App Impact

- None. Scope stays inside the `symbol-cep` Wedding Suite island.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- live build probe against the real customer PDF in `symbol-cep/`
- Illustrator reopen probe on the generated AI output
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_ai_geometry_fix_scope.md`

## Notes Before Execution

### Symptom

- Production cards were still carrying preview-style fit semantics instead of deterministic print placement.
- Envelope still did not follow the clarified real-world print workflow: it needed to rotate `45°` counter-clockwise and overflow its artboard, but the host was still keeping it in a non-rotated bounded placement.
- Once envelope started overflowing correctly, the old fixed `12mm` artboard gap was no longer sufficient and envelope geometry bled into the first production artboard.

### Expected vs Actual

- Expected: temporary output stays `.ai`; production cards land exactly on the `470 / 4` by `320 / 2` grid with only the outer `5mm` paper margin; envelope rotates `45°` counter-clockwise, keeps the scale from the operator-correct AI reference, overflows its own `230 x 230` artboard, and still does not contaminate neighboring production artboards.
- Actual before the fix: production cards were still aspect-fit driven, envelope was not rotating, and after enabling envelope overflow the first production artboard started seeing the envelope as a ninth placed item.

### Reproduce Path

- Build Wedding Suite from the real 4-page customer PDF.
- Open the generated AI output.
- Compare the production artboards and envelope artboard to the operator-correct AI reference at `symbol-cep/runtime_probe_out/smoke_linked_build/smoke_linked_build.ai`.

### Hypotheses

- H1: production shrink persists because the host is still using aspect-fit/center semantics instead of exact top-left slot placement.
- H2: envelope still misses the real print workflow because it is being fit into a target rect instead of being rotated and scaled by reference.
- H3: once envelope overflow is correct, artboard spacing becomes the next true runtime bug because the envelope starts intersecting the first production page.

### Isolation

- Replaced the production rendering path with exact slot placement on linked PDF `PlacedItem`s, using deterministic `117.5 x 160mm` cells anchored from the `5mm` outer margin.
- Replaced the envelope rendering path with a reference-driven transform that uses the golden scale factor, rotates `45°`, and reapplies the fixed top-left position.
- Added a runtime guard that reopens the generated AI and inspects both placed bounds and placed matrices.
- Increased the post-envelope artboard gap dynamically from the actual overflow width of the rotated envelope, so overflow stays inside the envelope page only and no longer leaks into production pages.

### Root Cause

- Wedding Suite was still carrying a generic `fit/center` mindset where the real workflow needed deterministic print placement.
- Envelope needed a different seam than cards: not `fit into rect`, but `rotate -> scale by reference -> place by fixed top-left`.
- Artboard layout had been tuned for a bounded envelope. Once envelope followed the real-world diamond placement and overflowed, the old gap became invalid and caused cross-artboard contamination.

## Review Gate

Scope Reviewed: Wedding Suite host placement/save seam only: deterministic F180 slot placement, rotated overflow envelope placement, dynamic post-envelope artboard gap, AI-first debug output, and geometry-true smoke assertions.
Top Risks: Envelope rotation could be implemented with the wrong sign or wrong anchor and still look “kind of close” unless runtime smoke reads the placed matrix. Allowing envelope overflow could contaminate production pages if the artboard gap is still fixed. Tightening placement could regress QA previews if the new deterministic helpers leaked into the wrong path.
Required Fixes: Keep AI output for debugging, keep deterministic production slots, rotate envelope `45°` counter-clockwise while preserving the golden reference scale and anchor, and increase the post-envelope artboard gap so envelope overflow does not reach production pages.
No Blocking Findings: Completed. Fixture smoke and the live CK.pdf probe both confirm the rotated overflow envelope and clean production pages.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Wedding Suite now saves `.ai` output for the current debugging phase; F180 production sheets place cards by exact deterministic slot geometry (`117.5 x 160mm`, pitch `117.5mm`, bottom row top `165mm` below artboard top, only the outer `5mm` paper margin); envelope placement now rotates `45°` counter-clockwise, preserves the golden scale factor, keeps the fixed top-left offset (`left offset 0`, `top offset 5.0853mm`), and overflows beyond the envelope artboard without contaminating neighboring production pages; generated AI output keeps the print-only contract of `QA: 1 text / 3 placed / 0 path`, `Envelope: 0 text / 1 placed / 0 path`, and `Production: 0 text / 8 placed / 0 path`.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test` -> `71/71`; `npm run build:symbol`; `npm run test:smoke:symbol` -> `40/40`; live direct-method build probe against the real customer PDF at `symbol-cep/nhu trai 350 (4c 2016) zalo1, cso file sẵn, in nền xanh f180 PHOTO HOA HỒNG KRÔNG BÔNG(  TÂN HỒNG Chiều HOẶC BUÝT), CK.pdf` -> manifest `4` pages, AI build completed in about `4933ms`, output saved to `symbol-cep/runtime_probe_out/live_actual_ai/live_actual_ai.ai`; Illustrator reopen probe on that AI -> `QA: 1 text / 3 placed / 0 path`, `Envelope: 0 text / 1 placed / 0 path`, `Production: 0 text / 8 placed / 0 path`, envelope placed bounds `[left=artboardLeft+0, top=artboardTop-5.0853, right beyond artboard, bottom beyond artboard]`, and envelope placed matrix with non-zero `mValueB`/`mValueC`, confirming real rotation.
Remaining Limits: Output is intentionally AI-first for the current debugging phase; PDF-only delivery remains deferred until the geometry and operator workflow are fully stable. The fixed-page workflow still uses generic page labels (`Page 3`, `Page 4`) unless the operator edits them in panel state; this round focused on placement fidelity, not naming UX. The real customer build remains materially slower than the lightweight manifest scan because build still places linked PDF pages through Illustrator host execution.
Unverified But Suspected: none.

## Postmortem

- Root cause verified:
  - Wedding Suite was still carrying a generic `fit/center` mindset where the real workflow needed deterministic print placement.
  - Envelope needed a different seam than cards: not `fit into rect`, but `rotate -> scale by reference -> place by fixed top-left`.
  - Once envelope overflow matched the real print workflow, the old fixed artboard gap became invalid and let envelope geometry leak into the first production artboard.
- False signal / false hypothesis:
  - The earlier assumption that a non-rotated golden reference box was the full source of truth turned out to be incomplete. It preserved the scale and anchor, but it missed the operator’s actual production instruction that envelope must still be rotated `45°`.
- Guardrail that should have existed earlier:
  - A host smoke that inspects both placed bounds and placed matrices, and that checks production pages stay clean even when envelope is allowed to overflow its own artboard.
- Reusable lesson:
  - For print-production workflows in Illustrator, linked PDF placement is the right seam, but it must still model the real production transform exactly. Bounds-only validation is not enough when rotation and cross-artboard bleed are part of the workflow.
