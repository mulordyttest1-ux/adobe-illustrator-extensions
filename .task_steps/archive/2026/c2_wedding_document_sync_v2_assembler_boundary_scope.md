# C2: Wedding Document Sync V2 Assembler Boundary

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Document Sync V2` by adding a configured assembler boundary for the update path, reducing reliance on mutable `setDependencies(...)` and fixing date-key detection for `solar_date`.
- Execution mode: focused runtime refactor inside `wedding-cep` update packet assembly only

## Files To Modify

- `wedding-cep/cep/js/logic/pipeline/assembler.js`
- `wedding-cep/cep/js/logic/pipeline/assembler.test.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.test.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, JSX host code, or cross-app contracts.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_v2_assembler_boundary_scope.md`

## Notes Before Execution

- Keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, and update/postflight envelopes unchanged.
- Do not widen this round into scan path, bridge payload changes, or domain API changes.
- `solar_date` support in the assembler boundary is in scope because the live schema uses it for `date.tiec`.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Document Sync` update packet assembly only, centered on `WeddingAssembler.assembleWith(...)` plus `runUpdateDocumentService(...)` delegation.
Top Risks: moving packet assembly to a configured boundary could accidentally change update packet content or hide mutable-state behavior behind a silent fallback; date-key detection could drift if `solar_date` stayed outside the assembler contract.
Required Fixes: keep `UpdateAction.execute(...)`, `runUpdateDocument(...)`, bridge payloads, and postflight envelopes unchanged; add direct assembler coverage for `_idx -> _split_idx`, raw-data immutability, and `solar_date` date expansion; keep scan path and strategy-update seams out of scope.
No Blocking Findings: Yes. Local review and explorer audit converge that the assembler boundary is the next valid `Document Sync V2` slice after the strategy-planning round, and the final patch stayed inside that write set.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `WeddingAssembler` now exposes `assembleWith(...)` so update packet assembly can run from explicit injected deps instead of relying on mutable singleton state; `runUpdateDocumentService(...)` prefers the configured boundary and keeps a legacy fallback only for injected harnesses; `solar_date` now flows through the same date-key path as `date`; update/postflight runtime contracts stayed unchanged.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: scan path is still outside the island; the legacy `setDependencies(...)` path still exists for compatibility and test fallback; no bridge or payload contract changes were attempted in this round.
Unverified But Suspected: none
