# C1: AI-native two-repository architecture

# Pass A - Direction Brief

## Context

- Task: Separate the lightweight Adobe CEP product repository from the private developer/AI workstation control plane.
- App or module: repository governance, machine tooling, all CEP apps as consumers.
- Trigger: approved implementation plan for reproducible GitHub-first migration to a new Windows machine.

## Normalized Request Receipt

- Intent: build and publish the approved two-repository architecture.
- Route: `/build`.
- Goal: a blank Codex task can clone the public product, discover the pinned private devkit when development is requested, bootstrap the workstation, and report doctor status.
- Success Criteria: product builds without private access; devkit is pinned by release and commit; one prompt drives setup; current workstation source is represented by intentional Git commits.
- Scope Guess: root governance/tooling, machine setup, CI, private devkit; no product runtime behavior changes for this migration slice.
- Constraints: Windows, Illustrator 2025/2026, Node 24/npm 11, no credentials or licensed binaries, no submodule, no direct GitHub-to-CEP link.
- Unknowns: only interactive identity/license checkpoints are intentionally left to the operator.
- Approval Needed: approved by the user in the implementation request.

## Problem Restatement

- The public remote does not currently reproduce the complete verified workstation state, and AI/workstation configuration is mixed conceptually with product source.

## Options

### Option 1

- Summary: keep all product and workstation tooling in one repository.
- Tradeoffs: simplest clone, but exposes or couples private workstation policy and grows agent context.

### Option 2

- Summary: public product plus pinned private sibling devkit.
- Tradeoffs: requires one authenticated private clone, but preserves independent product CI and progressive disclosure.

### Option 3

- Summary: make the devkit a Git submodule.
- Tradeoffs: exact pinning is built in, but onboarding and dirty-state handling are more fragile for non-expert users and agents.

## Best Practices

- Keep source, tests, lockfile, build configuration, active specs, and minimal `AGENTS.md` with the product.
- Pin developer tooling by immutable release and commit SHA.
- Install Windows tooling declaratively and keep authentication interactive.
- Make setup and doctor idempotent and machine-readable.

## Anti-Patterns

- Treating a dirty worktree snapshot as reviewed source.
- Storing tokens, Codex auth, sessions, caches, font binaries, or Adobe credentials in Git.
- Following a moving devkit `main` branch.
- Requiring the private devkit for public product CI.

## Edge Cases

- GitHub CLI or WinGet is absent on a fresh Windows profile.
- A sibling devkit exists at the wrong commit or has local changes.
- Browser GitHub login exists but GitHub CLI is not authenticated.
- Illustrator or licensed fonts are absent.

## Counterfactuals

- A checklist-only setup drifts and cannot prove machine state.
- A disk image restores stale machine state and is not a reviewable source of truth.
- Running CEP source directly from GitHub is impossible because Adobe consumes local filesystem wrappers.

## Chosen Direction

- Two sibling repositories: public `adobe-illustrator-extensions` and private `adobe-illustrator-devkit`, using `AGENTS.md`, Agent Skills, Spec Kit v0.12.16, and WinGet Configuration.

## Why Other Options Were Rejected

- One repository mixes access/lifecycle boundaries; submodules add operator friction without improving product CI.

## Approval Checkpoint

- Status: approved.
- Blocking decisions: none.

# Pass B - Implementation Plan

## Planned Files Or Modules

- Product: root agent contract, devkit lock, bootstrap/ensure/doctor/setup scripts, package commands, CI, Spec Kit scaffold, machine prompt and active specs.
- Devkit: manifests, WinGet/toolchain lock, bootstrap/doctor/Codex installer, machine backup/restore and tests.
- GitHub: rename private repository, publish pinned `v1.0.0`, push reviewed product branch and open draft PRs.

## Consumers To Verify

- Public product CI without private credentials.
- Codex startup from a blank task.
- Six CEP work/test wrappers for Illustrator 2025/2026.
- Existing machine migration backup/restore contract.

## Execution Slices

### Slice 1

- Goal: preserve and normalize the verified local baseline.
- Files: current wedding, symbol, toolkit, shared, and repository-tooling changes grouped into explicit commits.
- Validation: `npm run verify` and repository audit.

### Slice 2

- Goal: publish private devkit release.
- Files: devkit manifests, PowerShell entrypoints, WinGet config, tests and documentation.
- Validation: PowerShell parser checks, Pester-independent smoke scripts, secret scan, dry-run doctor.

### Slice 3

- Goal: connect the product to the immutable devkit and standardize AI workflow.
- Files: product lock/bootstrap, Spec Kit integration, scripts/tests/CI/docs.
- Validation: unit/integration tests, clean-clone product verification, devkit state matrix, size budget.

## Validation Plan

- Run targeted tests after each slice, then full `npm run verify`, doctor JSON, gate enforcement and GitHub Actions checks.

## Open Risks

- Adobe/font/license smoke checks require operator interaction and are recorded as manual acceptance, not automated pass claims.
