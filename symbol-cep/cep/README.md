# Symbol CEP

## Overview

- Source entry: `js/app.js`
- Runtime bundle: `js/bundle.js`
- HTML shell: `index.html`
- CEP transport boundary: `js/bridge.js`
- Host entry: `jsx/host.jsx`
- Architecture source of truth: `../ARCHITECTURE.md`

`app.js -> feature slices -> bundle.js` is the only supported panel-side runtime path.

## Navigation

- Scoped instructions: `../AGENTS.md`
- Feature routing: `../FEATURE_MAP.md`
- Architecture and boundary rules: `../ARCHITECTURE.md`
- Health/status: `../PROJECT_STATUS.md`

## Development Commands

```powershell
npm run lint:symbol
npm run build:symbol
npm run test:smoke:symbol
```

If you need the focused in-package lane:

```powershell
npm run lint
npm run build
npm run test
```

## Build Flow

1. `index.html` loads `lib/CSInterface.js`, `js/libs/fuse.basic.min.js`, and `js/bundle.js`.
2. `build.cjs` bundles `js/app.js` into `js/bundle.js`.
3. `app.js` creates the runtime `Bridge`, feature tabs, and preflight/postflight orchestrators.
4. `window.Imposition` is the app-owned runtime surface for panel/debug integration.

## Architecture Notes

- Detailed layer rules and boundary contracts live in `../ARCHITECTURE.md`.
- Feature routing for agents and maintainers lives in `../FEATURE_MAP.md`.
- `js/app.js` is the only supported panel composition root.
- `js/bridge.js` is transport only and must not absorb feature policy.
- `jsx/` remains ES3-compatible and owns Illustrator host execution.
- `debug_scripts/` is for smoke/debug only and must not be treated as a production entry surface.
- Runtime smoke is the main regression guard for this app.
