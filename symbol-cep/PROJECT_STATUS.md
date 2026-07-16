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
- `Preset / Config` is now facade-ready; persistence, tab-state shell, event workflow, and schema-edit workflow have named service seams under `cep/js/features/imposition/preset-config/`.
- The remaining config debt is renderer/shell composition pressure, not basic save-load or modal workflow separation.

## Main Surfaces

- Entry: `symbol-cep/cep/js/app.js`
- Action flow: `symbol-cep/cep/js/features/imposition/action_tab.js`
- Preflight: `symbol-cep/cep/js/features/imposition/preflight/PreflightOrchestrator.js`
- Postflight: `symbol-cep/cep/js/features/imposition/postflight/PostflightOrchestrator.js`
- Hook rule example: `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
