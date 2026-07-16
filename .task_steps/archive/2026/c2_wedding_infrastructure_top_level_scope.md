## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Retire the remaining top-level runtime boundary exceptions in `wedding-cep` by moving `Bridge` and `SchemaLoader` into `cep/js/infrastructure/`, updating consumers, and hardening governance so new top-level runtime files do not come back.
- Execution mode: focused structural cleanup with behavior preservation

## Files To Modify

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bridge.js`
- `wedding-cep/cep/js/bridge.test.js`
- `wedding-cep/cep/js/schemaLoader.js`
- `wedding-cep/cep/js/infrastructure/bridge.js`
- `wedding-cep/cep/js/infrastructure/bridge.test.js`
- `wedding-cep/cep/js/infrastructure/schemaLoader.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/eslint.config.mjs`
- `wedding-cep/cep/scripts/check_architecture.cjs`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/PROJECT_STATUS.md`
- `wedding-cep/cep/README.md`

## Consumers Verified

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/startupResources.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/bootstrap/startup.test.js`
- `wedding-cep/cep/js/bootstrap/startupResources.test.js`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_infrastructure_top_level_scope.md`

## Notes Before Execution

- Keep `Bridge` and `SchemaLoader` APIs unchanged; only internal module paths move.
- Do not leave re-export shims at the old top-level paths.
- `app.js` remains the only app-owned runtime source at `cep/js/` top level.
- Do not change CEP manifest, bundle loading, or business logic in this round.

## Review Gate

Scope Reviewed: `wedding-cep` top-level runtime boundary cleanup across `Bridge`, `SchemaLoader`, consumer imports, top-level file governance, lint bans for old paths, and architecture/docs updates.
Top Risks: breaking panel boot by missing a moved import; leaving a hidden consumer on the old top-level paths; making the new top-level guard too strict and blocking legitimate files; drifting docs so they still describe `bridge.js` and `schemaLoader.js` as top-level runtime files.
Required Fixes: none.
No Blocking Findings: `Bridge` and `SchemaLoader` APIs stayed unchanged; all runtime consumers were migrated to `infrastructure/`; `cep/js/` top level now only contains `app.js`, `bundle.js`, `CSInterface.js`, and `types.d.ts`; governance now blocks new top-level runtime source files and legacy import paths from coming back.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `Bridge` now lives in `cep/js/infrastructure/bridge.js`; `SchemaLoader` now lives in `cep/js/infrastructure/schemaLoader.js`; `app.js` remains the only app-owned runtime source at `cep/js/` top level; runtime consumers no longer import the old top-level paths; architecture and docs now describe `infrastructure/` as the owner of CEP transport and schema-loading boundaries.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: `cep/js/` still keeps top-level non-runtime files by design (`bundle.js`, `CSInterface.js`, `types.d.ts`); this round hardened placement rules but did not refactor shared/vendor assets.
Unverified But Suspected: none
