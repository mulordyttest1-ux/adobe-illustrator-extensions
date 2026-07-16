## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Task Brief

- Problem: the wedding test lane exposed a real `DateNormalizer` regression where typed date/time text aliases such as `ngày 5`, `ngay 5`, and `giờ 7` were not normalized reliably, which broke the `DateNormalizer` suite and weakened real operator input handling.
- Goal: reproduce the alias extraction failure, fix it in the normalizer-local helper, and restore the wedding baseline without widening the work beyond input-assistance date parsing.
- Non-goals: do not redesign `InputEngine`, `DateValidator`, or date-grid logic; do not move date policy into shared/domain code.

## Scope Lock

- Summary: fix alias extraction in `dateNormalizationSupport.js`, add focused test coverage for accentless and prefix-based date/time text, and rerun the wedding validation lane.
- Execution mode: single-writer local bug fix in `wedding-cep` `Input Assistance`.

## Files To Modify

- `wedding-cep/cep/js/logic/ux/normalizers/dateNormalizationSupport.js`
- `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.test.js`
- `.task_steps/c2_wedding_date_normalizer_alias_fix_scope.md`

## Consumers Verified

- `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.js`
- `wedding-cep/cep/js/logic/ux/InputEngine.js`
- `wedding-cep/cep/js/logic/ux/normalizers/DateNormalizer.test.js`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/ARCHITECTURE.md`

## Cross-App Impact

- None. This is app-local input-assistance date parsing maintenance.

## Validation Targets

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run check:gates -- --file .task_steps/c2_wedding_date_normalizer_alias_fix_scope.md`

## Notes Before Execution

- Keep `DateNormalizer` as the public normalizer seam.
- Keep the fix inside the normalizer-local helper.
- Preserve current typo recovery and zero-padding behavior outside the reproduced alias cases.

## Implementation Note

- Reproduced the failing alias cases through the wedding test lane and isolated the bug to `extractDateNumber(...)` inside `dateNormalizationSupport.js`, not to `InputEngine` or `DateValidator`.
- Updated the helper so day and month parsing accept both accented and accentless aliases, and hour parsing now supports both prefix form (`giờ 7`, `gio 7`) and suffix form (`7 giờ`, `15h`) while keeping the existing typo-recovery and zero-padding flow.
- Extended `DateNormalizer.test.js` with focused coverage for `ngay 5`, `gio 7`, and prefix/suffix hour extraction to lock the reproduced regression path.

## Verification Gate

Claims Verified: `DateNormalizer` remains the public normalizer seam; alias extraction now handles the reproduced day/hour text inputs; and the full wedding lint/build/test/smoke lane is back to green after the fix.
Evidence Run: `npm run lint:wedding`; `npm run build:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`; `npm run check:gates -- --file .task_steps/c2_wedding_date_normalizer_alias_fix_scope.md`.
Remaining Limits: this fix stays inside the normalizer-local helper; it does not redesign broader date parsing policy or move date alias rules into shared/domain code.
Unverified But Suspected: if operators start typing many more free-form Vietnamese date phrases, `DateNormalizer` may eventually need a richer alias table, but the current blocker is resolved for the known shorthand and prefix/suffix forms.
