# C2 Template: Scope Lock and Gate Receipt

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Update `symbol-cep` Wedding Suite Standard so real builds clone the operator-managed print template AI, render onto that cloned review document, keep the review AI open, and still export the public printer-facing PDF.
- Execution mode: Direct implementation after approved plan.

## Files To Modify

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/planner.test.mjs`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/build.cjs`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- Wedding Suite operator build flow in `symbol-cep`
- Wedding Suite panel-side request assembly
- Wedding Suite host review-document lifecycle
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

- The operator-managed template source of truth remains `symbol-cep/wedding suite print template.ai`.
- Runtime should consume a copy inside `symbol-cep/cep/` because the CEP extension runs from the `cep` junction.
- Real Wedding Suite builds must clone the template before rendering so Illustrator print settings travel with the review AI.
- Public operator output remains PDF-first.

## Review Gate

Scope Reviewed: Wedding Suite panel request assembly, CEP adapter template resolution, host template-clone lifecycle, and smoke/runtime coverage.
Top Risks: runtime resolving the wrong template path because CEP runs from the extension junction; template clone not actually being used even though the request carries a path; breaking the existing PDF-first + review-AI contract.
Required Fixes: resolve the template path relative to the CEP runtime folder, sync the operator-managed template into the CEP folder on build, add a host template-clone seam, and lock the new behavior in unit + smoke coverage.
No Blocking Findings: yes
Validation Rerun Needed: yes

## Verification Gate

Claims Verified: Wedding Suite now carries a template path in its build request, clones the synced CEP template into the review AI before rendering, keeps the review AI open for inspection, and still exports the public PDF output with the previous geometry contract intact.
Evidence Run: `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run test:smoke:symbol`
Remaining Limits: The template source of truth is still edited at `symbol-cep/wedding suite print template.ai`, then synced into `symbol-cep/cep/` on build. If the operator changes the root template again, they need the updated bundle/build step before runtime picks up the new copy.
Unverified But Suspected: The cloned review AI should preserve the same saved print settings as the operator-managed template because the build now starts from a copied AI file instead of a blank document.
