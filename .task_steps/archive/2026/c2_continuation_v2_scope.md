## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: the repo already has continuation routing and stop/reopen rules, but it does not yet define a quality threshold for choosing the next `tiếp tục` task. After several successful cleanup rounds, this makes it too easy to drift into low-ROI support extraction.
- Goal: codify a continuation rubric and stop-line in the standing operating model, refresh the current deferred backlog to match that rubric, and close the still-open `SchemaTabComponents` receipt once smoke is available again.
- Non-goals: do not open a new runtime milestone, do not create speculative backlog beyond the current deferred candidates, and do not change workflow law in `AGENTS.md`.

## Scope Lock

- Summary: add continuation scoring/stop-line guidance to `AGENT_OPERATING_MODEL.md`, align the live retrospective backlog with the new rubric, and close the pending schema-tab receipt after rerunning smoke.
- Execution mode: governance and receipt maintenance only; no runtime code changes.

## Files To Modify

- `AGENT_OPERATING_MODEL.md`
- `.task_steps/agent_operating_model_pilot_retrospective.md`
- `.task_steps/c2_wedding_schema_tab_components_support_scope.md`
- `.task_steps/c2_continuation_v2_scope.md`

## Consumers Verified

- `AGENTS.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`
- `.task_steps/c2_wedding_schema_tab_components_support_scope.md`

## Cross-App Impact

- Yes, governance-only. This changes how future `tiếp tục` commands choose or reject work across the repo.
- No runtime behavior or public product behavior changes.

## Validation Targets

- `npm.cmd run test:smoke:wedding`
- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_continuation_v2_scope.md`

## Notes Before Execution

- Close the open `wedding-cep` receipt before promoting any new continuation guidance.
- Keep the new rubric strict enough to stop speculative cleanup.
- Keep deferred backlog items trigger-based; do not silently reactivate them.

## Implementation Note

- Added a `Continuation V2 Guardrails` section to `AGENT_OPERATING_MODEL.md` with an explicit scoring rubric, stop-line, support-extraction rule, and the requirement to close open validation first.
- Updated the pilot retrospective backlog so the deferred items now match the current runtime priorities and the `SchemaTabComponents` smoke closeout is marked completed.
- Reran the `wedding-cep` smoke lane and updated `c2_wedding_schema_tab_components_support_scope.md` from “smoke blocked” to “fully closed”.

## Review Gate

Scope Reviewed: continuation routing policy in the standing operating model, the live deferred backlog, and the closeout state of the last open `wedding-cep` receipt.
Top Risks: making the rubric too loose so speculative cleanup still slips through; making it too strict so legitimate runtime follow-ups never reopen; leaving the old schema-tab receipt in a half-closed state after smoke became available.
Required Fixes: ensure the rubric uses a hard threshold, keep reopen criteria explicit and trigger-based, and update the schema-tab receipt with the actual smoke result instead of leaving a stale blocked note.
No Blocking Findings: yes; the new policy stays below workflow law, preserves existing escalation rules, and reduces continuation drift instead of widening it.
Validation Rerun Needed: yes; reran the pending wedding smoke lane first, then repo-level encoding/verify and gate validation.

## Verification Gate

Claims Verified: the repo now has an explicit anti-drift continuation rubric; the live deferred backlog matches that rubric; and the last open `wedding-cep` receipt is fully closed after smoke passed.
Evidence Run: `npm.cmd run test:smoke:wedding`; `npm run check:encoding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_continuation_v2_scope.md`.
Remaining Limits: this round does not create a new active engineering milestone on purpose; if no future candidate reaches the rubric threshold, the correct behavior is to stop.
Unverified But Suspected: none.
