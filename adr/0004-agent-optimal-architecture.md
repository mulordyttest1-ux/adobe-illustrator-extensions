# ADR 0004: Agent-Optimal Architecture Direction

- Status: Accepted
- Date: 2026-03-27

## Context

The repo now has stable agent routing, feature maps, risk tiers, and stronger public seams in both apps. The next risk is architectural drift: continued file-by-file cleanup can improve local readability while still leaving the overall repo without a clear long-term migration target.

At the same time, a full rewrite or parallel app-v2 rollout would create dual maintenance, parity risk, and high validation cost across two CEP apps with real host/runtime constraints.

## Decision

Adopt an agent-optimal architecture direction based on:

- bounded-context modular monolith
- stable public facades at context entry seams
- internal service/support modules for runtime mechanics
- pure policy/domain modules for planning, validation, mapping, and normalization
- explicit adapter boundaries for CEP, JSX, storage, and other IO
- config/data modules that stay separate from executable business logic where possible

Migration strategy:

- use `v2 islands in-place`
- do not create parallel app-v2 trees
- do not full-rewrite either app
- do not continue broad file-level cleanup without a bounded-context outcome or a real bug/policy trigger

## Consequences

- Future refactors must target bounded contexts rather than arbitrary large files.
- New runtime code should be classified as one of:
  - Facade
  - Service / Support
  - Policy / Domain
  - Adapter
  - Config / Data
- `wedding-cep` should prioritize:
  - `Document Sync`
  - `Template Authoring`
- `symbol-cep` should prioritize:
  - `Preset / Config`
- Platform / host work remains trigger-based and elevated-risk.

## Non-Goals

- No payment, subscription, licensing, or commercial security architecture in this initiative.
- No cross-app runtime sharing between `wedding-cep` and `symbol-cep`.
- No broad filesystem rewrite in this phase.

## GPT-Maintained Repository Contract

This repository is expected to be maintained primarily by GPT coding agents.
The architecture decision therefore includes the repository control plane, not
only production module boundaries.

The required operating model is:

1. Durable instructions are short, practical, and layered through root and
   nearest-scope `AGENTS.md` files.
2. A new agent can locate ownership, runtime boundaries, legacy seams, and
   focused validation without broad source search.
3. Multi-step work has an explicit specification, plan, tasks, acceptance
   criteria, and bounded write scope.
4. Business policy is testable outside CEP/Illustrator where possible; host
   behavior has a focused Illustrator 2026 smoke route.
5. Completion is based on fresh command and runtime evidence rather than agent
   confidence.
6. Compatibility code is named and isolated; new code cannot use it as a
   shortcut.
7. A clean checkout contains every source, test, specification, and instruction
   required to reproduce validation.

The supporting repository surfaces are:

- `AGENT_CONTEXT.md` for the short operational map;
- per-app `FEATURE_MAP.md` and `ARCHITECTURE.md` files for ownership;
- `LEGACY_MAP.md` for compatibility boundaries and removal triggers;
- `specs/**` for task intent and acceptance evidence;
- architecture, encoding, hygiene, and agent-readiness checks for mechanical
  enforcement;
- the pinned private devkit for developer workflow that must not drift with a
  mutable upstream branch.

## External Basis

This contract follows current public agent-engineering guidance rather than a
repo-specific convention:

- OpenAI recommends durable `AGENTS.md` guidance that records repository
  layout, commands, conventions, constraints, and what completion means. It
  also recommends tests, checks, and review as part of the agent loop:
  <https://developers.openai.com/codex/codex-manual.md>
- GitHub recommends repository and path-specific instructions, validated build
  and test commands, isolated tests, and enough repository context to reduce
  repeated exploratory search:
  <https://docs.github.com/en/copilot/tutorials/cloud-agent/get-the-best-results>
- GitHub recognizes nested `AGENTS.md` as an agent-instruction surface and uses
  the nearest applicable file:
  <https://docs.github.com/en/copilot/reference/custom-instructions-support>

The repository intentionally uses `AGENTS.md` as the portable source of truth
instead of duplicating the same rules into provider-specific instruction files.
Provider-specific files may be added later only for capabilities not expressed
by the shared contract.

## Current Readiness

As of 2026-07-27:

- instruction routing, bounded-context maps, specs, validation matrices,
  architecture guards, and explicit legacy policy are implemented;
- the production architecture is suitable for incremental GPT work and should
  not receive another broad proactive refactor without a feature or reproduced
  defect;
- five active compatibility seams remain intentionally supported;
- the actual worktree still has 83 required untracked files, so clean-clone
  reproducibility is not complete in Git;
- a temporary clean-room candidate containing the tracked tree plus those 83
  audited files passed strict agent readiness and encoding checks with 767
  tracked files and zero untracked files.

The highest-return remaining action is intentional Git publication of the
audited ownership set. Further production refactoring has lower expected return
than preserving the current boundaries and improving them only when real work
exposes friction.
