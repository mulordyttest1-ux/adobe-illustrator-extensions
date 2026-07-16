# C2: Wedding Suite PDF-Only Output

## Gate Policy

Workflow: build
Task Tier: D1-3
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Remove persistent/open review AI from Wedding Suite production builds, open the generated PDF, and retain AI only as a smoke artifact on failure.
- Execution mode: Implement the approved PDF-only output plan in `symbol-cep`; validate only on the 2026 smoke lane.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- focused unit tests beside the panel files
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- generated `symbol-cep/cep/js/bundle.js`

## Consumers Verified

- Wedding Suite Build PDF action and result toasts.
- PDF open-state, dirty-state, and QA-print bridge endpoints.
- Previous-output cleanup after a committed replacement.
- 2026 geometry smoke and temporary AI inspection.

## Cross-App Impact

- None. No `wedding-cep`, `libs/shared`, installer, or shared-domain code changed.

## Validation Targets

- Production requests do not enable debug capture or return `reviewPath`.
- Generated PDF is opened and remains the active output document.
- Dirty PDF blocks replacement; saved PDF can be closed and replaced.
- Smoke AI lives under the dedicated temp root, is deleted on pass, and remains available when validation throws.
- Temp cleanup and PDF-open failures are warnings after a successful PDF commit.

## Notes Before Execution

- Normalized request receipt: intent = architecture refactor; route = build; goal = PDF-only operator output with retain-on-failure smoke artifacts; success criteria = no persistent/open production AI and green 2026 smoke; constraints = ES3 host compatibility and no 2025 smoke; unknowns = none; approval needed = no.
- The generated PDF is intentionally opened after build, per the locked UX decision.

## Review Gate

Scope Reviewed: Host save lifecycle, temp-folder safety, panel/bridge contracts, dirty-output protection, smoke artifact retention, and cleanup behavior.
Top Risks: Illustrator changing document association during `saveAs`; deleting a temp path outside the owned root; losing the dirty-file guard when removing review AI.
Required Fixes: None after implementation review.
No Blocking Findings: The live smoke proved PDF open/active state, PDF dirty guard, geometry inspection, and pass-time artifact deletion; the temp job root was empty afterward.
Validation Rerun Needed: Yes; final unit, lint, build, syntax, and 2026 smoke checks are required after the final smoke-label cleanup.

## Verification Gate

Claims Verified: Production requests omit debug capture; generated PDF opens as the active output; PDF dirty state blocks rebuild; no production `reviewPath` remains; smoke AI is temporary and deleted on pass; legacy review AI is cleaned safely; warning-only failures do not invalidate a committed PDF.
Evidence Run: `npm.cmd run lint:symbol`; `npm.cmd --workspace imposition-panel-cep run test` (159/159); `npm.cmd run build:symbol`; JSX and smoke Node syntax checks; `npm.cmd --workspace imposition-panel-cep run test:smoke:2026` (46/46); post-smoke temp inspection reported `TempJobCount=0` and `LegacyReviewAiCount=0`.
Remaining Limits: Smoke failure retention is exercised by control flow and safe path policy; the passing aggregate lane necessarily deletes its artifact.
Unverified But Suspected: None.
