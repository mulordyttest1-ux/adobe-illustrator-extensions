## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Create a single architecture source-of-truth document for `wedding-cep`, then update app docs to point to it.
- Execution mode: docs-only / no runtime code changes

## Files To Modify

- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/cep/README.md`
- `wedding-cep/PROJECT_STATUS.md`

## Consumers Verified

- `wedding-cep/cep/README.md` currently carries architecture summary for day-to-day app work.
- `wedding-cep/PROJECT_STATUS.md` currently carries architecture summary plus health status.
- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/scripts/check_architecture.cjs`

## Cross-App Impact

- None. Scope is limited to `wedding-cep` docs and governance text.

## Validation Targets

- `npm run check:gates -- --file .task_steps/c2_wedding_architecture_docs_scope.md`

## Notes Before Execution

- Keep this round docs-only.
- Do not widen scope into runtime refactors or shared tooling.
- `ARCHITECTURE.md` becomes the source of truth; README and PROJECT_STATUS become summaries that point back to it.
