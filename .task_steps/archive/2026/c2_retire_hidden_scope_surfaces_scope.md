## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Problem: `symbol-cep/.agent/workflows/SCOPE.md` and `wedding-cep/.agent/workflows/SCOPE.md` remain as hidden onboarding surfaces even though the repo has already standardized on root/scoped `AGENTS.md` plus `.agent/README.md`. Both files are legacy, redundant, and render mojibake in the current repo.
- Goal: retire those hidden `SCOPE.md` files so the repo has fewer parallel onboarding surfaces and less conflicting legacy guidance.
- Non-goals: do not rewrite workflow law, do not touch runtime docs, and do not add replacement files because the current SSOTs already exist.

## Scope Lock

- Summary: delete the two hidden legacy `SCOPE.md` files under app-local `.agent/workflows/`.
- Execution mode: docs-only cross-app cleanup; no runtime, no workflow-law changes, and no new onboarding layer.

## Files To Modify

- `symbol-cep/.agent/workflows/SCOPE.md`
- `wedding-cep/.agent/workflows/SCOPE.md`

## Consumers Verified

- `symbol-cep/.agent/workflows/SCOPE.md`
- `wedding-cep/.agent/workflows/SCOPE.md`
- `symbol-cep/AGENTS.md`
- `wedding-cep/AGENTS.md`
- `.agent/README.md`

## Cross-App Impact

- Yes, cleanup only. This removes two obsolete app-local onboarding surfaces, but changes no runtime behavior.

## Validation Targets

- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_retire_hidden_scope_surfaces_scope.md`

## Notes Before Execution

- Delete rather than rewrite; the repo already has active SSOTs for onboarding.
- Do not add compatibility notes that preserve the old files conceptually.

## Implementation Note

- Deleted `symbol-cep/.agent/workflows/SCOPE.md`.
- Deleted `wedding-cep/.agent/workflows/SCOPE.md`.
- Left `symbol-cep/AGENTS.md`, `wedding-cep/AGENTS.md`, and `.agent/README.md` as the standing onboarding surfaces without adding replacement files.

## Review Gate

Scope Reviewed: removal of two obsolete app-local onboarding files only.
Top Risks: deleting a file that still had a real consumer, or removing the files without already having a clear replacement surface in the repo.
Required Fixes: none after implementation; a repo-wide search found no consumer references beyond the files themselves, and active onboarding already lives in `AGENTS.md` plus `.agent/README.md`.
No Blocking Findings: yes; self-review found no need for replacement docs or compatibility shims.
Validation Rerun Needed: yes; reran `check:encoding` and the gate check after deleting the two files.

## Verification Gate

Claims Verified: the two hidden legacy `SCOPE.md` onboarding files are gone, and the repo now relies on the documented active surfaces instead of parallel app-local scope notes.
Evidence Run: targeted search across the repo excluding `node_modules` and `.nx` found no consumer references beyond the two files themselves; `npm run check:encoding`; `npm run check:gates -- --file .task_steps/c2_retire_hidden_scope_surfaces_scope.md`.
Remaining Limits: this cleans up hidden onboarding drift only; it does not change any runtime or workflow behavior.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was a small but high-signal cleanup because the files were redundant, hidden, and mojibake-prone, while the real onboarding SSOTs were already in place.
- Benefit: the repo now has fewer parallel onboarding surfaces and less chance that an agent reads stale hidden scope notes instead of current docs.
- Boundaries held: no runtime docs, no workflow-law rewrite, and no new onboarding layer were introduced.
