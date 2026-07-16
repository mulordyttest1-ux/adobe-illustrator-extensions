## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `npm run test:smoke:symbol` fails a stable config-pane layout check because long processing labels do not wrap inside the compact panel width.
- Goal: Fix the long-label wrap behavior without changing config semantics, bridge flow, or postflight/preflight logic.
- Non-goals: Do not change copy, config schema structure, or host-side execution.

## Scope Lock

- Summary: Fix the symbol config-pane row layout so long processing labels wrap cleanly and do not intrude into the control area.
- Execution mode: Focused UI/layout fix inside `symbol-cep` config-pane renderer and stylesheet only.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- `symbol-cep/cep/css/style.css`

## Consumers Verified

- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `symbol-cep/cep/js/features/imposition/config_tab.js`

## Cross-App Impact

- None. The fix stays inside `symbol-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_processing_label_wrap_fix_scope.md`

## Notes Before Execution

- Keep the dense config-pane control model intact.
- Only change layout classes and CSS necessary to let long labels wrap.
- Do not add any dependency on legacy Tweakpane binding markup.

## Implementation Note

- Added a `pane-setting-row-long-label` class in `config_pane_renderer.js` for dense config rows whose labels exceed the compact threshold.
- Updated `style.css` so those long-label rows constrain the label block to `180px`, forcing wrap before the control column instead of letting the text stretch toward the control area.
- Kept the dense config-pane control model unchanged; no schema, bridge, or execution logic moved.

## Review Gate

Scope Reviewed: `symbol-cep` config-pane layout only, limited to the dense row renderer and stylesheet.
Top Risks: over-tightening label width so common rows become noisy, or accidentally changing control markup in a way that reintroduces legacy binding assumptions.
Required Fixes: one follow-up inside the same fix loop; the first width cap reduced overlap but still did not force wrapping, so the final cap was tightened from `232px` to `180px`.
No Blocking Findings: yes; after the second pass the smoke lane proved the row now wraps without clipping and no broader behavior drift appeared.
Validation Rerun Needed: yes; reran `lint:symbol`, `build:symbol`, `test`, `test:smoke:symbol`, and `verify` on the final CSS width.

## Verification Gate

Claims Verified: long processing labels in the symbol config pane now wrap inside the compact width without intruding into controls, and the fix stayed inside `symbol-cep` UI layout only.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol`; `npm run verify`.
Remaining Limits: the wrap threshold is still heuristic (`label length > 28` plus a `180px` max width) rather than measured from rendered text metrics.
Unverified But Suspected: none.

## Postmortem

- Root cause: the dense config row let long labels keep too much horizontal space, so the smoke contract for compact wrapping never triggered even though whitespace rules allowed wrapping.
- False start: a `232px` cap reduced the label footprint but still left enough room for the specific rotation label to remain single-line. Tightening to `180px` resolved the actual smoke contract.
- Follow-up note: if more dense rows start to vary by locale or copy length, the next evolution should be a deliberate compact-layout policy rather than more ad hoc width tuning.
