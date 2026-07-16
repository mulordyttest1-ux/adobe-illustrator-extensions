# Cross-App Postflight Taxonomy

> Source of truth for how this monorepo uses `preflight` and `postflight` across apps.
> This file defines shared terms and governance only. It does not imply shared runtime code.

## Purpose

- Keep `wedding-cep` and `symbol-cep` aligned on terminology without forcing them into the same implementation.
- Prevent drift where two apps use the same word for different runtime responsibilities.
- Make extraction criteria explicit before anything moves into `libs/shared`.

## Shared Terms

- `preflight`: checks that happen before the main task runs.
- `postflight`: work that happens after the main task completes.
- `severity`: shared vocabulary for user-facing issue levels.
  - `error`
  - `warning`
  - `info`
- `actionability`: shared vocabulary for what a finding can do next.
  - `selectFrame`
  - `openPanel`
  - `none`

## Postflight Subtypes

### `postflight/report`

User-facing validation and issue reporting after a task runs.

Characteristics:

- produces issues or findings
- can point the operator back to a frame or field
- should group, prioritize, and describe what needs attention
- should not break the main task if reporting fails

Current consumer:

- `wedding-cep`

### `postflight/hooks`

Post-run automation or rendering work that happens after a task succeeds.

Characteristics:

- runs side effects after the main task
- may enrich the output or add supporting artifacts
- is not primarily an issue-report UI
- should not break the main task if a hook fails

Current consumer:

- `symbol-cep`

## App Mapping

### `wedding-cep`

- subtype: `postflight/report`
- local surfaces:
  - `PostflightAction`
  - `PostflightValidator`
  - `ValidationReportWidget`
- local concerns:
  - leftover markers
  - suspicious static data
  - schema gaps
  - frame re-selection for operator correction

### `symbol-cep`

- subtype: `postflight/hooks`
- local surfaces:
  - `PostflightOrchestrator`
  - `PasteboardInfoRule`
- local concerns:
  - post-imposition side effects
  - pasteboard legend rendering
  - result-data driven automation

## Governance Rules

- Do not assume two apps should share runtime code just because both use the word `postflight`.
- Shared runtime extraction is allowed only when at least two real consumers need the same artifact.
- The following stay app-local unless that threshold is met:
  - validators
  - report widgets
  - orchestrator classes
  - rule plugins
- Shared extraction candidates must be narrow and structural, for example:
  - common finding vocabulary
  - shared actionability naming
  - doc-level conventions

## Extraction Criteria

Before moving anything into `libs/shared`, confirm all of the following:

1. Two apps need the same artifact, not just the same concept name.
2. The artifact can be described without app-specific business rules.
3. The shared API does not force one app to inherit the other app's runtime shape.
4. Tests and docs can express the shared contract without special casing one app as the default.

If any of these fail, keep the implementation local and update docs instead.
