# C2: Machine acceptance closure scope and gates

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: finish all remaining machine-migration acceptance requirements and repair defects exposed by the real bootstrap/smoke lane.
- Execution mode: isolated clean worktree and explicit file staging; preserve the operator's dirty `main` worktree and do not remove legacy CEP wrappers.

## Files To Modify

- Product devkit pin/setup docs, setup script and machine tests.
- Wedding and Toolkit smoke harnesses only; no feature runtime, ExtendScript runtime, or `libs/shared` changes.
- Spec task checklist and this gate receipt.

## Consumers Verified

- Fresh Windows checkout bootstrap and combined doctor.
- Illustrator 2025 work panels and Illustrator 2026 test panels.
- Wedding, Symbol, Toolkit smoke lanes and public CI.

## Cross-App Impact

- Root setup and pinned devkit are consumed by all three apps; smoke-harness repairs remain scoped to Wedding and Toolkit test infrastructure.

## Validation Targets

- Devkit tests and release CI.
- `npm run test:machine-setup`
- `npm run verify`
- `npm run verify:smoke`
- combined devkit doctor with private font inventory
- `specify integration status --json`
- `npm run check:gates -- --file .task_steps/c2_repo_machine_acceptance_scope.md`

## Notes Before Execution

- Devkit v1.0.1 and product main were already merged and green; the remaining work was host/font/fresh-profile acceptance.
- Codex config installation is skipped only on this already-configured workstation; required skills/plugins remain doctor-verified.

## Review Gate

Scope Reviewed: Devkit v1.0.2 inventory contract and product pin; clean-checkout setup preflight; Wedding/Toolkit smoke harness repairs; acceptance receipts only. No product feature runtime, ExtendScript runtime, `libs/shared`, credential, cache, inventory payload, or generated bundle is included.
Top Risks: A dry-run hiding real preflight failures; smoke fixtures bypassing required form validation; module suites leaking Illustrator fixture documents; accidental overwrite of current Codex configuration or the operator's dirty main worktree.
Required Fixes: Added the missing Node `fs` import plus real preflight regression test; updated Wedding live-update fixtures to select all required radio values; injected Toolkit fixture cleanup into every module suite and added a fail-fast context contract; kept the private font inventory ignored while forwarding it through devkit bootstrap/doctor; repinned the product to reviewed devkit v1.0.2.
No Blocking Findings: yes, after the acceptance defects were fixed and the impacted smoke lanes were rerun.
Validation Rerun Needed: yes; targeted machine, Wedding and Toolkit tests passed, followed by a fresh full host-smoke rerun.

## Verification Gate

Claims Verified: Devkit v1.0.2 is immutable and pinned by tag plus full SHA; a clean Windows worktree completes real WinGet/App Installer bootstrap, dependency install, verification, CSXS setup and six CEP links; private font inventory comparison passes; Illustrator 2025 work panels and Illustrator 2026 test panels open; all three debug ports and host smoke lanes pass.
Evidence Run: Devkit `.\\tests\\run-tests.ps1` PASS and GitHub Actions PR/main/tag runs 29546934942, 29546989965 and 29546998470 PASS; product `npm run test:machine-setup` 20/20 PASS; clean-worktree bootstrap rerun reached combined doctor; `npm run verify` exit 0; `npm run verify:smoke` exit 0 with Wedding 21/21, Symbol 46/46 and Toolkit 6/6; combined devkit doctor exit 0 with 44 PASS, 2 policy WARN and 0 FAIL; `specify integration status --json` reports `ok` with zero missing/modified files.
Remaining Limits: Product PR CI for this exact commit is pending publication. Two legacy wrappers remain by explicit policy and are the only doctor WARNs. Codex config overwrite was skipped on this already-configured workstation, while installed skills/plugins were doctor-verified. A genuinely new owner profile must still complete GitHub/Codex login, Adobe licensing and licensed-font authorization; npm reports 22 pre-existing transitive audit findings that are outside this migration scope and were not force-upgraded.
Unverified But Suspected: No additional acceptance defect is suspected after the clean bootstrap and full host-smoke reruns.
