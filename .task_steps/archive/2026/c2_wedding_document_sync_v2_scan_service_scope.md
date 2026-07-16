# C2: Wedding Document Sync V2 Scan Service

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Advance `Document Sync V2` by moving the scan branch behind a named `document-sync` service so both scan and update now use context-local seams.
- Execution mode: focused runtime refactor inside `wedding-cep` scan branch only

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/scanDocument.js`
- `wedding-cep/cep/js/logic/use-cases/scanDocument.test.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/ScanAction.js`
- `wedding-cep/cep/js/actions/ScanAction.test.js`
- `wedding-cep/cep/js/logic/use-cases/scanDocument.test.js`

## Cross-App Impact

- None. This round stays inside `wedding-cep` and does not change shared libs, bridge payloads, or JSX host code.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_v2_scan_service_scope.md`

## Notes Before Execution

- Keep `ScanAction.execute(...)` and scan result shape unchanged.
- Do not widen this round into bridge/JSX work or additional `Document Sync` policy splitting.
- This round is only justified because it completes the second public seam of the same bounded context.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `Document Sync` scan branch only, centered on `runScanDocument(...)` delegating to `document-sync/scanDocumentService.js` while keeping `ScanAction` and scan result shape stable.
Top Risks: moving scan normalization and invitation-side mapping could silently break operator-facing scan results; using the wrong Vietnamese literals for host or invitation type would create a domain regression even if tests still compiled.
Required Fixes: keep `ScanAction.execute(...)` unchanged; preserve scan return envelope `{ data, count }`; use correct Vietnamese domain literals for `Nhà Trai`, `Nhà Gái`, `Thành Hôn`, `Tân Hôn`, and related invitation mapping; keep bridge and JSX out of scope.
No Blocking Findings: Yes. This round cleanly completes the scan-side public seam of the same bounded context and stays within the `Document Sync V2` island rather than introducing another helper-only split.
Validation Rerun Needed: No beyond the execution evidence listed below.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `runScanDocument(...)` is now a thin facade over a named `document-sync` scan service; scan normalization and invitation-side mapping moved behind `runScanDocumentService(...)`; `ScanAction` contract and scan result shape stayed unchanged; the scan branch still passes full app smoke.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: this round does not yet change bridge-side scan transport or host frame extraction; `Document Sync` still spans separate scan and update services rather than one higher-level context root; no cross-context docs were updated in this runtime round.
Unverified But Suspected: none
