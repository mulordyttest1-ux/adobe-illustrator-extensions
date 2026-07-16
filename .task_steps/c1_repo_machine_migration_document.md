# C1: Machine Migration Kit

# Pass A - Direction Brief

## Context

- Task: Make the Windows developer workstation reproducible across machines.
- App or module: Root tooling, repository governance, Codex portable state, and CEP installation.
- Trigger: The current workstation contains unpushed and uncommitted work plus machine-local Codex and Adobe state.

## Normalized Request Receipt

- Intent: Feature/tooling implementation.
- Route: `/build` after an approved `/plan`.
- Goal: Restore repo, Codex, and Adobe CEP development on a new Windows machine using documented and testable commands.
- Success Criteria: Encrypted backup/restore, one-command setup, doctor output, Node/CI alignment, safe Codex config, and verification evidence.
- Scope Guess: Root package scripts, machine tooling, CI, setup documentation, active agent docs, and the shipped Illustrator template.
- Constraints: Do not modify app runtime or `libs/shared`; never copy credentials; do not push the dirty worktree to the public repository.
- Unknowns: None remaining after plan approval.
- Approval Needed: No; direction approved by the user.

## Problem Restatement

- Replace machine-specific tribal knowledge with a portable, security-conscious setup and recovery contract.

## Options

### Option 1

- Summary: Documentation-only checklist.
- Tradeoffs: Low maintenance, but manual drift and weak recovery evidence.

### Option 2

- Summary: Fully automate application installation, credentials, fonts, and Adobe state.
- Tradeoffs: High privilege, licensing, and credential risk.

### Option 3

- Summary: Hybrid scripts for deterministic repo/CEP work plus doctor-guided manual steps for Adobe, fonts, and authentication.
- Tradeoffs: Requires a small tooling surface and explicit manual acceptance.

## Best Practices

- Keep reviewed code in Git and unclassified/local assets in encrypted backup storage.
- Recreate dependencies and CEP links from manifests and scripts.
- Version safe Codex preferences and skills separately from local authentication state.
- Verify recovery through round-trip tests instead of assuming archives are usable.

## Anti-Patterns

- Pushing an unreviewed worktree to a public remote.
- Copying `auth.json`, `.env`, session databases, caches, or connector credentials.
- Treating a disk image as the only source of truth.
- Automatically installing licensed applications or fonts.

## Edge Cases

- The initial worktree has hundreds of staged, unstaged, and untracked entries.
- The current machine contains legacy CEP wrappers that the active installer does not own.
- Codex config contains absolute and bundled machine-local paths.
- The required Illustrator template was previously untracked.

## Counterfactuals

- A checklist alone would not prove staged/unstaged recovery.
- Maximum automation would widen permissions without improving credential portability.
- A Git bundle alone would omit index, worktree, and untracked state.

## Chosen Direction

- Implement one-command setup plus a structured doctor, encrypted Git-aware backup/restore, a private Codex config scaffold, and manual runtime acceptance for Illustrator 2025/2026.

## Why Other Options Were Rejected

- Documentation-only recovery is too fragile for the current repo state.
- Full machine automation crosses licensing, credential, and host-application boundaries.

## Approval Checkpoint

- Status: approved
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- Root package metadata, CI, setup documentation, and machine migration CLIs.
- Active `.agent` documentation and task gate artifacts.
- Private Codex portable-config repository scaffold outside the public product repo.

## Consumers To Verify

- Root `npm run verify` and `test:repo-tooling`.
- Symbol, Wedding, and Toolkit live-link wrappers.
- Codex app/CLI `CODEX_HOME` layout without authentication material.

## Execution Slices

### Slice 1

- Goal: Protect current work and lock task scope.
- Files: C1/C2 artifacts; encrypted external snapshot.
- Validation: 7-Zip archive test and SHA-256 receipt.

### Slice 2

- Goal: Implement setup, doctor, backup, restore, and tests.
- Files: Root `scripts/` and `package.json`.
- Validation: Node unit/integration tests and dry-run command sequencing.

### Slice 3

- Goal: Align Node/CI/docs, retire the legacy symlink path, and scaffold safe Codex state.
- Files: Root docs/config/CI plus private config repo.
- Validation: `npm run verify`, Windows-oriented checks, review, verification, and gate receipt.

## Validation Plan

- Run focused machine-tooling tests, root verification, encoding/repo hygiene, and gate enforcement.
- Record Illustrator smoke testing as a manual limit unless both host panels are open.

## Open Risks

- The current dirty worktree can obscure ownership of overlapping root files; preserve existing edits and report the final scoped diff.
- The private Codex remote is created and pushed, but the in-thread GitHub connector may retain stale authorization until Codex refreshes; authenticated `git` and `gh` remain the verified fallback.

`C1-RESEARCH: DEFINE=1 | SEARCH=6 | BEST=4 | ANTI=4 | EDGE=4 | COUNTER=3 | ALIGN=aligned`
