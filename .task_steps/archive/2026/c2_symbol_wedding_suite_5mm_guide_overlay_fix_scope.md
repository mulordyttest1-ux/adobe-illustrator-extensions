## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Add 5mm safety-check guides directly on the Wedding Suite main layer, convert them to Illustrator guides so they do not print, and keep the one-button PDF workflow and AI-first debug contract unchanged.
- Execution mode: Focused app-local fix inside the `symbol-cep` Wedding Suite island. Keep current fixed-page build flow, add guide generation only after final geometry is known, and update smoke coverage so guides are counted separately from printable path artwork.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `.task_steps/c2_symbol_wedding_suite_5mm_guide_overlay_fix_scope.md`

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
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_5mm_guide_overlay_fix_scope.md`

## Notes Before Execution

### Symptom

- Wedding Suite output had no built-in visual safety check, so the operator still had to eyeball edge risk without a consistent 5mm reference.
- The tricky case was envelope: it rotates `45°` and must keep its golden local transform, so a normal artboard box guide would not match the real printed geometry.

### Expected vs Actual

- Expected: every QA preview and production slot gets a 5mm inset Illustrator guide, and envelope gets a rotated diamond guide that follows the same transform as the placed artwork.
- Actual before the fix: no non-printing guides existed in the generated AI, so artboards looked visually “clean” but did not help the operator judge edge risk.

### Reproduce Path

- Build Wedding Suite AI from the 4-page runtime fixture or real customer PDF.
- Open the generated AI and inspect QA, Envelope, and production artboards.
- Compare guide presence and geometry with the corresponding artwork placement.

### Hypotheses

- H1: card/info checks can be solved by creating guides from already-finalized preview and slot rects.
- H2: envelope needs a dedicated guide seam because it must reuse the exact reference transform, not a generic artboard rectangle.
- H3: smoke must distinguish Illustrator guides from printable path items or it will report false regressions.

### Isolation

- Reuse existing deterministic QA and production rects and inset each one by `5mm`.
- For envelope, create a source-sized rectangle, apply the same reference rotation/scale/anchor as the envelope artwork, then shrink it inward by `5mm` from the center before converting it to a guide.
- Update AI inspection smoke to count `path.guides === true` separately from normal paths.

### Root Cause

- Wedding Suite had placement fidelity but not operator-facing visual safety checks.
- Envelope could not share the same guide logic as cards because its meaningful geometry is a rotated diamond, not an axis-aligned slot.

## Review Gate

Scope Reviewed: Wedding Suite host-only guide generation and AI smoke inspection.
Top Risks: Guide paths could accidentally stay as printable artwork; envelope guide could drift if it does not reuse the same local transform as the envelope placed item; smoke could miscount guides as normal paths and fail on a false positive.
Required Fixes: Convert generated check rectangles into Illustrator guides on the main layer, keep `pathCount` reserved for printable path artwork, and assert envelope guide geometry separately from card guides.
No Blocking Findings: Completed.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Wedding Suite now writes non-printing 5mm Illustrator guides directly on the main content layer for QA previews, the rotated envelope, and each production slot. Guide paths are counted separately from printable paths, so artboards stay print-clean while still carrying a visual safety overlay. The envelope guide follows the same local transform as the rotated envelope artwork and remains inset from the outer diamond footprint.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test` -> `71/71`; `npm run build:symbol`; `npm run test:smoke:symbol` -> `40/40`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_5mm_guide_overlay_fix_scope.md`.
Remaining Limits: Guide overlay is a visual operator aid only. It does not auto-classify decorative bleed-like elements versus meaningful content.
Unverified But Suspected: none.

## Postmortem

- Root cause verified:
  - Wedding Suite needed a visual safety overlay, not more placement math.
  - Envelope requires a transform-aware guide because its review shape is rotated.
- Guardrail that should exist:
  - Smoke must count Illustrator guides separately from printable path items so the AI output can remain print-clean while still carrying review guides.
