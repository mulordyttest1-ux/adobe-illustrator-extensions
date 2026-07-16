## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Add a cross-app source-of-truth document for postflight taxonomy, then wire existing repo docs to the shared terms without changing runtime code.
- Execution mode: docs-only / cross-app governance update

## Files To Modify

- `POSTFLIGHT_TAXONOMY.md`
- `README.md`
- `wedding-cep/ARCHITECTURE.md`
- `symbol-cep/PROJECT_STATUS.md`

## Consumers Verified

- `wedding-cep/ARCHITECTURE.md` is the architecture source of truth for `wedding-cep`.
- `symbol-cep/PROJECT_STATUS.md` is the closest existing top-level status document for `symbol-cep`.
- Root `README.md` is the repo entry point for shared governance notes.
- `wedding-cep` uses postflight as validation/reporting.
- `symbol-cep` uses postflight as post-run hook orchestration.

## Cross-App Impact

- Docs and governance only.
- No runtime code, shared libraries, or host contracts change in this round.

## Validation Targets

- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_cross_app_postflight_taxonomy_scope.md`

## Notes Before Execution

- Do not extract runtime code into `libs/shared`.
- Do not rename app-local postflight classes.
- Keep the deliverable focused on taxonomy, extraction criteria, and anti-drift guidance.

## Review Gate

Scope Reviewed: root taxonomy doc plus the repo/app references in `README.md`, `wedding-cep/ARCHITECTURE.md`, and `symbol-cep/PROJECT_STATUS.md`.
Top Risks: accidentally implying a shared runtime abstraction that does not exist; letting the shared taxonomy become more specific than either app can honor.
Required Fixes: none.
No Blocking Findings: yes. No blocking findings after reviewing the doc split and extraction criteria.
Validation Rerun Needed: no runtime rerun needed beyond docs validation because this round does not change repo-tracked runtime code.

## Verification Gate

Claims Verified: a cross-app postflight taxonomy source of truth exists at repo root; root and app docs reference the taxonomy using the intended subtype split; no runtime implementation was moved or shared in this round.
Evidence Run: `npm run check:encoding`; `npm run check:gates -- --file .task_steps/c2_cross_app_postflight_taxonomy_scope.md`
Remaining Limits: `symbol-cep` still does not have a full app architecture document; this round only adds taxonomy guidance through `PROJECT_STATUS.md`.
Unverified But Suspected: none.
