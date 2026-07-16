## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: the retrospective now makes it clear when there is no active engineering milestone left, but `AGENT_OPERATING_MODEL.md` does not yet promote that stop/reopen behavior into the standing operating model.
- Goal: add a small continuation rule section to `AGENT_OPERATING_MODEL.md` so future `tiếp tục` commands have an explicit source-of-truth for when to proceed, when to defer, and when to stop without inventing speculative work.
- Non-goals: do not change workflow law in `AGENTS.md`, do not reopen deferred engineering items, and do not change runtime code.

## Scope Lock

- Summary: Promote the continuation stop/reopen rules from the pilot retrospective into `AGENT_OPERATING_MODEL.md`.
- Execution mode: docs-only governance refinement; no runtime, CI policy, or CODEOWNERS changes.

## Files To Modify

- `AGENT_OPERATING_MODEL.md`

## Consumers Verified

- `.task_steps/agent_operating_model_pilot_retrospective.md`
- `AGENTS.md`
- `.agent/workflows/core_protocol.md`

## Cross-App Impact

- Yes, governance-only. This affects future continuation routing for both apps but changes no runtime behavior.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_agent_operating_model_continuation_rules_scope.md`

## Notes Before Execution

- Keep this round limited to `AGENT_OPERATING_MODEL.md`.
- Describe continuation behavior in terms of active, deferred, blocked, and completed milestones.
- Do not promote speculative hotspot work into an active backlog item.

## Implementation Note

- Added a `Continuation Routing` section to `AGENT_OPERATING_MODEL.md`.
- The new section defines the order for repeated `tiếp tục` commands: active milestones first, then deferred items only after their trigger criteria are satisfied, then blocked items only after their external blocker is resolved.
- It also codifies the stop condition: if no active engineering milestone remains, do not invent new work; close cleanly and wait for a new product/runtime trigger or an explicitly approved governance milestone.

## Review Gate

Scope Reviewed: `AGENT_OPERATING_MODEL.md` only, limited to operating-model guidance for continuation routing and stop/reopen behavior.
Top Risks: accidentally turning retrospective guidance into contradictory workflow law, or wording the stop condition so aggressively that it blocks legitimate future governance work.
Required Fixes: none after implementation; the new section stays below workflow law, references active/deferred/blocked states clearly, and preserves room for explicitly approved governance milestones.
No Blocking Findings: yes; self-review found no conflict with `AGENTS.md` or the cleaned pilot retrospective.
Validation Rerun Needed: yes; reran `check:encoding`, `verify`, and the gate check after updating the operating-model doc.

## Verification Gate

Claims Verified: `AGENT_OPERATING_MODEL.md` now explicitly defines continuation routing, reopen criteria by status, and the stop condition when no active engineering milestone remains.
Evidence Run: `npm run check:encoding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_agent_operating_model_continuation_rules_scope.md`.
Remaining Limits: this rule does not resolve blocked owner identity or force new triggers into existence; it only prevents speculative continuation when those conditions are missing.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest next governance step after backlog hygiene because it moved a useful operational rule out of retrospective history and into the standing control-plane doc.
- Benefit: future `tiếp tục` commands now have a first-class repo rule for when to proceed, when to defer, and when to stop.
- Boundaries held: no runtime code, no workflow-law files, and no `CODEOWNERS` guessing were touched.
