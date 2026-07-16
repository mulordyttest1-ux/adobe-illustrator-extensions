## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `symbol-cep/cep/data/README.md` still describes an older preset-storage model and no longer matches the runtime contract in `data_store.js`.
- Goal: rewrite the leaf-local preset storage README so it matches the current storage contract and no longer misleads maintainers about bootstrap, portability, or sidecar files.
- Non-goals: do not change storage code, do not rename files, and do not widen this into a persistence refactor.

## Scope Lock

- Summary: refresh `symbol-cep/cep/data/README.md` only.
- Execution mode: docs-only app-local cleanup for `symbol-cep` data/persistence.

## Files To Modify

- `symbol-cep/cep/data/README.md`

## Consumers Verified

- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/cep/js/features/imposition/data_store.js`

## Cross-App Impact

- None. This milestone only fixes one leaf-local `symbol-cep` data doc.

## Validation Targets

- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_symbol_preset_storage_readme_scope.md`

## Notes Before Execution

- Keep the README aligned to the runtime storage contract in `data_store.js`.
- Treat this as a staleness cleanup, not an encoding fix.

## Implementation Note

- Rewrote `symbol-cep/cep/data/README.md` to match the current storage contract owned by `data_store.js`.
- The README now distinguishes:
  - `presets.json` as the authoritative preset source
  - `presets.usage.json` as the local usage sidecar
  - `.bak` files as safe-write backup artifacts
- Removed the outdated wording that implied `presets.json` is simply generated on first use.

## Review Gate

Scope Reviewed: `symbol-cep/cep/data/README.md` only, with contract cross-check against `symbol-cep/cep/js/features/imposition/data_store.js`.
Top Risks: restating the storage contract incorrectly, or over-explaining implementation details that belong in code rather than in a leaf-local README.
Required Fixes: none after implementation; the final text stays aligned to the runtime contract and keeps the README focused on operator/maintainer-facing storage facts.
No Blocking Findings: yes; self-review found no need to change feature maps or runtime code.
Validation Rerun Needed: yes; reran `check:encoding` and the gate check after rewriting the README.

## Verification Gate

Claims Verified: `symbol-cep/cep/data/README.md` now reflects the live storage contract in `data_store.js` and no longer describes `presets.json` as a first-run bootstrap artifact.
Evidence Run: manual cross-check against `symbol-cep/cep/js/features/imposition/data_store.js`; `npm run check:encoding`; `npm run check:gates -- --file .task_steps/c2_symbol_preset_storage_readme_scope.md`.
Remaining Limits: this is a leaf-local docs cleanup only; it does not validate storage behavior at runtime because no product code changed.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the smallest remaining live markdown cleanup after the larger front-door alignment work.
- Benefit: the last app-leaf doc that still told an older storage story now matches the current persistence contract.
- Boundaries held: no runtime code, no app-front-door docs, and no persistence behavior changes.
