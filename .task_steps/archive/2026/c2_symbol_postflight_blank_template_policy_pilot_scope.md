## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `PasteboardInfoRule` treats whitespace-only templates as a real postflight hook input, so it can call the host bridge and report success even when there is effectively no legend content to render.
- Goal: Tighten `symbol-cep` postflight hook policy so blank/whitespace-only legend templates are treated as `skipped`, keeping hook semantics clean and avoiding unnecessary bridge calls.
- Non-goals: Do not add any report UI, do not change bridge payload contracts, and do not generalize this behavior into `wedding-cep`.

## Scope Lock

- Summary: Run Milestone 3 of the continuation protocol by treating blank pasteboard legend templates as a skipped `postflight/hooks` case in `symbol-cep`.
- Execution mode: Focused `symbol-cep/Postflight / Hooks` rule-level policy change only; keep orchestrator summary shape and action-tab warning behavior unchanged.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.test.mjs`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`

## Cross-App Impact

- None. This stays inside `symbol-cep` hook semantics and does not affect `wedding-cep` postflight/report.

## Validation Targets

- `npm run lint:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run build:symbol`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_postflight_blank_template_policy_pilot_scope.md`

## Notes Before Execution

- Treat this as a `T1` single-app, single-context hook-policy change.
- Preserve the existing hook contract: `status` remains `success | skipped | failed`.
- A blank template means `''` or whitespace-only after trimming.
- Do not change `ActionTab` toast policy or `PostflightOrchestrator` result summary shape in this pilot.

## Implementation Note

- Updated `PasteboardInfoRule.js` so `buildPasteboardLegendPreview(...)` now treats both empty and whitespace-only templates as no-op hook input.
- The rule now also returns `''` when interpolation produces a blank-only preview, so the hook stays in `skipped` instead of calling the bridge for empty legend content.
- Added a dedicated unit test proving whitespace-only templates return `skipped` and make zero bridge calls.

## Review Gate

Scope Reviewed: `symbol-cep` postflight hook rule only, limited to `PasteboardInfoRule.js` and its unit test.
Top Risks: accidentally reclassifying valid templates as skipped, or widening the hook contract in a way that would require action-tab or orchestrator changes.
Required Fixes: none after implementation; the final patch stayed inside the existing `success | skipped | failed` rule contract.
No Blocking Findings: yes; self-review found no drift toward `wedding-cep` report UI semantics and no bridge contract changes.
Validation Rerun Needed: yes; reran `lint:symbol`, `test`, `build:symbol`, `test:smoke:symbol`, and `verify` after the baseline smoke blocker was fixed separately.

## Verification Gate

Claims Verified: whitespace-only pasteboard templates now skip hook execution instead of calling the bridge, the rule still reports normal success/failure for real templates, and the pilot stayed inside `symbol-cep/postflight/hooks`.
Evidence Run: `npm --workspace imposition-panel-cep run test`; `npm run lint:symbol`; `npm run build:symbol`; `npm run test:smoke:symbol`; `npm run verify`.
Remaining Limits: there is no dedicated smoke case for whitespace-only templates; the guard is covered by unit tests and the broader symbol smoke regression suite.
Unverified But Suspected: none.

## Postmortem

- Pilot outcome: success. The task stayed entirely inside the hook-rule slice, which is exactly the taxonomy behavior this milestone was meant to prove.
- Architecture signal: `symbol-cep/FEATURE_MAP.md` was strong enough to keep the work in `Postflight / Hooks`, with no temptation to import the `wedding-cep` postflight/report mental model.
- Validation note: Milestone 3 encountered an unrelated symbol smoke blocker during execution. That blocker was fixed in a separate receipt, then this pilot was verified again on the clean baseline.
