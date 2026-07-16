## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: yes

## Scope Lock

- Summary: Build the first stable foundation for `toolkit-cep` as a third CEP app with build-time module discovery, a keyboard-first launcher shell, and two canonical example modules.
- Execution mode: new app scaffold plus root workspace wiring, with app-local runtime/build/test surfaces only.

## Files To Modify

- `package.json`
- `.gitignore`
- `README.md`
- `toolkit-cep/**`
- `.task_steps/c2_toolkit_cep_scope.md`

## Consumers Verified

- Root npm workspace wiring and aggregate repo commands
- CEP app architecture patterns from `wedding-cep` and `symbol-cep`
- Shared feedback surface from `@shared/cep-ui`
- Shared smoke runner at `shared/testing/E2ERunner.cjs`

## Cross-App Impact

- Adds a third CEP workspace to repo-level scripts and docs.
- Does not modify `wedding-cep`, `symbol-cep`, `libs/shared`, or `libs/wedding/domain` runtime behavior.

## Validation Targets

- `npm run lint:toolkit`
- `npm run build:toolkit`
- `npm run test:toolkit`
- `npm run test:smoke:toolkit`
- `npm run check:gates -- --file .task_steps/c2_toolkit_cep_scope.md`

## Notes Before Execution

- The repo worktree is already dirty outside this scope; unrelated files must not be reverted.
- Live smoke validation is constrained to Illustrator 2026 on port `9099`.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `toolkit-cep` new workspace scaffold, root npm wiring, build-time module generation, CEP bridge/runtime shell, example modules, and smoke harness on Illustrator 2026 port `9099`.
Top Risks: host/panel boundary drift, generator contract drift for future modules, and launcher UX regressions around focus/search/confirm flow.
Required Fixes: none.
No Blocking Findings: runtime shell, generator, and smoke flow passed after fixing reload-id wiring and hardening the confirm/fixture seams.
Validation Rerun Needed: no.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: new `toolkit-cep/cep` workspace exists and builds, build-time discovery emits panel/host generated artifacts, launcher UI renders/searches/executes, root repo commands include toolkit, and smoke coverage runs on Illustrator 2026 only through port `9099`.
Evidence Run: `npm run lint:toolkit`; `npm run build:toolkit`; `npm run test:toolkit`; `npm run test:smoke:toolkit`.
Remaining Limits: V1 smoke confirm coverage uses the exposed test runtime service plus direct host execution rather than relying on `shell.executeCommand()` promise settlement inside the CDP harness; the live UI behavior itself passed.
Unverified But Suspected: direct awaiting of `shell.executeCommand()` from the external test harness may remain unreliable even though the real user-facing fire-and-forget UI path works and smoke-covered results are correct.
