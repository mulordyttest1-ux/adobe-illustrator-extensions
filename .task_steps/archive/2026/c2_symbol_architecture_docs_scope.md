## Gate Policy

Workflow: build
Task Tier: D1-1
Code Change: no
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: `symbol-cep` has a strong `FEATURE_MAP.md`, but it still lacks a single architecture source of truth. `PROJECT_STATUS.md` is carrying partial architecture notes, and `cep/README.md` still reads like a generic CEP shell template instead of this app's actual architecture.
- Goal: create `symbol-cep/ARCHITECTURE.md` as the source of truth, then thin and relink surrounding docs so agents can route by `AGENTS -> FEATURE_MAP -> ARCHITECTURE -> PROJECT_STATUS`.
- Non-goals: do not move files, do not refactor runtime code, and do not turn this into a cross-app docs initiative.

## Scope Lock

- Summary: Add `symbol-cep/ARCHITECTURE.md` and align `FEATURE_MAP.md`, `PROJECT_STATUS.md`, `cep/README.md`, and `AGENTS.md` around it.
- Execution mode: docs-only app-local cleanup for `symbol-cep`; no runtime or host changes.

## Files To Modify

- `symbol-cep/ARCHITECTURE.md`
- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/PROJECT_STATUS.md`
- `symbol-cep/cep/README.md`
- `symbol-cep/AGENTS.md`

## Consumers Verified

- `symbol-cep/FEATURE_MAP.md`
- `symbol-cep/PROJECT_STATUS.md`
- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/bridge.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`

## Cross-App Impact

- None. This milestone only clarifies `symbol-cep` docs and does not change cross-app taxonomy.

## Validation Targets

- `npm run check:encoding`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/c2_symbol_architecture_docs_scope.md`

## Notes Before Execution

- `ARCHITECTURE.md` becomes the source of truth for architecture and boundaries.
- `FEATURE_MAP.md` stays feature-routing only.
- `PROJECT_STATUS.md` stays health/status only.
- `cep/README.md` should become a local runtime/readme, not a generic CEP manifesto.

## Implementation Note

- Added `symbol-cep/ARCHITECTURE.md` as the first app-owned architecture source of truth for runtime entrypoints, layer boundaries, feature slice contracts, and validation lanes.
- Tightened `symbol-cep/FEATURE_MAP.md` so it now points to `ARCHITECTURE.md` for boundary rules instead of carrying architecture drift itself.
- Trimmed `symbol-cep/PROJECT_STATUS.md` back to health/status plus a short architecture summary that points to the new source of truth.
- Replaced the generic `symbol-cep/cep/README.md` shell text with an app-specific runtime README that routes readers to `AGENTS`, `FEATURE_MAP`, `ARCHITECTURE`, and `PROJECT_STATUS`.
- Added one scoped routing line in `symbol-cep/AGENTS.md` so future agents open the right docs in the right order.

## Review Gate

Scope Reviewed: docs-only `symbol-cep` routing and architecture surfaces: `ARCHITECTURE.md`, `FEATURE_MAP.md`, `PROJECT_STATUS.md`, `cep/README.md`, and `AGENTS.md`.
Top Risks: creating a second conflicting source of truth, leaving generic CEP-shell guidance in place, or overstating architecture claims that do not match `cep/js/app.js`, `cep/js/bridge.js`, and the current feature slices.
Required Fixes: none after implementation; the final wording keeps `FEATURE_MAP.md` for routing, `ARCHITECTURE.md` for boundaries, and `PROJECT_STATUS.md` for health/status only.
No Blocking Findings: yes; self-review found no conflict with root `AGENTS.md`, `symbol-cep/AGENTS.md`, or the current runtime layout.
Validation Rerun Needed: yes; reran `check:encoding`, full `verify`, and the gate check after updating the docs chain.

## Verification Gate

Claims Verified: `symbol-cep` now has an app-owned architecture source of truth; the agent routing chain is now `AGENTS -> FEATURE_MAP -> ARCHITECTURE -> PROJECT_STATUS`; and `symbol-cep/cep/README.md` no longer presents stale generic CEP-shell guidance as if it were this app's architecture.
Evidence Run: `npm run check:encoding`; `npm run verify`; `npm run check:gates -- --file .task_steps/c2_symbol_architecture_docs_scope.md`.
Remaining Limits: this is a docs-only milestone; it improves routing clarity and boundary readability, but it does not reduce the underlying runtime dependence on smoke as the main regression guard.
Unverified But Suspected: none.

## Postmortem

- Outcome: pass. This was the cleanest next milestone after the operating-model pilot because `symbol-cep` still lacked the architecture source-of-truth pattern already working well in `wedding-cep`.
- Benefit: future agents can now route into `symbol-cep` without inferring architecture from `PROJECT_STATUS.md` or from a generic CEP README, which lowers feature-discovery noise before any deeper refactor.
- Boundaries held: no runtime code, no shared libs, no cross-app taxonomy changes, and no workflow-law files were touched.
