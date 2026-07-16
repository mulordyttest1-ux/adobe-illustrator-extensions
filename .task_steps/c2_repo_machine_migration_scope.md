## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Add a Windows machine migration kit for repo setup, diagnostics, encrypted recovery, Codex portable state, and CEP onboarding.
- Execution mode: Approved plan implemented in small slices after a verified encrypted snapshot.

## Files To Modify

- Root package metadata, CI, README, machine setup guide, Git attributes/ignore policy, and shipped template tracking.
- Root machine migration scripts and their tests.
- Active agent testing/setup references and this task's C1/C2 receipts.
- A separate local `codex-workstation-config` private-repo scaffold.

## Consumers Verified

- Root npm scripts and CI.
- Symbol, Wedding, and Toolkit live-link wrapper installation.
- Codex `CODEX_HOME` safe configuration/skill/plugin surfaces.

## Cross-App Impact

- Setup and doctor cover all three CEP apps, but no app runtime or `libs/shared` API is modified.

## Validation Targets

- Focused `node:test` coverage for machine tooling.
- `npm run verify` and Windows setup dry-run.
- Encrypted archive round-trip contract and gate checker.

## Notes Before Execution

- Pre-build AES-256 snapshot passed 7-Zip verification and has an external SHA-256 receipt.
- The public GitHub remote must not receive the unreviewed working tree.

## Review Gate

Scope Reviewed: Root machine CLIs, package/lock/CI contracts, live-link installer ownership, migration documentation, shipped template policy, the separate portable Codex repository, and the one-prompt new-machine handoff.
Top Risks: Credential leakage, incomplete worktree recovery, corrupt or overwritten archives, restore into a populated target, Windows npm invocation, junction idempotence, and machine-local Codex paths.
Required Fixes: Resolved Windows npm.cmd execution through npm-cli.js; fixed plugin-section parsing; separated excluded cache/log state from the restore status contract; allowed tracked cache deletions while rejecting live machine-data changes; streamed large Git patches to avoid child-process buffer exhaustion; refreshed timestamp-only Git index entries before recording the restore contract; added large-file secret scanning, partial archive promotion, SHA-256 verification, archive re-test, Git metadata restore guard, Windows junction idempotence coverage, and a private-repo prompt that drives the complete restore without copying credentials.
No Blocking Findings: yes; the scoped review has no remaining code blocker.
Validation Rerun Needed: yes; focused tests and full verification were rerun after the fixes.

## Verification Gate

Claims Verified: Node/npm contracts, stable doctor schema and exit behavior, setup sequencing, AES-256 archive round-trip, staged/unstaged/untracked recovery, cache/log exclusion, tracked cache deletion recovery, large-patch streaming, timestamp-only index normalization, target guards, checksum rejection, six-wrapper manifests/idempotence, portable Codex overwrite/backup/path materialization, private GitHub backup, and the one-prompt restore handoff.
Evidence Run: Node `v24.13.0`; npm `11.6.2`; GitHub CLI `2.96.0` authenticated as `mulordyttest1-ux` with `repo,workflow`; `npm run verify` exit 0 on 2026-07-16; `npm run test:machine-setup` 15/15; `npm run setup:dev -- --dry-run --codex-config C:\Projects\codex-workstation-config`; doctor exit 0 with no FAIL; `npm run check:gates -- --file .task_steps/c2_repo_machine_migration_scope.md`; post-build archive `post-build-20260716-144724.7z` passed 7-Zip test, rejected a wrong password, and matched SHA-256 `F91E03BD17694E1D24FC95C1615114D4DEA23AFD1572DEBCD6CE82DA9BB70784`; Git-aware archive `adobe-illustrator-extensions-20260716-150555.7z` passed AES archive testing and restored into a new temporary target with an exact Git status match, SHA-256 `F9EF992D4028FEE9228CB1E9EF07A1DB3DB04AFFE17BA1B3E7843DFBDC3DCC26`; private repo `mulordyttest1-ux/codex-workstation-config` is private and synchronized at commit `3f0a3cd`, whose new-machine prompt prioritizes the latest Git-aware archive.
Remaining Limits: Illustrator live smoke panels are closed; font inventory was not supplied; the current task's connector tool still returns stale private-repo authorization even though the GitHub App is installed for exactly two repositories; the pre-existing baseline has `642` untracked source/config/test files and remains intentionally uncommitted and unpushed because publishing it would violate this task's no-runtime/no-shared scope.
Unverified But Suspected: A Codex restart or fresh task should refresh the connector authorization, but authenticated `git`/`gh` already provide verified private-repo access; GitHub-hosted Ubuntu/Windows jobs cannot run until the reviewed baseline and migration kit can be published without bundling unrelated runtime work; npm audit findings remain outside this migration-tooling scope.
