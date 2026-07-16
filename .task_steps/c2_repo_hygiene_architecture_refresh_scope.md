## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: yes
Cross-App Impact: yes

## Scope Lock

- Summary: Make the local monorepo safer and easier to maintain without changing CEP product behavior.
- Execution mode: staged cleanup with an external verified backup; no source/config/test staging or commits; only `.nx` cache entries may be removed from the Git index.

## Files To Modify

- Root hygiene, validation, package scripts, and audit tooling.
- App-local smoke scripts and package smoke routing for Symbol, Wedding, and Toolkit.
- Symbol Wedding Suite PDF fixture references and build-owned template ignore policy.
- `.task_steps` active/archive layout and archive index.

## Consumers Verified

- Root `verify`, `test:ci`, and smoke aliases.
- Symbol and Wedding 2026 test wrappers plus Toolkit port `9099`.
- Installer consumption of the build-owned Wedding Suite template.
- Existing app unit tests, architecture checks, frozen-shell guard, and smoke registries.

## Cross-App Impact

- Root scripts and ignore policy affect all workspaces.
- No runtime API, bridge payload, preset schema, or installer topology changes are allowed.
- Shared runtime code must remain behaviorally unchanged.

## Validation Targets

- `npm run check:encoding`
- `npm run check:repo-hygiene`
- `npm run audit:repo`
- `npm run lint:all`
- `npm run build:all`
- `npm run test:ci`
- `npm --workspace imposition-panel-cep run test:smoke:2026`
- `npm --workspace wedding-scripter-cep run test:smoke:2026`
- `npm run test:smoke:toolkit`
- `npm run check:gates -- --file .task_steps/c2_repo_hygiene_architecture_refresh_scope.md`

## Notes Before Execution

- Verified backup: `C:\Projects\adobe-illustrator-extensions-backups\20260714_090751`.
- Backup comparison: `957/957` files matched SHA-256; Git bundle exists.
- Illustrator 2025 smoke is explicitly out of scope.

## Review Gate

Scope Reviewed: External backup and SHA manifests; quarantine/archive moves; Git ignore/index ownership; package scripts and lockfile; encoding/hygiene/audit tooling; Symbol, Wedding, and Toolkit smoke manifests/runners; build-owned Symbol template and PDF fixture routing.
Top Risks: Destructive artifact moves, false-green smoke runs, fixture paths through root-linked wrappers, generated output accidentally becoming source, and the large pre-existing untracked source baseline.
Required Fixes: Restored the all-NUL Wedding smoke entry from its intact suites; added zero-test fail-fast to the shared runner; fixed Symbol split-suite decoder injection and Windows `file:///` fixture normalization; made K100 host fixtures use a deterministic selection scope; moved Symbol PDF smoke output to `%TEMP%` with retain-on-failure cleanup.
No Blocking Findings: No blocking code finding remains after the required fixes; product runtime/API/schema/topology contracts were not changed by this pass.
Validation Rerun Needed: Completed `npm run verify` after all review fixes and reran Symbol live smoke on 2026 to `46/46`.

## Verification Gate

Claims Verified: Backup matched `957/957` source files and contains a Git bundle; both quarantine manifests are SHA-256 verified (`160` initial files plus `2` smoke leftovers); `143` receipts are indexed; `.nx` has zero tracked files; only `16` `.nx` deletions are staged; required smoke sources and the relocated PDF fixture are visible; source and built Symbol template hashes match; no local artifact remains in source-owned paths.
Evidence Run: `npm run audit:repo` report-only; final `npm run verify` passed encoding, hygiene, all lint/build steps, Wedding/domain tests, Symbol `160`, Toolkit `80`, and repo-tooling `6`; `npm --workspace imposition-panel-cep run test:smoke:2026` passed `46/46`; Wedding `9197` and Toolkit `9099` smoke commands were attempted and correctly reported `ECONNREFUSED` because those panels were closed.
Remaining Limits: `629` source/config/test files remain untracked by explicit operator choice, so clean-clone reproducibility is not claimed; Wedding and Toolkit live smoke remain unverified until their 2026 gates are open; Toolkit frozen-shell guard cannot distinguish the pre-existing dirty/untracked Toolkit baseline; npm reports `2` moderate and `2` high advisory vulnerabilities; Knip candidates remain report-only.
Unverified But Suspected: No Wedding or Toolkit product defect is inferred from a closed debug port; their live scenarios must be rerun when ports `9197` and `9099` are available.

## Micro Postmortem

- Symptom: Wedding smoke previously returned success without executing visible scenarios.
- Isolation: The pre-cleanup backup and workspace had the same all-NUL `test_smoke.cjs`, while all six suite files were intact.
- Root Cause: Node accepted the NUL-only entry as an empty module and the shared runner accepted zero registered tests.
- Prevention: Every app now has a manifest registration test, and `E2ERunner` fails before connecting when no smoke tests are registered.
