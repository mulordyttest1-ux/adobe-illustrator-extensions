# Agent Operating Model Pilot Retrospective

Date: 2026-03-26
Scope: Milestones 1-4 of the continuation protocol pilot

## Pilot Outcomes

- Milestone 1 `wedding-cep / Postflight`
  - Outcome: pass
  - Change type: T1 presentation-only
  - Signal: feature map routed directly to the correct postflight widget seam; no drift into validator or action layers
- Milestone 2 `wedding-cep / Document Sync`
  - Outcome: pass
  - Change type: T1 local policy
  - Signal: action-layer no-op handling was the correct seam; no need to widen `runUpdateDocument` result shape
- Milestone 3 `symbol-cep / Postflight / Hooks`
  - Outcome: pass
  - Change type: T1 hook-rule policy
  - Signal: taxonomy held; the work stayed inside hook semantics and did not drift into a wedding-style report model
- Blocking incident during Milestone 3
  - Outcome: fixed
  - Change type: separate `/fix`
  - Signal: continuation protocol worked as intended when a stable unrelated smoke failure appeared in `symbol-cep`

## What Worked

- `FEATURE_MAP.md` was enough to get to the correct app/context quickly in all three pilots.
- `1 writer + supporting readers` remained the right default.
- C2 receipts with explicit scope lock prevented opportunistic expansion.
- The existing validation lanes were strong enough to catch both in-scope regressions and unrelated blockers.

## Friction Observed

- `symbol-cep` smoke exposed a stable unrelated config-pane layout bug during a hook pilot. This proved the need to route baseline blockers into their own `/fix` receipt instead of polluting the original pilot artifact.
- Some `T1` tasks can be solved in a nearby policy seam without expanding internal result contracts. That decision should be explicit in scope lock notes.

## Governance Updates Justified

- Keep `.agent` and repo docs as the control plane; the pilot did not expose a need to move governance into optional skills.
- Add an explicit operating-model rule: unrelated failing validation lanes discovered during a pilot become separate `/fix` tasks before the pilot can close.
- Keep the writer limit at `1` for now. The pilot produced no evidence strong enough to justify `2 writers`.

## Recommended Next Backlog

### Deferred

- Hotspot candidates gated by trigger
  - `wedding-cep` broader `Document Sync` coordinators
    - Candidate surfaces: `StrategyOrchestrator.js`, `logic/pipeline/assembler.js`
    - Reopen only after another real policy, bug, or behavior change lands in the same `scan/update` seam.
  - `wedding-cep` `Platform / Host`
    - Candidate surfaces: `infrastructure/bridge.js`, `infrastructure/cepHost.js`
    - Reopen only after a stable host bug, recurring smoke flake, or boundary confusion appears.
  - `wedding-cep` `Postflight` logic seam
    - Candidate surface: `logic/validators/PostflightValidator.js`
    - Reopen only after a real finding-quality issue or rule-duplication trigger appears.
  - `wedding-cep` `Template Authoring` logic seam
    - Candidate surface: `logic/schema/SchemaInjector.js`
    - Reopen only after an inject/clone bug or real test-pain trigger appears.
  - `symbol-cep` compact config-pane layout rules
    - Reopen only after another copy/layout bug appears in the compact config rows.

### Explicitly Out For Now

- Do not reopen these surfaces only because they are large:
  - `wedding-cep/cep/js/components/schema-tab/schemaTabConfig.js`
  - `wedding-cep/cep/js/components/postflight/widgetChrome.js`
  - `wedding-cep/cep/js/components/date-grid/dateGridTestUtils.js`
  - `wedding-cep/cep/js/CSInterface.js`

### Blocked

- Ownership upgrades
  - Replace placeholder owner handles in `CODEOWNERS` with real team or context owners.
  - Blocked until real owner identity is available outside local repo state.

### Completed Follow-Ups

- Coverage upgrades
  - Dedicated smoke coverage for the `symbol-cep` dense-label wrap contract is already present in `symbol-cep/cep/debug_scripts/test_smoke.cjs`.
  - A symbol smoke/debug receipt for whitespace-only pasteboard templates is complete in `.task_steps/c2_symbol_postflight_whitespace_template_smoke_scope.md`.
- `wedding-cep` schema-tab smoke closeout
  - `c2_wedding_schema_tab_components_support_scope.md` is now fully closed after the normal wedding smoke lane passed.

### Active Milestones

- None. No active engineering milestone remains from this retrospective.

## Decision

- The operating model baseline is viable.
- Continue with `1 writer + supporting readers`.
- Keep moving by milestone, not by broad initiative.
- Future continuation must score candidates before starting them and stop when no candidate reaches the threshold.
- Future `tiếp tục` routing should ignore completed follow-ups, skip blocked ownership work, and reopen deferred hotspot items only when their trigger criteria are met.
