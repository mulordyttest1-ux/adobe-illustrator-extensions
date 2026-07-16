## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Add the first dedicated panel smoke lane for `wedding-cep / Document Sync` so the live scan/update write path no longer relies primarily on action, service, and strategy unit tests.
- Execution mode: Focused app-local coverage hardening. No runtime contract, bridge payload, host, or shared-lib changes.

## Files To Modify

- `.task_steps/c2_wedding_document_sync_smoke_parity_scope.md`
- `wedding-cep/cep/debug_scripts/test_smoke.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/document_sync_smoke_tests.cjs`

## Consumers Verified

- `.task_steps/c1_revenue_critical_workflow_hardening_program.md`
- `.task_steps/c1_wedding_document_sync_revenue_hardening_audit.md`
- `wedding-cep/cep/js/actions/ScanAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
- `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
- `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`

## Cross-App Impact

- None. This round only adds `wedding-cep` smoke coverage for the live `Document Sync` workflow.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_wedding_document_sync_smoke_parity_scope.md`

## Notes Before Execution

- Root cause from the audit: shield asymmetry, not a verified product-logic bug.
- The new smoke lane must use the real panel bridge instance and button wiring, but may monkey-patch methods on that instance inside the smoke expression.
- Do not expand `__WEDDING_TEST_API__` or the bridge contract for this round.
- Keep the suite dedicated to `Document Sync`; do not fold it into `core` or `postflight`.

## Verification Gate

Claims Verified: `wedding-cep / Document Sync` now has a dedicated panel smoke lane for the live scan path, the live update success path, and the live no-op update path; the suite uses the real compact-form button wiring and the real app bridge instance with per-test monkey patches, so the write path is no longer protected only by unit/service seams.
Evidence Run: `npm run lint:wedding` -> pass; `npm run build:wedding` -> pass; `npm run test:wedding` -> `316/316`; `npm run test:smoke:wedding` -> `21/21`; `npm run verify` -> pass.
Remaining Limits: This round hardens panel-side workflow coverage only. It does not add host-side selection fixtures for `Document Sync`, and it does not eliminate the trigger-based legacy assembler fallback debt.
Unverified But Suspected: none.

## Micro-Postmortem

- False assumption: the first scan smoke tried to read `ui.vithu_*` through `builder.getData()`, but the live scan flow writes those invitation-side values into `builder.data` even when the compact-form snapshot cannot round-trip them through current radio refs.
- False assumption: the first update smoke used the ASCII fixture `Tan Hon`, but the live compact form stores `info.ten_le` through radio values like `Tân Hôn`, so the write path rightfully treated the ASCII fixture as empty input.
- Guardrail added: future compact-form smoke fixtures should use the live form source-of-truth and actual option values before concluding that a workflow bug exists.
