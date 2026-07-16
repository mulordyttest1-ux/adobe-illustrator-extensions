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
