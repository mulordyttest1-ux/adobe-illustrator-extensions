# C2: AI-native two-repository migration scope and gates

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: yes
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

Scope Reviewed: Public product control-plane removal, official Spec Kit integration, immutable devkit lock/resolver, Windows bootstrap/setup/doctor/proxies, CI, tests, docs, and private devkit v1.0.0 release; product runtime and libs/shared behavior were excluded.
Top Risks: Moving private workflow history without loss; following a mutable or malformed devkit reference; overwriting a dirty sibling; accidentally coupling public CI to private access; leaking machine state or adding large/generated binaries; remapping the operator's active CEP wrappers during review.
Required Fixes: Added full lock schema validation and missing-tag fetch; fixed inline proxy argument forwarding; enforced 10 MiB size plus credential/cache/build/log/backup and binary allowlist hygiene; enforced LF for root dotfiles on Windows; preserved active CEP links on the operator's real worktree; replaced two Symbol architecture-test reads that hard-coded the old C:/Projects checkout with module-relative URLs after Ubuntu CI exposed the false Windows-local pass.
No Blocking Findings: yes, after targeted fixes and validation reruns.
Validation Rerun Needed: yes; targeted contract tests, full verify, clean-clone verify, doctor, Spec Kit status, PowerShell parsing, and current-workstation doctor were rerun.

## Verification Gate

Claims Verified: Private devkit repository is renamed and private; v1.0.0 is released at d75428b43f2aaa96b1f438193f3e62d111be6be9; product lock pins that tag and SHA; ensure handles missing/correct/wrong-clean/dirty states; public clean clone installs and verifies without private access; doctor schema and exit behavior are stable; clean checkout is 8.253 MiB; current workstation has no required doctor failures.
Evidence Run: Devkit CI PASS and local tests PASS before release; `specify integration status --json` status ok with zero missing/modified managed files; PowerShell parser PASS for seven product/Spec Kit scripts; `npm run test:machine-setup` 19/19 PASS; final repository tooling lane 27/27 PASS; `npm run verify` PASS locally and from a separate clean clone with tracked=687/untracked=0; clean-clone `npm run doctor:repo -- --json` PASS; clean-clone `npm run devkit:ensure -- --dry-run --json` WARN/exit 0 without private checkout; pinned local ensure PASS; combined doctor on the operator's real worktree WARN/exit 0 with no FAIL; GitHub Actions run 29490488953 PASS for Ubuntu verify and Windows machine-setup-contract after the portable Symbol test fix.
Remaining Limits: Illustrator work/test panels were not opened during this migration review, so ports 9197/9198/9099 and `npm run verify:smoke` remain manual; legacy wrappers remain by policy; font comparison needs the encrypted inventory; a truly fresh Windows profile must still exercise elevation/App Installer/Adobe license checkpoints; `npm ci` reports 22 pre-existing transitive audit findings that were not force-upgraded in this architecture task.
Unverified But Suspected: No additional architecture defect is suspected; host behavior and dependency remediation remain separate scoped work.

## Devkit v1.0.1 Follow-up Gate

Scope Reviewed: Portable Codex skill routing, promotion of reusable CEP/Wedding references into active skill folders, devkit CI runtime refresh, and product lock/documentation update only; product runtime and `libs/shared` were unchanged.
Root Cause: Devkit v1.0.0 installed the three project skills, but their bodies still linked to retired product `.agent` paths, so a blank Codex task could discover a skill and then be routed to missing files.
Required Fixes: Removed all active `.agent` and `AGENT_OPERATING_MODEL.md` routes; bundled the reusable references with their owning skills; added installer regression coverage; updated devkit CI to `actions/checkout@v7`; released v1.0.1 at `f1f5bf8dbea7a785e9130162276fa347ff5314a8`; updated the product pin and setup documentation; locked `*.ps1` to LF so Spec Kit manifest checks remain stable on Windows checkouts.
Review Evidence: All three project skills passed `quick_validate.py`; every active product link resolved; devkit tests and portable secret scan passed; devkit PR #2 and main CI run 29545403014 passed with no Node 20 annotation.
Verification Required: Rerun product machine-contract tests, full product verification, pinned `devkit:ensure`, combined doctor, gate check, and product CI after the lock update.
