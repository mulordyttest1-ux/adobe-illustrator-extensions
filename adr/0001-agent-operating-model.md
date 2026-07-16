# ADR 0001: Agent Operating Model

- Status: Accepted
- Date: 2026-03-26

## Context

The repo now uses coding agents regularly, but the operating model was implicit. Without a clear team shape, agent work can drift between single-agent and multi-agent modes, overuse parallel writers, or bypass repo governance.

## Decision

- Adopt an MVP agent team with:
  - Orchestrator
  - Explorer
  - Implementer
  - Validator
- Default to `1 writer`.
- Allow `2 writers` only for disjoint write scopes explicitly named in advance.
- Keep repo governance in:
  - `AGENTS.md`
  - scoped `AGENTS.md`
  - `.agent/workflows/*`
- Treat external skills as optional affordances, not governance.

## Consequences

- Multi-agent work becomes safer and more repeatable.
- Throughput is intentionally limited at first to avoid merge and scope risk.
- Repo-native docs become the primary routing surface for all agents.
