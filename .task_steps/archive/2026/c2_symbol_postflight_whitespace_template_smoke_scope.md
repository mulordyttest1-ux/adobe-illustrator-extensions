## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `symbol-cep` already has unit coverage for whitespace-only pasteboard templates, but the runtime smoke lane only proves the positive preview and engine-success paths. The `skipped` hook path still lacks a dedicated smoke/debug receipt.
- Goal: Add one focused smoke/debug contract for `Postflight / Hooks` that proves whitespace-only legend templates skip bridge execution at runtime.
- Non-goals: Do not change `PasteboardInfoRule`, `PostflightOrchestrator`, bridge payloads, or `ActionTab` behavior.

## Scope Lock

- Summary: Add a focused `symbol-cep` smoke/debug receipt for the whitespace-only pasteboard-template skip path.
- Execution mode: Test/debug-layer only inside `symbol-cep/Postflight / Hooks`; use the existing debug surface instead of widening runtime contracts.

## Files To Modify

- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`

## Cross-App Impact

- None. This change stays inside `symbol-cep` smoke/debug coverage.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_postflight_whitespace_template_smoke_scope.md`

## Notes Before Execution

- Treat this as a `T1` single-app, single-context coverage upgrade.
- Reuse the current `window.Imposition.debug.simulatePostflightSuccess(...)` seam instead of adding new debug hooks.
- The smoke assertion should prove both outcomes:
  - summary reports `skipped`
  - no bridge draw call is emitted

## Implementation Note

- Added one focused smoke contract to `symbol-cep/cep/debug_scripts/test_smoke.cjs` right next to the existing postflight preview and engine-success checks.
- The new test drives the existing debug seam `simulatePostflightSuccess(...)` with a whitespace-only `info_template`.
- The assertion now proves both runtime outcomes:
  - the postflight summary retains `skippedCount === 1`
  - no `Bridge.drawPasteboardLegend(...)` call is emitted
- No runtime/product modules were changed; this follow-up stays entirely inside the smoke/debug layer.

## Review Gate

Scope Reviewed: `symbol-cep` smoke/debug coverage only, limited to the postflight smoke script and the new receipt.
Top Risks: asserting the wrong runtime seam, accidentally depending on debug-only state that is not stable across reloads, or duplicating the positive-path smoke without proving the `skipped` hook path.
Required Fixes: none after implementation; the final test reused the existing debug API and asserted both `skipped` summary counts and zero bridge calls.
No Blocking Findings: yes; self-review found no need to widen debug/runtime contracts or touch hook implementation code.
Validation Rerun Needed: yes; reran `lint:symbol`, symbol unit tests, `build:symbol`, `test:smoke:symbol`, and `verify` on the final smoke script.

## Verification Gate

Claims Verified: runtime smoke now covers the whitespace-only pasteboard-template skip path, the `Postflight / Hooks` summary stays observable through the existing debug seam, and no bridge legend draw call is emitted for blank-only templates.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol`; `npm run verify`.
Remaining Limits: this remains a debug-backed smoke receipt rather than a pure host-side smoke; it proves runtime orchestration and bridge non-invocation, but not Illustrator-host rendering behavior because the expected path is `skipped`.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest useful backlog item left after the pilot loop because it closed a real runtime validation gap without reopening architecture work.
- Why it fit next: the dense-label wrap contract was already covered in smoke, while owner-handle upgrades were blocked on external identity knowledge and hotspot splits were still premature.
- Operating-model signal: the current `symbol-cep` debug seam is strong enough to add focused postflight coverage without widening contracts or introducing a second validation path.
