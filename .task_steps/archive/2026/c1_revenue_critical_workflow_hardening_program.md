# C1: Revenue-Critical Workflow Hardening Program

# Pass A - Direction Brief

## Context

- Task: Launch a repo-wide hardening program for the workflows where a bug is most likely to cost the operator money.
- App or module: `wedding-cep` and `symbol-cep`, routed by bounded workflow rather than by generic cleanup.
- Trigger: The repo has already crossed the "agent-ready" threshold, so the next valuable investment is proactive workflow shielding instead of more speculative architecture work.

## Normalized Request Receipt

- Intent: implement the approved hardening program and turn it into repo-native artifacts plus the first high-ROI shield.
- Route: `/build` for the program control plane, then `audit -> /build` on the first workflow wave.
- Goal: move the repo into a workflow-hardening loop where every new round is tied to a revenue-critical operator path.
- Success Criteria:
  - one root C1 exists for the program itself
  - the program defines wave order, artifact naming, and stop-lines
  - Wave 1 is opened immediately instead of leaving the program at docs-only
  - no shared/domain/host/bridge contract change is introduced
- Scope Guess:
  - `.task_steps/` program and wave artifacts
  - `wedding-cep` first, focused on `Document Sync`
  - smoke harness only if Wave 1 converges on a coverage gap instead of a runtime bug
- Constraints:
  - keep `wedding` ahead of `symbol` until the two highest-blast wedding workflows are shielded
  - use multi-agent only as read-only challenger/skeptic support
  - keep one writer
  - do not turn this into another architecture initiative
- Unknowns:
  - whether Wave 1 will find a verified runtime defect or only a shield gap
  - whether the first hardening round can stay entirely inside smoke/test surfaces
- Approval Needed: none; the user explicitly approved and requested implementation of this program.

## Problem Restatement

- The repo is structurally ready enough; the remaining risk is no longer "bad architecture" but "high-cost workflows without enough real shields."
- If those workflows fail while the user is doing paid work, the repo still passes architecture discipline while losing money in production use.
- The right move is to harden workflows in revenue order, not to continue broad cleanup.

## Options

### Option 1

- Summary: create only a top-level program note and wait for the user to choose the next workflow manually.
- Tradeoffs: lowest execution risk, but leaves the highest-risk workflow still under-shielded.

### Option 2

- Summary: create the program control plane and execute Wave 1 immediately using the approved audit-first loop.
- Tradeoffs: more work in one turn, but aligns the program with the user goal of proactive hardening.

### Option 3

- Summary: skip the control-plane docs and jump straight into ad-hoc fixes.
- Tradeoffs: faster short-term code motion, but loses the workflow order and stop-lines the user explicitly asked for.

## Best Practices

- Rank by blast radius, frequency, and recoverability instead of by file size.
- Tie each wave to one operator workflow with a named artifact.
- Use challenger/skeptic read-only passes before opening a code-changing C2.
- Prefer smoke and regression shields when no verified runtime bug exists yet.

## Anti-Patterns

- Opening generic "continue" rounds with no workflow target.
- Reopening `SchemaInjector`, `config_pane_renderer`, or host/bridge work without a trigger.
- Treating every coverage gap as a logic bug.
- Using multiple writers for small app-local hardening rounds.

## Edge Cases

- A wave can complete with `shielded` status even when no runtime bug was found.
- The highest-value next move can be test/smoke hardening instead of a product-logic fix.
- A wave must stop and route back to `/plan` if it touches shared, domain, host, or bridge contract surfaces.

## Counterfactuals

- If `Document Sync` already had a dedicated smoke lane, Wave 1 would likely move directly to `Template Authoring`.
- If a verified `Document Sync` defect surfaced during the audit, the first C2 would be a `/fix` rather than a coverage `/build`.
- If `symbol` had the higher blast-radius workflow, the roadmap would not stay wedding-first.

## Chosen Direction

- Use Option 2.
- Create one root program C1.
- Open Wave 1 immediately as `wedding-cep / Document Sync`.
- If Wave 1 finds no verified bug, promote the concrete shield gap into a focused C2 build.

## Why Other Options Were Rejected

- Option 1 was rejected because the user explicitly does not want to be the final bug detector on paid workflows.
- Option 3 was rejected because ad-hoc execution would lose ordering, artifact discipline, and stop-lines.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_revenue_critical_workflow_hardening_program.md`
- `.task_steps/c1_wedding_document_sync_revenue_hardening_audit.md`
- `.task_steps/c2_wedding_document_sync_smoke_parity_scope.md` if Wave 1 confirms a shield gap instead of a runtime bug

## Consumers To Verify

- `AGENT_OPERATING_MODEL.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/PROJECT_STATUS.md`

## Execution Slices

### Slice 1

- Goal: establish the repo-native control plane for revenue-critical workflow hardening.
- Files:
  - `.task_steps/c1_revenue_critical_workflow_hardening_program.md`
- Validation:
  - docs-only inspection

### Slice 2

- Goal: execute Wave 1 as an evidence-first audit for `wedding-cep / Document Sync`.
- Files:
  - `.task_steps/c1_wedding_document_sync_revenue_hardening_audit.md`
- Validation:
  - use current `wedding` baseline plus code-path inspection

### Slice 3

- Goal: if Wave 1 exposes a shield gap rather than a bug, add the smallest app-local smoke lane that protects the write path.
- Files:
  - `.task_steps/c2_wedding_document_sync_smoke_parity_scope.md`
  - `wedding-cep/cep/debug_scripts/test_smoke.cjs`
  - `wedding-cep/cep/debug_scripts/smoke_suites/document_sync_smoke_tests.cjs`
- Validation:
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`
  - `npm run verify`
  - `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_smoke_parity_scope.md`

## Validation Plan

- Keep the root program artifact docs-only.
- Use the full `wedding` lane for any Wave 1 code change.
- Leave future waves queued until Wave 1 reaches `fixed` or `shielded`.

## Open Risks

- The worktree is already heavily dirty, so this program kickoff must keep its write scope narrow.
- `Document Sync` may still expose a true bug once a dedicated smoke lane exists.
- `Template Authoring` and `symbol` hardening are intentionally queued behind Wave 1 and are not yet shielded by this turn.
