# C2: Wedding Document Sync V2 Update Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance the second `Document Sync V2` slice by turning `runUpdateDocument(...)` into a thin facade over a named `document-sync` service while keeping update/runtime contracts unchanged.
- Execution mode: focused runtime refactor inside `wedding-cep` update branch only

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.test.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.test.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not touch shared libs, bridge payloads, or cross-app contracts.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_v2_update_service_scope.md`

## Notes Before Execution

- Keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, and update result envelopes stable.
- Do not widen this round into scan path, bridge payload changes, or assembler logic changes.
- This round is valid because it upgrades a `Document Sync` context seam, not just a generic support split.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Document Sync` update branch only, centered on `runUpdateDocument(...)` delegating to `document-sync/updateDocumentService.js` while keeping `UpdateAction` and result envelopes stable.
Top Risks: moving packet assembly orchestration behind a new service could accidentally change update result shape or hide assembler dependency wiring; if the round widened into assembler/payload changes it would stop being a safe second slice.
Required Fixes: keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, `runApplyStrategyUpdate(...)`, and postflight context shape unchanged; keep scan path out of scope; add direct tests for the new service seam instead of only relying on the facade test.
No Blocking Findings: Yes. Local review and explorer audit agree this round is a valid context upgrade, and the next higher-ROI slice after this should be the assembler boundary rather than more support extraction.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `runUpdateDocument(...)` is now a thin facade over a named `document-sync` service; update packet assembly, schema meta extraction, and result shaping moved behind `runUpdateDocumentService(...)`; `UpdateAction` contract and update/postflight envelopes stayed unchanged.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet make the assembler boundary pure/configured; scan path is still outside the island; the next context slice should target assembler configuration and date-key boundary without changing bridge or payload contracts.
Unverified But Suspected: none
