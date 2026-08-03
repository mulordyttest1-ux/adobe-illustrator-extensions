# Wedding CEP - Project Status

> Scope: CEP extension for wedding invitation workflows in Adobe Illustrator.
> Governance: follow monorepo rules plus app-local lint and architecture checks.
> Architecture source of truth: `wedding-cep/ARCHITECTURE.md`

## Current Health

- Build: `npm run build:wedding`
- Lint: `npm run lint:wedding`
- Tests:
  - `npm run test:wedding`
  - `npm run test:domain:wedding`
  - `npm run test:smoke:wedding`
- Entry runtime: `wedding-cep/cep/js/app.js`
- Bundle runtime: `wedding-cep/cep/js/bundle.js`

## Architecture Summary

- `wedding-cep/cep/js/app.js` is the only supported runtime composition root.
- Runtime app no longer relies on `registerGlobals`, `runtimeModules`, or retired buckets like `controllers/` and `components/modules/`.
- App-owned globals are limited to `window.__WEDDING_APP_READY__` and `window.__WEDDING_TEST_API__`.
- Detailed folder rules, boundary rules, retired surfaces, and next phases live in `wedding-cep/ARCHITECTURE.md`.
- Feature-level navigation lives in `wedding-cep/FEATURE_MAP.md`.
- `Document Sync` and `Template Authoring` are now facade-ready bounded contexts.
- Document Sync now uses one canonical `HostFacade` dependency path, a stateless assembler, and a reduced strategy-planning surface.
- `Input Assistance` now uses an isolated `createInputEngine(deps)` factory,
  a stable default facade, and a hostFacade-only autocomplete contract.
- `Template Authoring` now routes through one context root at `template-authoring/templateAuthoringService.js`; `SchemaInjector` remains trigger-based core policy.
- Operator runtime no longer includes a postflight report surface; update/inject flows stay toast-driven.
- `HostFacade` is now the only app-facing platform seam; raw `bridge.js` and `cepHost.js` are internal-only adapters behind it.
- Enforcement continues through:
  - `@nx/enforce-module-boundaries`
  - `wedding-cep/cep/scripts/check_architecture.cjs`

## Main Files

- Entry: `wedding-cep/cep/js/app.js`
- Bundle: `wedding-cep/cep/js/bundle.js`
- HTML shell: `wedding-cep/cep/index.html`
- Host seam: `wedding-cep/cep/js/infrastructure/hostFacade.js`
- Raw bridge transport: `wedding-cep/cep/js/infrastructure/bridge.js`
- Schema loader: `wedding-cep/cep/js/infrastructure/schemaLoader.js`
- Domain package: `libs/wedding/domain/src/index.ts`
