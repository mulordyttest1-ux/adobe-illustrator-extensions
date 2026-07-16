## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: `libs/wedding/domain` now has local front-door docs, but the root intake surfaces still do not treat it as a first-class routed surface. Root navigation, the operating model, and issue forms still bias toward app contexts plus a generic shared bucket.
- Goal: make `libs/wedding/domain` visible at the root intake layer so maintainers and agents can select it explicitly in repo navigation and issue intake.
- Non-goals: do not change runtime code, do not reopen app-local docs, and do not redesign issue taxonomy beyond the missing shared-domain route.

## Scope Lock

- Summary: update root README navigation, AGENT_OPERATING_MODEL bounded-context/intake wording, and both issue templates so `libs/wedding/domain` is explicitly routable.
- Execution mode: docs-only cross-app intake cleanup; no runtime, no workflow-law, and no package changes.

## Files To Modify

- `README.md`
- `AGENT_OPERATING_MODEL.md`
- `.github/ISSUE_TEMPLATE/agent-task.yml`
- `.github/ISSUE_TEMPLATE/bug.yml`

## Consumers Verified

- `libs/wedding/domain/README.md`
- `libs/wedding/domain/AGENTS.md`
- `.agent/README.md`
- `CODEOWNERS`

## Cross-App Impact

- Yes, governance/intake only. This affects root routing and issue intake for a shared surface, but changes no runtime behavior.

## Validation Targets

- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_shared_domain_route_completion_scope.md`

## Notes Before Execution

- Keep the change limited to root/front-door surfaces.
- Preserve the existing app bounded contexts.
- Add `libs/wedding/domain` as an explicit routed shared surface, not as a replacement for the generic shared bucket.

## Implementation Note

- Added `libs/wedding/domain/AGENTS.md` to the root README governance list and `libs/wedding/domain/README.md` to root feature navigation.
- Extended `AGENT_OPERATING_MODEL.md` so shared package READMEs are part of repo facts and `Shared / Wedding Domain` is now an explicit routed surface alongside the app contexts.
- Added `shared / Wedding Domain` as an intake option in both `agent-task.yml` and `bug.yml`.
- Kept the generic `shared / Cross-app` option in place for work that does not belong specifically to `libs/wedding/domain`.

## Review Gate

Scope Reviewed: root/front-door governance surfaces only: `README.md`, `AGENT_OPERATING_MODEL.md`, and the two issue templates.
Top Risks: confusing `Shared / Wedding Domain` with the broader `shared / Cross-app` bucket, or widening the change into a larger governance taxonomy rewrite.
Required Fixes: none after implementation; the final wording keeps existing app contexts intact and adds only the missing explicit shared-domain route.
No Blocking Findings: yes; self-review found no contradiction with `libs/wedding/domain/README.md`, `libs/wedding/domain/AGENTS.md`, `.agent/README.md`, or `CODEOWNERS`.
Validation Rerun Needed: yes; reran `check:encoding` and the gate check after updating the receipt and root intake surfaces.

## Verification Gate

Claims Verified: root navigation now exposes `libs/wedding/domain` as a first-class shared surface, the operating model names it explicitly, and issue intake can now select it directly instead of collapsing it into a generic shared bucket.
Evidence Run: `npm run check:encoding`; `npm run check:gates -- --file .task_steps/c2_shared_domain_route_completion_scope.md`.
Remaining Limits: this milestone updates intake and navigation only; it does not change skill routing or rerun a fresh-agent forward-test because the package and skill front door were already validated in the previous milestone.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the next smallest useful cleanup because the local shared-domain front door already existed, but root intake still hid it behind generic shared wording.
- Benefit: repo-level routing and issue intake now match the actual package boundaries and ownership model more closely.
- Boundaries held: no runtime code, no app docs rewrite, no issue-workflow redesign beyond the missing shared-domain route.
