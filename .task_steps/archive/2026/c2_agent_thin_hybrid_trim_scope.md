# C2: Thin `.agent` Hybrid Trim

## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: no
Shared Change: no
Cross-App Impact: yes

## Task Brief

- Intent: governance cleanup
- Route: /build
- Goal: keep `.agent` as a thin control plane, remove duplicated memory wrappers, and replace stale `.agent` doc links with current repo SSOTs
- Success Criteria: deleted wrapper surfaces are no longer referenced, active reference stores stay intact, and stale `.agent/plans/*` plus `.agent/domain_separation_standard.md` links are gone

## Scope Lock

- Summary: docs-and-comments-only cleanup across `.agent`, `.task_steps`, and `symbol-cep` header comments; no runtime behavior changes and no workflow-law redesign.
- Execution mode: single-writer cross-app governance cleanup with independent review and fresh-agent smoke tests after implementation.

## Files To Modify

- `.agent/README.md`
- `AGENT_OPERATING_MODEL.md`
- `.agent/memory/skills/ES3_ES6_Boundary/SKILL.md`
- `.agent/memory/skills/Wedding_Domain_Knowledge/SKILL.md`
- `symbol-cep/cep/jsx/features/core.jsx`
- `symbol-cep/cep/jsx/features/imposition_modules/mod_cleanup.jsx`
- `symbol-cep/cep/jsx/features/imposition_modules/mod_layout.jsx`
- `symbol-cep/cep/jsx/features/imposition_modules/mod_resize.jsx`
- `symbol-cep/cep/jsx/features/imposition_modules/mod_symbol.jsx`
- `symbol-cep/cep/jsx/features/imposition_modules/mod_yield_guides.jsx`
- `symbol-cep/cep/jsx/features/imposition_symbol.jsx`
- `.task_steps/c2_agent_thin_hybrid_trim_scope.md`

## Consumers Verified

- External Codex skills `adobe-cep-repo-context`, `cep-es3-es6-boundary`, and `wedding-domain-knowledge`
- Repo-local `Hexagonal_Rules`
- `symbol-cep` module header comments that currently point at deleted `.agent` paths

## Cross-App Impact

- Cleanup only. This changes internal agent guidance and comment references across repo-governance and `symbol-cep` surfaces.
- No package API, schema, or runtime behavior changes.
- `ES3_ES6_Boundary/references/*` and `Wedding_Domain_Knowledge/references/*` remain in place for active consumers.

## Validation Targets

- Repo-wide search returns zero references to deleted memory skill folders.
- Repo-wide search returns zero references to `.agent/plans/` and `.agent/domain_separation_standard.md`.
- Fresh-agent smoke tests pass for external `adobe-cep-repo-context`, external `cep-es3-es6-boundary`, external `wedding-domain-knowledge`, and repo-local `Hexagonal_Rules`.
- `npm run check:encoding`
- `npm run check:gates -- --file .task_steps/c2_agent_thin_hybrid_trim_scope.md`

## Notes Before Execution

- Keep `.agent/workflows/*`, gate skills, `.agent/README.md`, and `scripts/check_agent_gates.cjs` intact.
- Delete duplicated wrapper surfaces instead of replacing them with a new index or compatibility layer.
- Update external skills only if a post-cleanup smoke test shows compatibility drift.
- Some listed `symbol-cep` `.jsx` files already had unrelated runtime diffs in the working tree before this task. This cleanup only updates stale header-comment references in those files.

## Implementation Note

- Deleted duplicated memory wrappers `Project_Context`, `Code_Style_Standard`, `Coding_Principles`, `Code_Examples`, and `Deployment_Architecture`.
- Rewrote `ES3_ES6_Boundary` and `Wedding_Domain_Knowledge` as thin routing wrappers while preserving their active reference paths.
- Refreshed `Wedding_Domain_Knowledge` reference docs `architecture-mapping.md` and `adding-field-types.md` to match current repo routes and remove the deleted `Code_Examples` dependency.
- Updated stale `.agent/plans/*` and `.agent/domain_separation_standard.md` references in the targeted `symbol-cep` header comments only.
- Corrected one real mojibake phrase in `AGENT_OPERATING_MODEL.md`.
- Hygiene follow-up: removed the five empty retired skill directories and clarified in `.agent/README.md` that it is a thin maintainer map, not a full live-tree inventory.

## Review Gate

Scope Reviewed: `.agent` governance docs, retained wrapper/reference surfaces, deleted memory wrappers, and header-comment-only replacements in the listed `symbol-cep` files. Unrelated pre-existing runtime diffs already present in those same `symbol-cep` files were excluded from this review.
Top Risks: dirty-worktree noise could make the `symbol-cep` files look broader than this trim; external skills depend on the retained wedding and boundary reference paths; legacy app files could pick up unwanted line-ending drift during comment-only edits.
Required Fixes: clarify the C2 scope against pre-existing `symbol-cep` runtime diffs; refresh retained `Wedding_Domain_Knowledge` references that still pointed at removed legacy paths or deleted `Code_Examples`; correct the real mojibake phrase in `AGENT_OPERATING_MODEL.md`; all completed in this round.
No Blocking Findings: yes; after the scope clarification, wedding-reference refresh, and operating-model text fix, no blocker remains for the requested trim itself.
Validation Rerun Needed: yes; reran stale-reference searches, `npm run check:encoding`, and fresh-agent smoke tests after the follow-up documentation fixes.
