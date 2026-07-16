# ADR 0003: Risk Tiers And Gates

- Status: Accepted
- Date: 2026-03-26

## Context

The repo already has review and verification gates, but task severity was not expressed with a simple, shared tier vocabulary that maps directly to agent behavior.

## Decision

Adopt three risk tiers:

- `T0`
  - docs-only or local low-risk change
- `T1`
  - single-app, single-context behavior change
- `T2`
  - shared, host-side, cross-app, or contract-shape change

Bind them to operating rules:

- `T0`
  - single-agent or single-writer
  - light validation
- `T1`
  - Orchestrator + Explorer + Implementer + Validator
  - review gate required
- `T2`
  - single writer only
  - mandatory review/risk pass
  - broader validation and explicit approval before close-out

## Consequences

- Agent concurrency is tied to risk rather than preference.
- Review intensity becomes consistent across apps.
- Shared and host-side work is harder to under-scope accidentally.
