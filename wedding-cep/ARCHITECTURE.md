# Wedding CEP Architecture

> Source of truth for `wedding-cep` runtime architecture, folder conventions, and boundary contracts.
> When README, PROJECT_STATUS, or old notes disagree with this file, follow this file.

## Purpose

- Keep `wedding-cep` maintainable while still respecting CEP and ExtendScript constraints.
- Make runtime boundaries, allowed dependencies, and test contracts explicit.
- Prevent drift back into legacy globals, duplicate entrypoints, and mixed-responsibility modules.
- Keep feature-level navigation explicit through `wedding-cep/FEATURE_MAP.md`.

## Runtime Truth

1. `cep/index.html` loads `cep/js/bundle.js`.
2. `cep/build.cjs` bundles `cep/js/app.js` into `cep/js/bundle.js`.
3. `cep/js/app.js` is the only supported composition root.
4. `app.js` creates exactly one runtime `HostFacade` plus one test/smoke-only `debugHost`.
5. `app.js` registers `window.__WEDDING_TEST_API__` and starts `initApp(...)`.
6. `cep/js/bootstrap/startup.js` owns panel bootstrapping and readiness state.

## App-Owned Global Contract

Only these app-owned globals are allowed:

- `window.__WEDDING_APP_READY__`
- `window.__WEDDING_TEST_API__`

Everything else must stay behind imports, dependency injection, or CEP vendor globals.

## Layer Map

### `cep/js/bootstrap/`

Boot orchestration and runtime wiring.

- Owns readiness state and startup flow.
- Wires buttons, tabs, and test API registration.
- May depend on `components/`, `actions/`, `infrastructure/`, and `logic/`.

### `cep/js/infrastructure/`

CEP host integration and boundary adapters.

- Owns CEP transport, schema loading, and host-side file access adapters.
- Must not absorb app business logic.

### `cep/js/actions/`

Thin UI orchestration.

- Reads UI state from builder/widgets.
- Calls use-cases or bridge operations.
- Shows toast/loading/report surfaces.
- Must not keep deep business rules inline.

### `cep/js/components/`

UI slices and view-level helpers.

Current named slices:

- `compact-form/`
- `date-grid/`
- `schema-tab/`

Rules:

- New runtime UI code must live in a named slice, not a generic bucket.
- Components may use logic helpers, but bridge/CEP ownership belongs in actions/bootstrap/infrastructure.

### `cep/js/logic/`

Application logic, data shaping, parsing, and pure-ish orchestration.

Current sublayers:

- `core/`
- `pipeline/`
- `schema/`
- `strategies/`
- `use-cases/`
- `ux/`

Rules:

- `logic/` must not import `components/`, `actions/`, or bridge infrastructure.
- `core/` stays isolated from upper layers.
- `pipeline/` stays free of UI-facing imports.

### `cep/jsx/`

ExtendScript host layer.

- Must remain ES3-compatible.
- Owns Illustrator document/frame operations.
- Must not duplicate application-level orchestration that belongs in panel-side JS.

## Canonical Module Taxonomy

Use this taxonomy when creating or migrating runtime code inside `wedding-cep`.

### `Facade`

- public entrypoint for one bounded context
- owns thin orchestration and stable calling contract
- callers outside the context should start here first

### `Service / Support`

- runtime mechanics internal to one context
- may support a facade, widget, or action seam
- must not become the public entry by accident

### `Policy / Domain`

- planners, validators, normalizers, rules, and pure decision logic
- should stay free of DOM, bridge, and CEP transport side effects
- may be shared inside the app only through explicit boundaries

### `Adapter`

- CEP, JSX, host, storage, or other IO boundary
- transport and serialization only
- must not absorb application policy

### `Config / Data`

- schema tables, config descriptors, preset-like static data, or fixtures
- should not become a second executable logic layer

## Migration Matrix

### Facade-ready

- Runtime / Boot
- Workspace / Form Entry
- Date Intelligence
- Input Assistance
- Template Authoring
- Document Sync

### Next v2 islands

- None by default. Reopen a new island only when a real policy, runtime, or validation trigger appears.

### Deferred / trigger only

- Platform / Illustrator Host

## Top-Level `cep/js/`

- `cep/js/app.js` is the only app-owned runtime source allowed at the top level.
- Other top-level files are limited to bundle output, vendor libraries, type notes, and tests.
- Do not add new top-level runtime boundary files. Place runtime code inside `bootstrap/`, `infrastructure/`, `components/`, `actions/`, or `logic/`.

Implemented boundary:

- `HostFacade` lives in `cep/js/infrastructure/hostFacade.js`.
- `Bridge` and `cepHost` remain raw adapters behind `HostFacade`.
- `SchemaLoader` lives in `cep/js/infrastructure/schemaLoader.js`.

## Public Seam Registry

Slice 1 freezes the current living public seams before deeper refactors.

- `Workspace / Form Entry`
  - public seam: `cep/js/components/compact-form/CompactFormBuilder.js`
  - internal-only outside the slice: `*Support.js`, `FormLogic.js`, `FormComponents.js`, `CompactFormBindings.js`, `CompactFormState.js`
- `Document Sync`
  - public seams: `cep/js/logic/use-cases/scanDocument.js`, `cep/js/logic/use-cases/updateDocument.js`
  - internal-only outside the context: `cep/js/logic/use-cases/document-sync/*`
- `Template Authoring`
  - public seam: `cep/js/logic/use-cases/template-authoring/templateAuthoringService.js`
  - temporary compatibility seams: `cep/js/logic/use-cases/manualInjection.js`, `cep/js/logic/use-cases/injectSchemaDocument.js`
  - internal-only outside the context: other files under `cep/js/logic/use-cases/template-authoring/`
- `Platform / Illustrator Host`
  - public host seam in Slice 2: `cep/js/infrastructure/hostFacade.js`
  - raw internal adapters: `cep/js/infrastructure/bridge.js`, `cep/js/infrastructure/cepHost.js`
- `Schema Tab`
  - temporary UI/public metadata seams in Slice 1: `cep/js/components/schema-tab/SchemaTabComponents.js`, `cep/js/components/schema-tab/schemaTabConfig.js`

Do not add a generic `cep/js/facades/` bucket. Public seams must live inside the bounded context that owns them.

## Feature Slice Contracts

### Compact Form

Location:

- `cep/js/components/compact-form/`

Contract:

- `CompactFormBuilder` is the public slice entry.
- State, bindings, and rendering stay separated.
- Actions talk to the builder, not to internal field helpers.
- External callers must not import compact-form internals directly once a builder-facing seam exists.

### Date Grid

Location:

- `cep/js/components/date-grid/`

Contract:

- Date grid is owned by compact form.
- Widget is instance-owned, not a mutable module singleton.
- Action layer triggers recompute through builder-facing methods.

### Schema Tab

Location:

- `cep/js/components/schema-tab/`

Contract:

- Rendering is config-driven.
- Wiring dispatches by action metadata, not ad-hoc button-name branching.
- `SchemaTabComponents.js` and `schemaTabConfig.js` are temporary public UI seams in Slice 1, not a dedicated top-level facade.

## Domain Boundary

- `libs/wedding/domain` is pure domain logic imported through `@wedding/domain`.
- CEP/UI layers must not push UI, host, or panel concerns back into domain.

## CEP and Selection Boundary

- `HostFacade` is the only app-facing host seam.
- `Bridge` is transport only and may only be imported by `HostFacade`.
- `SchemaLoader` is an infrastructure boundary, not a top-level runtime special case.
- CEP host access is centralized through `cep/js/infrastructure/cepHost.js`, but that adapter is internal-only behind `HostFacade`.
- `selectFramesById(ids)` uses stable UUID semantics, not selection index semantics.
- Smoke receipts must protect this boundary with real Illustrator selection where practical.

## Validation Contract

### CI-Safe Validation

- `npm run lint:wedding`
- `npm run build:wedding`
- `npm run test:wedding`
- `npm run test:domain:wedding`

### Integration Validation

- `npm run test:smoke:wedding`

Smoke is expected to cover at least:

- app readiness and startup shell
- scan/update happy paths
- schema inject flows
- CEP/JSX selection-by-id behavior with real Illustrator selection

## Retired Surfaces

These surfaces are retired and must not be revived:

- `cep/js/main.js`
- `cep/js/controllers/`
- `cep/js/components/modules/`
- postflight operator runtime (`PostflightAction`, report widget, and related validator/report slices)
- app-owned globals beyond `__WEDDING_APP_READY__` and `__WEDDING_TEST_API__`
- `registerGlobals` / `runtimeModules` as runtime source of truth

## Current Remaining Debt

The highest-value remaining debts are:

1. `SchemaInjector` core should stay untouched until there is a real policy or clone/infer bug, not just because it remains central.
2. Platform / host work should continue from `HostFacade`, not by re-exposing raw bridge or CEP host adapters.
3. Future architecture work should prefer new bounded-context triggers over more symmetry cleanup inside already facade-ready slices.

## Recent Completed Phases

### P1

Split startup into a clearer boot pipeline:

- readiness state
- host/data init
- tab/controller boot
- shell error handling

### P2

Separate production JSX bridge code from smoke/debug host infrastructure.

### P3

Rationalize `logic/ux/` into clearer internal slices and vendor boundaries.

Implemented shape:

- `InputEngine` keeps the public facade, while `ux/input/FieldTypeResolver.js` owns field-type routing.
- `AddressAutocomplete` keeps the public facade, while `ux/search/FuseAddressIndex.js` is the only runtime adapter allowed to touch `Fuse`.
- Name heuristics stay behind `NameValidator` and `EthnicNameNormalizer`, with direct CI-safe coverage.

## Planned Next Phase

### P4

Build `Document Sync` as the next `v2 island`:

- keep actions as facades
- separate orchestration from strategy/policy modules
- preserve current scan/update runtime contracts while tightening internal boundaries

### P5

Continue slice-based facade migration:

- keep `SchemaInjector` work policy-driven, not symmetry-driven
- finish `Workspace`, `Document Sync`, and `Template Authoring` cutovers on top of `HostFacade`
- prefer docs and routing alignment once a bounded context becomes facade-ready

## Recent V2 Island Progress

### Document Sync V2

Completed bounded-context upgrades:

- `runScanDocument(...)` and `runUpdateDocument(...)` now act as the public `Document Sync` seams over named `document-sync` services.
- `applyStrategyUpdate(...)` delegates planning through `StrategyOrchestrator.planFrames(...)`.
- `assembler.js` now supports dependency-injected assembly through `assembleWith(...)` for the update path.
- Scan and update contracts stayed stable for `ScanAction` and `UpdateAction`.

### Template Authoring V2

Current bounded-context shape:

- `InjectSchemaAction` and `ManualInjectAction` now act as facades.
- `template-authoring/templateAuthoringService.js` is the shared public context root above auto and manual authoring paths.
- Auto inject orchestration lives behind `template-authoring/injectSchemaService.js`.
- Manual inject orchestration lives behind `template-authoring/manualInjectService.js`.
- Manual inject planners now live behind `template-authoring/manualInjectionPlanner.js`, with `manualInjection.js` kept as a compatibility facade.
- `injectSchemaDocument.js` delegates into `template-authoring/injectSchemaDocumentService.js`.

Still not done:

- `SchemaInjector` remains the core policy engine and is intentionally unchanged until a real product trigger appears
