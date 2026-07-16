# C2: AI-native two-repository migration scope and gates

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: normalize the current verified baseline, split the private developer control plane, and add an immutable on-demand devkit contract to the public product.
- Execution mode: reviewed commits by bounded surface; no bulk snapshot commit and no product runtime changes caused by the migration itself.

## Files To Modify

- Product root governance, package commands, CI, `.specify`, `.agents/skills`, `specs`, machine prompt, devkit lock, and repository tooling scripts/tests.
- Private devkit configuration, manifests, PowerShell setup/doctor/install/backup/restore, WinGet configuration, tests and docs.
- Existing verified local product work is committed separately by `wedding`, `symbol`, `toolkit/shared`, and repository-tooling surfaces before the architecture commit.

## Consumers Verified

- Wedding, Symbol and Toolkit build/test/lint commands.
- Public CI with no private devkit checkout.
- Codex agent discovery and Spec Kit integration status.
- Windows machine bootstrap, six CEP wrappers, backup/restore and doctor JSON.

## Cross-App Impact

- All apps consume root package commands, CI, agent rules and CEP link installation; runtime implementations remain unchanged by the architecture slice.

## Validation Targets

- `npm run verify`
- `npm run test:machine-setup`
- devkit PowerShell syntax/unit/integration checks
- clean clone and pinned sibling devkit matrix
- `specify integration status --json`
- `npm run check:gates -- --file .task_steps/c2_repo_ai_native_two_repo_scope.md`

## Notes Before Execution

- AES archive `adobe-illustrator-extensions-20260716-151116.7z` has a matching SHA-256 and no repository file is newer than the archive.
- Current workstation state passed `npm run verify` before baseline commits.
- GitHub CLI browser/connector authentication is distinct from CLI authentication; `gh auth status` is authoritative for private clone/publish operations.

## Review Gate

Scope Reviewed: pending
Top Risks: pending
Required Fixes: pending
No Blocking Findings: pending
Validation Rerun Needed: pending

## Verification Gate

Claims Verified: pending
Evidence Run: pending
Remaining Limits: pending
Unverified But Suspected: pending
