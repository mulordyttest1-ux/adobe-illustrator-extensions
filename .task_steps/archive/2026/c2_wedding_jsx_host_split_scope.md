## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Split smoke/debug host infrastructure out of `wedding-cep` `illustrator.jsx` into separate ES3-compatible include files while keeping `illustrator.jsx` as the only CEP host entrypoint.
- Execution mode: focused in-app refactor with behavior preservation

## Files To Modify

- `wedding-cep/cep/jsx/illustrator.jsx`
- `wedding-cep/cep/jsx/textFrameIds.jsx`
- `wedding-cep/cep/jsx/hostValidation.jsx`
- `wedding-cep/cep/README.md`

## Consumers Verified

- `wedding-cep/cep/CSXS/manifest.xml`
- `wedding-cep/cep/debug_scripts/smoke_helpers.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`
- `wedding-cep/cep/js/logic/core/textFrameIds.test.js`

## Cross-App Impact

- None. Scope is limited to `wedding-cep`.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_jsx_host_split_scope.md`

## Notes Before Execution

- Keep `ScriptPath` in the CEP manifest unchanged.
- Keep `bridge.call('hostSelectionValidation', { command, scenario })` unchanged.
- Keep stable UUID semantics unchanged.
- Keep smoke helper reload strategy unchanged.

## Review Gate

Scope Reviewed: `wedding-cep` JSX host-boundary cleanup across `illustrator.jsx`, new include files, README endpoint note, and smoke contract preservation.
Top Risks: breaking ES3 compatibility in host files; breaking `#include` resolution under CEP `ScriptPath`; drifting `hostSelectionValidation` payload/response shape; accidentally changing production bridge behavior while extracting debug fixture logic.
Required Fixes: none
No Blocking Findings: `illustrator.jsx` remains the only host entrypoint; the new include files only move existing stable-id and validation fixture logic; smoke contract and scenario names stayed unchanged.
Validation Rerun Needed: no

## Verification Gate

Claims Verified: `WeddingHostValidation` no longer lives inline in `illustrator.jsx`; stable-id generation now has a dedicated host-side include; `ScriptPath` and smoke helper reload strategy remain unchanged; wedding lint/build/test/smoke/verify are green after the split.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: no new dedicated CI-safe test was added for ExtendScript include loading itself; confidence comes from smoke exercising the real CEP host entrypoint and fixture endpoint.
Unverified But Suspected: none
