# Wedding Scripter CEP

## Overview

- Source entry: `js/app.js`
- Runtime bundle: `js/bundle.js`
- HTML shell: `index.html`
- ExtendScript bridge endpoint: `jsx/illustrator.jsx`
- Architecture source of truth: `../ARCHITECTURE.md`

`app.js -> bootstrap/* -> bundle.js` is the only supported runtime bootstrap path.

## Navigation

- Scoped instructions: `../AGENTS.md`
- Feature routing: `../FEATURE_MAP.md`
- Architecture and boundary rules: `../ARCHITECTURE.md`
- Health/status: `../PROJECT_STATUS.md`

## Development Commands

```powershell
npm run lint:wedding
npm run build:wedding
npm run test:wedding
npm run test:domain:wedding
```

If you need to run inside the package:

```powershell
npm run lint
npm run build
npm run test
```

## Build Flow

1. `index.html` loads `js/bundle.js`.
2. `build.cjs` bundles `js/app.js` into `js/bundle.js`.
3. `app.js` creates the one runtime `HostFacade`, registers `window.__WEDDING_TEST_API__`, and starts the panel.
4. `main.js` was removed and must not be revived as a second entrypoint.

## Installation Notes

### Enable CEP debug mode

Windows:

```powershell
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f
```

macOS:

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

### Load the extension

- Symlink or copy `wedding-cep/cep/` into:
  - Windows: `%APPDATA%\Adobe\CEP\extensions\com.dinhson.weddingscripter`
- Restart Illustrator.
- Open the panel from `Window > Extensions > Wedding Scripter`.

### Debug

- Open Chrome at `http://localhost:8088`.
- Pick the extension to open DevTools.

## Architecture Notes

- Detailed architecture, layer rules, and retired surfaces live in `../ARCHITECTURE.md`.
- Feature-level navigation for agents and maintainers lives in `../FEATURE_MAP.md`.
- `js/app.js` is the only app-owned runtime source left at the `js/` top level.
- CEP transport and schema-loading boundaries live under `js/infrastructure/`.
- `@wedding/domain` stays pure and must not absorb CEP or UI concerns.
- Shared toast/loading/error surfaces go through `@shared/cep-ui`.
- ExtendScript in `jsx/` must remain ES3-compatible.
- `index.html` is the runtime source of the `Fuse` vendor script, and it must load `js/libs/fuse.basic.min.js` before `js/bundle.js`.
- Raw `Fuse` access is centralized behind the `logic/ux/search/` runtime adapter.
- Runtime internals are exposed to smoke only through `window.__WEDDING_TEST_API__`.
