# C2 Template: Scope Lock and Gate Receipt

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Pivot `symbol-cep` Wedding Suite Standard from AI-first operator output to PDF-first operator output while keeping an internal review AI seam for runtime inspection and add a one-click QA print helper for artboards 1-2.
- Execution mode: Direct implementation after approved plan.

## Files To Modify

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- Wedding Suite panel operator flow in `symbol-cep`
- Wedding Suite host bridge adapter contract
- Wedding Suite host JSX build/review/dirty guard lifecycle
- Wedding Suite smoke/runtime geometry inspection seam

## Cross-App Impact

- None. Changes stay inside `symbol-cep`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`
- `npm run verify`

## Notes Before Execution

- Operator output must become PDF-first.
- Internal AI review seam may remain for debug/test/runtime inspection only.
- QA print helper must print only artboards 1-2 with fit-to-page.
- Dirty-open-output guard must keep working even after operator output stops being `.ai`.

## Review Gate

Scope Reviewed: Wedding Suite panel, bridge adapter, host save/export flow, and smoke/runtime seams.
Top Risks: Dirty-open-output guard drifting after operator AI removal; geometry inspection seam disappearing after PDF-first pivot; operator copy/buttons drifting back to AI-first wording.
Required Fixes: Use a deterministic internal review AI path derived from the public PDF output path; route review-state host endpoints through that review AI; update panel copy and smoke expectations to the PDF-first contract.
No Blocking Findings: yes
Validation Rerun Needed: yes

## Verification Gate

Claims Verified: Wedding Suite now exports a public PDF, keeps an internal review AI open at QA for review, preserves the dirty-open-output guard through the review AI path, and exposes a one-click `In QA + Bao Thu` seam without reverting operator copy to AI-first wording.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`; `npm run verify`
Remaining Limits: Smoke validates the QA print button state and bridge seam but does not fire a real printer job; operator flow is PDF-first but host still keeps an internal temp AI as the review/debug seam.
Unverified But Suspected: `printQaCheck()` should use the default Illustrator printer without UI, but real printer-device variance still needs workstation confirmation.
