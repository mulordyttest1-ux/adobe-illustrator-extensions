# ADR 0002: Bounded Context Ownership

- Status: Accepted
- Date: 2026-03-26

## Context

The repo had architectural rules, but ownership and feature routing were not yet standardized across both apps. Agents could find real entrypoints, but feature discovery was slower than necessary and context ownership was not expressed in `CODEOWNERS`.

## Decision

Adopt these canonical bounded contexts.

### `wedding-cep`

- Runtime / Boot
- Workspace / Form Entry
- Date Intelligence
- Input Assistance
- Template Authoring
- Document Sync
- Postflight
- Platform / Illustrator Host

### `symbol-cep`

- Runtime / Boot
- Preset / Config
- Preflight
- Engine / Execution
- Postflight / Hooks
- Platform / Illustrator Host
- Data / Persistence

Supporting rules:

- `FEATURE_MAP.md` is the feature routing SSOT for each app.
- `CODEOWNERS` mirrors bounded contexts.
- Shared libs and governance surfaces stay elevated-risk.

## Consequences

- Agents can route by workflow before reading deep code.
- Ownership becomes stable even if files move later.
- Future refactors can target context boundaries instead of generic buckets.
