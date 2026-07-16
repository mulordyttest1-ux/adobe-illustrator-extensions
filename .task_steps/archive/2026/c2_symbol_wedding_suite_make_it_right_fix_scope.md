# C2: Wedding Suite Make-It-Right Fix Scope

## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Harden Wedding Suite after the make-it-work phase by fixing the dirty-open-output guard so it survives host reloads, isolating the smoke lane from stale dirty AI files, and spacing the Envelope artboard far enough right that the rotated envelope no longer bleeds into QA counts.
- Execution mode: Focused `/fix` inside `symbol-cep` Wedding Suite panel + host seam only.

## Files To Modify

- `symbol-cep/cep/js/features/wedding-suite-standard/bridgeAdapter.js`
- `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Cross-App Impact

- None. Scope remains app-local to `symbol-cep`.

## Validation Targets

- `npm.cmd run lint:symbol`
- `npm.cmd --workspace imposition-panel-cep run test`
- `npm.cmd run build:symbol`
- `npm.cmd run test:smoke:symbol`

## Notes Before Execution

- Symptom: `OUTPUT_FILE_UNSAVED_OPEN` should have blocked rebuilds, but runtime smoke showed repeated successful rewrites because the host wrapper was missing even though `_buildJobPatchVersion` said it was installed.
- Symptom: smoke could false-fail on the first build if an older dirty AI with the same filename was still open from a prior run.
- Symptom: envelope geometry was locally correct but its 45-degree overflow bled left into QA, so QA counts drifted from the intended contract.

## Review Gate

Scope Reviewed: Wedding Suite bridge-host patch installation, runtime smoke isolation, and artboard spacing around the rotated envelope.
Top Risks: Reinstalling the wrapper too aggressively could wrap `buildJob` multiple times; changing the smoke output filename could hide a real regression if the dirty-file retry stopped using the same path inside one run; moving the Envelope artboard could accidentally break the golden local transform instead of just isolating overflow from QA.
Required Fixes: Detect patch installation from the live `buildJob` function marker instead of trusting `_buildJobPatchVersion` alone; keep smoke on one unique output path per run while still retrying the same path inside that run; compute left overflow from the envelope reference and use it only for artboard spacing.
No Blocking Findings: yes
Validation Rerun Needed: yes

## Verification Gate

Claims Verified: yes
- Wedding Suite now reinstalls the dirty-output guard whenever the live host `buildJob` no longer carries the expected wrapper marker, even if an old patch version flag is still set.
- Runtime smoke now uses a unique output filename per run, so stale dirty AI files from earlier runs do not block the first build or poison the lane.
- The Envelope artboard is offset far enough right that the rotated envelope no longer intersects QA, restoring the intended `QA` placed-item count.

Evidence Run: yes
- `npm.cmd run lint:symbol`
- `npm.cmd --workspace imposition-panel-cep run test`
- `npm.cmd run build:symbol`
- `npm.cmd run test:smoke:symbol`

Remaining Limits: yes
- This round still keeps Wedding Suite in AI-first debug mode; PDF-only delivery remains deferred.

Unverified But Suspected: no
