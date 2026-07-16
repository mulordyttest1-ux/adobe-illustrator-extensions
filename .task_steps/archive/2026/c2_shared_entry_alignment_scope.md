## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: yes
Cross-App Impact: yes

## Task Brief

- Problem: `libs/shared` is an elevated shared surface, but it still lacks a repo-native README front door. Routing currently depends on `libs/shared/AGENTS.md`, a hidden legacy `.agent/SCOPE.md`, and source comments inside `@shared/cep-ui`.
- Goal: create a proper shared-entry chain for `libs/shared`, point repo docs and the repo-context skill to it, and retire the hidden legacy scope note.
- Non-goals: do not change `@shared/cep-ui` runtime code, do not widen this into a shared-library redesign, and do not modify app docs beyond shared-surface routing references.

## Scope Lock

- Summary: add `libs/shared/README.md`, align `libs/shared/AGENTS.md`, update root navigation to include the shared front door, sync the thin repo-context skill, and delete the retired `libs/shared/.agent/SCOPE.md`.
- Execution mode: docs-only shared-surface cleanup; no app runtime, no package API, and no workflow-law changes.

## Files To Modify

- `libs/shared/README.md`
- `libs/shared/AGENTS.md`
- `README.md`
- `C:/Users/Admin/.codex/skills/adobe-cep-repo-context/SKILL.md`
- `libs/shared/.agent/SCOPE.md`

## Consumers Verified

- `AGENT_OPERATING_MODEL.md`
- `CODEOWNERS`
- `libs/shared/cep-ui/package.json`
- `libs/shared/cep-ui/src/index.js`

## Cross-App Impact

- Yes, agent-facing only. This milestone clarifies routing for an elevated shared surface that affects both apps, but it changes no runtime behavior.

## Validation Targets

- `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`
- `npm run check:encoding`
- one fresh-agent forward-test with `$adobe-cep-repo-context` on a pure `@shared/cep-ui` task
- `npm run check:gates -- --file .task_steps/c2_shared_entry_alignment_scope.md`

## Notes Before Execution

- Keep shared facts in repo docs, not in source comments or hidden scope notes.
- Keep the repo-context skill thin; route to `libs/shared` docs instead of package internals.
- Retire `libs/shared/.agent/SCOPE.md` rather than keeping two parallel shared-entry surfaces.

## Implementation Note

- Added `libs/shared/README.md` as the repo-native front door for the shared CEP UI surface.
- Updated `libs/shared/AGENTS.md` so it now points readers to that README before entering package code.
- Added `libs/shared/README.md` to the root `README.md` navigation list so the shared surface is visible alongside the two app-level feature maps.
- Updated `adobe-cep-repo-context` so fresh agents open the shared README instead of relying on source comments or hidden scope notes.
- Retired `libs/shared/.agent/SCOPE.md` to remove a stale parallel entry surface.

## Review Gate

Scope Reviewed: `libs/shared` docs/routing only, including root README navigation and the thin repo-context skill.
Top Risks: leaving two active shared-entry surfaces, over-documenting package internals in the skill, or implying that docs-only cleanup is equivalent to shared-runtime validation.
Required Fixes: none after implementation; the final wording keeps repo facts in `libs/shared/README.md`, keeps the skill thin, and removes the retired hidden scope note instead of preserving both paths.
No Blocking Findings: yes; self-review found no runtime/API changes and no conflict with root `AGENTS.md`, `AGENT_OPERATING_MODEL.md`, or the current `@shared/cep-ui` public surface.
Validation Rerun Needed: yes; reran repo-context skill validation, repo encoding validation, performed a fresh-agent forward-test on a pure shared-UI task, and then reran the gate check.

## Verification Gate

Claims Verified: `libs/shared` now has a repo-native README front door, the root navigation advertises that shared surface, the repo-context skill routes to it, and a fresh agent chooses `libs/shared` as the owner for a pure shared-UI task.
Evidence Run: `python C:/Users/Admin/.codex/skills/.system/skill-creator/scripts/quick_validate.py C:/Users/Admin/.codex/skills/adobe-cep-repo-context`; `npm run check:encoding`; fresh-agent forward-test with `$adobe-cep-repo-context` on `Adjust a shared CEP toast helper without adding any app-specific logic.`; `npm run check:gates -- --file .task_steps/c2_shared_entry_alignment_scope.md`.
Remaining Limits: this milestone improves routing and discoverability only; it does not rerun the full shared cross-app runtime lane because no shared product code changed in this round.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the last obvious shared-surface onboarding gap after `symbol-cep`, `wedding-cep`, and `@wedding/domain` already had repo-native front doors.
- Benefit: fresh agents now have a single visible route into `libs/shared` instead of splitting attention between `AGENTS.md`, source comments, and a hidden `.agent/SCOPE.md`.
- Forward-test signal: the fresh agent opened `libs/shared/AGENTS.md` and `libs/shared/README.md` first and correctly kept the task in the shared surface.
- Boundaries held: no shared runtime code, no package API, no app docs rewrite, and no workflow-law changes.
