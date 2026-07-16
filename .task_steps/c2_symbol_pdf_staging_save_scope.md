## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Stop Wedding Suite scripted PDF saves from failing on long operator filenames by staging under a short local temp path and committing with rollback.
- Execution mode: Focused Symbol host lifecycle fix; Illustrator 2026 validation only.

## Files To Modify

- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/smoke_suites/wedding_suite_smoke_tests.cjs`

## Consumers Verified

- Wedding Suite `buildJob()` PDF stage/close/commit sequence
- Previous-output replacement and open-output behavior
- Symbol 2026 Wedding Suite smoke scenario

## Cross-App Impact

- None.

## Validation Targets

- `npm --workspace imposition-panel-cep run test`
- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test:smoke:2026`

## Notes Before Execution

- Expected: scripted Build PDF saves the same long filename that Illustrator can save manually.
- Actual: Illustrator writes a `__wss_pdf_<stamp>_<full-long-name>.pdf` sibling, throws `The specified network location is unavailable`, and leaves the staging document open before commit.
- Hypothesis 1: output directory is unavailable. Rejected; output is local Desktop and manual save succeeds.
- Hypothesis 2: UNC source links alone prevent save. Rejected; a targeted one-page linked UNC probe saved successfully.
- Hypothesis 3: the script-only long sibling staging strategy is the trigger. Supported because the operator target is about 169 characters while script staging inflates it to about 211, and the failure occurs before `_stagePdfDocument()` can return despite a complete 20.6 MB staging file being written.

## Review Gate

Scope Reviewed: Host stage/close/commit lifecycle, existing-output replacement, rollback identity, long operator filenames, and smoke cleanup assertions.
Top Risks: ExtendScript `File.rename()` mutates file identity; replacing an existing target must preserve a restorable backup until the new copy is verified.
Required Fixes: Clone the target `File` from its path before backup rename and verify copied output length before deleting stage/backup.
No Blocking Findings: Yes, after the required fix and direct commit probe.
Validation Rerun Needed: Completed.

## Verification Gate

Claims Verified: Illustrator saves to a short job-local `output.pdf`; commit copies to the long operator filename; existing target uses rollback backup; stage and backup are removed after success; no long `__wss_pdf_` sibling is created.
Evidence Run: `npm --workspace imposition-panel-cep run test` (164/164); `npm run lint:symbol`; `npm run build:symbol`; `npm --workspace imposition-panel-cep run test:smoke:2026` (46/46 using a long output stem); direct host commit probe verified target exists with matching length, stage absent, and zero backups.
Remaining Limits: Illustrator 2025 smoke was intentionally not run. The failed pre-fix staging document remains open in Illustrator with its backing file already absent; it was not closed automatically to avoid discarding operator state.
Unverified But Suspected: The exact Illustrator error is likely emitted after writing the inflated sibling filename, but Illustrator does not expose a more precise save phase. The repaired path removes that strategy entirely.

## Postmortem

- Root cause: production staging reused the full operator filename and prepended an internal marker, coupling Illustrator `saveAs()` to an unnecessarily long output-folder path. If `saveAs()` threw after writing, `_stagePdfDocument()` never returned, so commit could not run and Illustrator retained a staging document.
- False hypotheses: output folder availability and UNC links alone were rejected by direct local-long-path and linked-UNC save probes.
- Guardrail: staging now has a fixed short job-local filename; smoke uses a long operator filename and rejects any sibling staging/backup residue.
- Reusable lesson: application-level save staging should use short internal paths and perform target replacement only after the authoring application has closed its working document.
