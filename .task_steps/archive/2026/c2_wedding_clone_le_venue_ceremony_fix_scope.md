## Gate Policy

Workflow: fix
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Fix clone `lễ` so manual date clone also remaps `venue.*` tokens to `ceremony.*`, while keeping existing `tiệc -> venue` and `date.tiec -> date.<moc>` behavior intact.
- Execution mode: Focused bug fix in wedding app runtime + local use-case coverage.

## Files To Modify

- `wedding-cep/cep/js/logic/use-cases/manualInjection.js`
- `wedding-cep/cep/js/logic/use-cases/manualInjection.test.js`

## Consumers Verified

- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/components/schema-tab/schemaTabConfig.js`

## Cross-App Impact

- None. Change is isolated to `wedding-cep` manual clone flow.

## Validation Targets

- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`

## Notes Before Execution

- Symptom: `clone lễ` currently updates `date.tiec.* -> date.le.*` but leaves `venue.*` untouched, even though user expects `lễ + ceremony`, `tiệc + venue`.
- Expected: `clone lễ` should additionally remap `venue.* -> ceremony.*` in the same selected frame content.
- Actual: `buildDateClonePlans()` only matches `/\{date\.tiec\.[^}]+\}/g` and performs no venue/ceremony remap.
- Hypotheses:
  1. Root cause is in `buildDateClonePlans()` because it only scans `date.tiec.*`.
  2. `ManualInjectAction.injectDateClone()` passes the wrong target context.
  3. `applyPlan` writes replacements correctly, but clone plan generation is incomplete.
- Isolation:
  - `ManualInjectAction.injectDateClone()` only forwards `targetMoc` and plans from `buildDateClonePlans()`, so it is not the source.
  - `applyPlan` already applies arbitrary `ATOMIC` replacements, so it can handle extra `venue -> ceremony` replacements.
  - Root cause confirmed in `buildDateClonePlans()`.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: Manual date clone use-case and its direct tests only.
Top Risks: Accidentally changing `clone nháp` behavior, or reintroducing index drift in mixed replacements.
Required Fixes: Keep new venue/ceremony remap scoped to `targetMoc === 'le'` only and preserve descending replacement order after index restoration.
No Blocking Findings: Self-review found no blocking issues after confirming `clone nháp` still leaves `venue.*` untouched and mixed replacements stay ordered descending.
Validation Rerun Needed: no

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `clone lễ` now remaps `venue.* -> ceremony.*` in the same ATOMIC plan; `clone nháp` still only remaps `date.tiec.* -> date.nhap.*`; existing manual inject, smoke, and repo-wide verification remain green.
Evidence Run: `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run verify`
Remaining Limits: existing smoke does not yet include a dedicated venue/ceremony clone receipt; coverage is currently CI-safe at the use-case layer plus full smoke regression.
Unverified But Suspected: none
