# Symbol CEP - Project Status

> Scope: CEP extension for Illustrator imposition workflows.
> Governance: follow root monorepo rules plus `symbol-cep/AGENTS.md`.
> Architecture source of truth: `symbol-cep/ARCHITECTURE.md`

## Current Health

- Build: `npm run build:symbol`
- Lint: `npm run lint:symbol`
- Smoke: `npm run test:smoke:symbol`
- Entry runtime: `symbol-cep/cep/js/app.js`
- HTML shell: `symbol-cep/cep/index.html`
- Host bridge entry: `symbol-cep/cep/jsx/host.jsx`
- Feature navigation: `symbol-cep/FEATURE_MAP.md`

## Architecture Summary

- `symbol-cep/cep/js/app.js` is the only supported panel composition root.
- The app centers on the imposition pipeline: preset/config, preflight, engine execution, and postflight hooks.
- Detailed runtime truth, layer boundaries, allowed dependency directions, and validation contracts now live in `symbol-cep/ARCHITECTURE.md`.
- Feature-level navigation lives in `symbol-cep/FEATURE_MAP.md`.
- Shared postflight terminology lives in `../POSTFLIGHT_TAXONOMY.md`.
- Runtime smoke remains the main regression guard for this app.
- `Preset / Config` now uses canonical drafts for all Config writes while mixed V4/V5 storage remains readable through the runtime adapter.
- `ConfigEngine` is pure, dynamic schema editing is limited to margin rows, and stale raw values are pruned when a row is removed.
- Preset switching now has a dirty-draft confirmation path; the old write-only `last_active` store was removed.
- Standard controls and pasteboard/schema-edit rendering now live behind dedicated adapters with characterization coverage.
- Config persistence compatibility branches are removed; `hydratePreset()` remains only as the required Action Tab/runtime facade for legacy reads.
- Wedding Suite Standard now has isolated panel policy/view/actions modules and
  an ES3 host composition split for source, render, and output lifecycle.
- Wedding Suite builds now reuse the host composition loaded at panel boot;
  repeated build-time host reloads were removed to avoid persistent-engine
  namespace accumulation and intermittent Illustrator `PARM` failures.
- Symbol smoke harness now keeps a thin runner and bounded scenario families;
  the supported smoke lane remains Illustrator 2026 on port `9198`.
- Symbol composition and policy boundaries are now covered by the developer
  architecture guard; this pass does not alter production runtime behavior.

## Main Surfaces

- Entry: `symbol-cep/cep/js/app.js`
- Action flow: `symbol-cep/cep/js/features/imposition/action_tab.js`
- Preflight: `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
- Postflight: `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- Hook rule example: `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- Wedding Suite panel facade: `symbol-cep/cep/js/features/wedding-suite-standard/WeddingSuiteTab.js`
- Wedding Suite host facade: `symbol-cep/cep/jsx/features/wedding_suite_standard.jsx`
