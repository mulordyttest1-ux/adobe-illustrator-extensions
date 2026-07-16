# C2: Wedding Host Facade ACL

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: replace the app-facing `bridge + host` pair in `wedding-cep` with one public `HostFacade` seam, keep raw adapters internal to `infrastructure/`, and preserve all current runtime verbs and JSX contracts.
- Execution mode: composition-root-first host boundary cleanup with behavior preservation

## Files To Modify

- `.task_steps/c2_wedding_host_facade_acl_scope.md`
- `wedding-cep/cep/js/infrastructure/hostFacade.js`
- `wedding-cep/cep/js/infrastructure/hostFacade.test.js`
- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/`
- `wedding-cep/cep/js/actions/`
- `wedding-cep/cep/js/components/postflight/`
- `wedding-cep/cep/js/infrastructure/schemaLoader.js`
- `wedding-cep/cep/js/logic/use-cases/`
- `wedding-cep/cep/js/logic/ux/`
- `wedding-cep/cep/debug_scripts/smoke_helpers.cjs`
- `wedding-cep/cep/scripts/check_architecture*.cjs`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/js/types.d.ts`

## Consumers Verified

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/testApi.js`
- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/actions/ScanAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/postflight/widgetIssueRendering.js`
- `wedding-cep/cep/js/infrastructure/schemaLoader.js`
- `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
- `wedding-cep/cep/debug_scripts/smoke_helpers.cjs`

## Cross-App Impact

- None. Scope stays inside `wedding-cep` runtime seams, app-local tests, and app-local docs/types.

## Validation Targets

- `npm --workspace wedding-scripter-cep run dep-check`
- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_host_facade_acl_scope.md`

## Notes Before Execution

- Normalized receipt:
  - `intent`: refactor
  - `route`: `/build`
  - `goal`: collapse app-facing host access to one `HostFacade` while preserving existing runtime behavior and live smoke coverage
  - `success_criteria`: runtime composition root only creates `HostFacade`; app-facing code no longer imports or receives raw `Bridge`/`CepHost`; test API exposes `HostFacade` plus debug seam; wedding validation stays green
  - `scope_guess`: `app.js`, startup/test API wiring, actions/use-cases/widgets that currently receive `bridge`, runtime readers that currently receive `host`, architecture checker, and host-related docs/types
  - `constraints`: keep JSX payload names unchanged, keep `.jsx` ES3-safe, do not redesign business verbs, do not touch shared libs
  - `unknowns`: whether any hidden smoke/test helpers still assume `bridge.host.*`
  - `approval_needed`: no
- `getBridge()` remains a temporary compatibility alias in this slice and must return `HostFacade`.
- `debugHost` remains the only seam allowed to expose `evalScript(...)` and `getExtensionRootPath()`.

## Review Gate

Scope Reviewed: `HostFacade` seam creation, runtime cutover across startup/actions/use-cases/postflight, smoke helper compatibility, architecture checker, and the docs/types touched by Slice 2.
Top Risks: smoke helper still assuming `bridge` instead of `hostFacade/debugHost`; raw `bridge.js` / `cepHost.js` staying importable outside `infrastructure/`; postflight selection-session behavior regressing under live Illustrator smoke.
Required Fixes: update smoke helper to bind the selection-fixture path through `hostFacade + debugHost`; harden checker/tests so raw host adapters are internal-only behind `hostFacade`; rerun the full wedding dep-check/lint/build/test/smoke stack after the HostFacade cutover.
No Blocking Findings: yes; final review found no blocker after the smoke helper fix and full validation rerun.
Validation Rerun Needed: yes; all validation targets were rerun after the smoke-helper and contract-drift follow-ups.

## Verification Gate

Claims Verified: `app.js` now creates `HostFacade` plus `debugHost`; app-facing runtime code routes through `hostFacade`; raw `bridge.js` / `cepHost.js` stay internal-only behind `hostFacade`; startup/data loaders/document sync/template authoring/postflight still work without changing JSX contracts; live smoke proves selection fixture setup, postflight locate/restore, and legacy live-selection locate still work in Illustrator.
Evidence Run: `npm --workspace wedding-scripter-cep run dep-check` PASS; `npm run check:encoding` PASS; `npm run lint:wedding` PASS; `npm run build:wedding` PASS; `npm run test:wedding` PASS; `npm run test:smoke:wedding` PASS (24/24, including live postflight locate/restore and host-selection smoke on `localhost:9097`).
Remaining Limits: `getBridge()` still exists as a compatibility alias returning `HostFacade`, and smoke helper still carries a low-risk legacy fallback branch for older test API shapes even though the live path now uses `debugHost`.
Unverified But Suspected: none after the live smoke rerun; no additional host-boundary regression is currently suspected.
