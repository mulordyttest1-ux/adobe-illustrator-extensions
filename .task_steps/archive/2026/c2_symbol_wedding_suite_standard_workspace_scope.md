# C2 Template: Scope Lock and Gate Receipt

## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Build a new `symbol-cep` Wedding Suite Standard workspace as a greenfield island with its own panel UI, host adapter, recipe store, planner, QA-first output contract, and remembered last save directory.
- Execution mode: build

## Files To Modify

- `symbol-cep/cep/index.html`
- `symbol-cep/cep/css/style.css`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/*`
- `symbol-cep/cep/jsx/host.jsx`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep` panel shell
- Wedding Suite Standard workspace users
- QA / print output workflow for single exported PDF

## Cross-App Impact

- None. New feature island stays inside `symbol-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_wedding_suite_standard_workspace_scope.md`

## Notes Before Execution

- Do not route this workflow through legacy `symbol` preset/config/action ownership.
- QA artboard must stay first in output ordering.
- Remember only the last save directory, not the last filename.

## Verification Gate

Claims Verified: Wedding Suite Standard mounts as a third `symbol-cep` workspace tab, keeps its own recipe/planner/preference island, defaults export filename stem to `info`, remembers the last save directory after a successful build, and routes active/external source requests into a QA-first output contract without depending on legacy preset/config owners.

Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`

Remaining Limits: Runtime smoke uses a fake host adapter for the new workspace, so live Illustrator host rendering/export is covered by the new JSX bridge implementation but not yet by a real CEP-host smoke lane. V1 still assumes one source package and one paper stock per job.

Unverified But Suspected: External PDF/AI duplication across documents should work through `pageItem.duplicate(...)`, but exact Illustrator-host behavior still needs live operator validation on real artwork.
