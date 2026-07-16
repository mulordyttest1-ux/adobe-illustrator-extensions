## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Refactor `wedding-cep` startup bootstrap into a clearer boot pipeline by extracting ready-state, startup-resource loading, and tab/controller boot modules while preserving the public `startup.js` facade.
- Execution mode: focused in-app refactor with behavior preservation

## Files To Modify

- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/readyState.js`
- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/bootstrap/tabBoot.js`
- `wedding-cep/cep/js/bootstrap/startup.test.js`
- `wedding-cep/cep/js/bootstrap/readyState.test.js`
- `wedding-cep/cep/js/bootstrap/startupResources.test.js`
- `wedding-cep/cep/js/bootstrap/tabBoot.test.js`

## Consumers Verified

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.test.js`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_startup_pipeline_scope.md`

## Notes Before Execution

- Preserve the public exports of `startup.js`.
- Preserve `window.__WEDDING_APP_READY__` shape and phase order.
- Keep bridge ping best-effort and schema load fatal.
- Do not widen scope into P2 (`illustrator.jsx`) or P3 (`logic/ux`) work.

## Review Gate

Scope Reviewed: `wedding-cep` startup bootstrap refactor across `startup.js`, new bootstrap helper modules, tests, and `check_architecture.cjs` allowlist.
Top Risks: facade drift in `startup.js` public exports; phase order drift in `__WEDDING_APP_READY__`; losing test override seams for `TabbedPanel` and controllers; governance mismatch after moving ready-state writes into `readyState.js`.
Required Fixes: none
No Blocking Findings: public startup facade stayed intact; ready-state shape and boot semantics were preserved; targeted tests plus full validation covered the main regression seams.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `startup.js` now acts as a thin orchestration shell; readiness, resource loading, and tab boot responsibilities were split into dedicated modules; public exports `initApp`, `updateReadyState`, `createCompactController`, and `createSchemaController` still work; wedding lint/build/test/smoke/verify remain green.
Evidence Run: `node --test wedding-cep/cep/js/bootstrap/readyState.test.js`; `node --test wedding-cep/cep/js/bootstrap/startupResources.test.js`; `node --test wedding-cep/cep/js/bootstrap/tabBoot.test.js`; `node --test wedding-cep/cep/js/bootstrap/startup.test.js`; `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: no manual panel walkthrough beyond existing smoke coverage; startup phase transitions are verified through tests and smoke, not by a new dedicated visual receipt.
Unverified But Suspected: none
