## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Ensure Wedding Suite Build PDF refreshes the live-linked host runtime, closes its temporary working document strictly, and finishes with the requested PDF open.
- Execution mode: Focused Symbol runtime bug fix; Illustrator 2026 validation only.

## Files To Modify

- `symbol-cep/cep/js/bridge.js`
- `symbol-cep/cep/js/bridge.test.mjs`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.test.mjs`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`

## Consumers Verified

- `symbol-cep/cep/js/features/runtime/appBoot.js`
- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- Symbol 2026 smoke Wedding Suite scenarios

## Cross-App Impact

- None. No shared library or Wedding Scripter code changes.

## Validation Targets

- `npm --workspace imposition-panel-cep run test`
- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test:smoke:2026`

## Notes Before Execution

- Expected: production build may use a temporary AI while rendering, but must close it before committing/opening the final PDF.
- Actual: a work panel can retain an older loaded JSX runtime, and critical document closes currently swallow failures.
- Hypothesis 1: work wrapper points to stale files. Rejected because source, work, and test2026 host JSX hashes are identical.
- Hypothesis 2: loaded work-panel host globals are stale. Supported because host JSX is evaluated at panel boot and remains resident in Illustrator.
- Hypothesis 3: temporary AI close can fail silently. Supported because `_safeCloseDocument` swallows both close failures while build continues.

## Review Gate

Scope Reviewed: Symbol panel Bridge reload boundary, Wedding Suite adapter routing, production PDF lifecycle, and 2026 smoke consumer.
Top Risks: ExtendScript may report reload failures as `Error 2: ...`, which must not be treated as a successful refresh.
Required Fixes: Broaden reload error detection and add direct Bridge loader tests.
No Blocking Findings: Required fix is implemented; no remaining blocking finding after review.
Validation Rerun Needed: Completed Symbol unit, lint, build, and 2026 smoke after the review fix.

## Verification Gate

Claims Verified: Build PDF refreshes the live-linked host before dispatch; production closes the temporary document strictly; generated PDF becomes the active Illustrator document; no `working.ai` or `artifact.ai` remains open after the 2026 smoke build.
Evidence Run: `npm --workspace imposition-panel-cep run test` (163/163); `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test:smoke:2026` (46/46); direct CDP/ExtendScript document inspection on port 9198 showed active `.pdf` and `tempAiOpen: []`.
Remaining Limits: An already-open work panel must be closed/reopened once to load the new panel bundle; after that, every Build PDF refreshes host JSX automatically. Illustrator 2025 smoke was intentionally not run.
Unverified But Suspected: None.

## Postmortem

- Root cause: live-linked files were current, but Illustrator could retain the older evaluated Wedding Suite global until panel restart; additionally, critical document closes used a best-effort helper that swallowed failures.
- False signal: identical source/work/test wrapper hashes proved installation sync, but did not prove the in-memory host runtime was current.
- Guardrail: Build PDF now reloads the host composition root before dispatch, rejects reload errors, and requires the temporary document to be absent before committing/opening the output PDF.
- Reusable lesson: live-link parity must be verified at both filesystem and in-memory host-runtime layers.
