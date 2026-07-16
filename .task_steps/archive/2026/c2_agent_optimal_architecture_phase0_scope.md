## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: the repo has improved routing and local public seams, but it still lacks one explicit architecture law for how future refactors should classify modules and which bounded contexts should be upgraded next. Without that, future cleanup can drift back into file-level work instead of context-level outcomes.
- Goal: codify an agent-optimal module taxonomy, lock the `v2 islands in-place` migration strategy in an ADR, and align both app architecture docs plus the operating model to that direction.
- Non-goals: do not move files, do not change runtime behavior, do not update `FEATURE_MAP.md`, and do not start `Document Sync V2` in this phase.

## Scope Lock

- Summary: add one ADR plus architecture/governance doc updates so future runtime work follows explicit module taxonomy and migration priorities.
- Execution mode: docs and governance only; no import-graph, runtime, or filesystem-layout changes.

## Files To Modify

- `adr/0004-agent-optimal-architecture.md`
- `wedding-cep/ARCHITECTURE.md`
- `symbol-cep/ARCHITECTURE.md`
- `AGENT_OPERATING_MODEL.md`
- `.task_steps/c2_agent_optimal_architecture_phase0_scope.md`

## Consumers Verified

- `AGENTS.md`
- `wedding-cep/FEATURE_MAP.md`
- `symbol-cep/FEATURE_MAP.md`
- `adr/0001-agent-operating-model.md`
- `adr/0002-bounded-context-ownership.md`
- `adr/0003-risk-tiers-and-gates.md`

## Cross-App Impact

- Yes, governance-only. This locks a shared architecture direction used by both apps and future continuation routing.
- No runtime or product behavior changes.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_agent_optimal_architecture_phase0_scope.md`

## Notes Before Execution

- Keep the change repo-native and docs-only.
- Do not touch `FEATURE_MAP.md` in this phase.
- Align any existing “next phase” guidance so the docs do not carry two competing directions at once.

## Implementation Note

- Added `adr/0004-agent-optimal-architecture.md` to lock the long-term direction as `v2 islands in-place` instead of broad cleanup or parallel app rewrites.
- Updated both app architecture docs with one shared module taxonomy: `Facade`, `Service / Support`, `Policy / Domain`, `Adapter`, and `Config / Data`.
- Added migration matrices to both architecture docs so future runtime work can see which contexts are already facade-ready, which context is the next island, and which surfaces remain trigger-only.
- Added `Architecture Upgrade Rules` to `AGENT_OPERATING_MODEL.md` so future continuation rounds prioritize bounded-context outcomes over file-level symmetry.

## Review Gate

Scope Reviewed: one ADR plus repo-wide architecture/governance docs across both apps; no runtime source, host boundary, or feature map changes.
Top Risks: leaving conflicting “next phase” guidance in app docs, defining taxonomy too loosely to guide future work, or under-scoping the cross-app impact of the new architecture direction.
Required Fixes: align the old next-phase sections with the new migration matrix, keep the taxonomy small and explicit, and avoid expanding this phase into file moves or runtime edits.
No Blocking Findings: yes; the final patch stays docs-only, preserves existing runtime truth, and gives future refactors a stronger decision framework without changing behavior.
Validation Rerun Needed: yes; reran encoding, repo verify, and gate validation after all docs were updated together.

## Verification Gate

Claims Verified: the repo now has a single agent-optimal architecture ADR, both app architecture docs define the same module taxonomy, both apps expose a migration matrix, and the operating model now forbids speculative file-level cleanup as the default architecture path.
Evidence Run: `npm run check:encoding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_agent_optimal_architecture_phase0_scope.md`.
Remaining Limits: `FEATURE_MAP.md` was intentionally left unchanged in this phase, so the new migration direction is documented but not yet reflected in route-level maps.
Unverified But Suspected: none.

## Postmortem

- Outcome: success. Phase 0 now acts as the repo SSOT for how future agent-facing refactors should be classified and sequenced.
- Architectural effect: future runtime work can target bounded-context islands instead of continuing ad-hoc support extraction.
- Next default milestone: `wedding-cep / Document Sync V2`, as long as no higher-priority runtime bug or gate blocker appears first.
