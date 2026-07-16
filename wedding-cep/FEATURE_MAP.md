# Wedding CEP Feature Map

> Source of truth for feature-level navigation in `wedding-cep`.
> Use this file when you know the user-facing workflow but do not yet know the implementation files.
> For layer rules and dependency boundaries, follow `wedding-cep/ARCHITECTURE.md`.
> For governance and high-level health, follow `wedding-cep/PROJECT_STATUS.md`.

## How To Use This Map

1. Find the workflow closest to the user request.
2. Start at the "Primary entrypoints" files before opening helpers or lower layers.
3. Follow the "Also touches" list only if the change crosses the boundary of the primary entrypoint.
4. Do not start from retired buckets such as `cep/js/controllers/` or `cep/js/components/modules/`.

## Runtime And Boot

Use for panel startup, readiness, tab boot, test API registration, or runtime wiring.

- Primary entrypoints:
  - `wedding-cep/cep/js/app.js`
  - `wedding-cep/cep/js/bootstrap/startup.js`
  - `wedding-cep/cep/js/bootstrap/startupResources.js`
  - `wedding-cep/cep/js/bootstrap/tabBoot.js`
  - `wedding-cep/cep/js/infrastructure/hostFacade.js`
- Also touches:
  - `wedding-cep/cep/js/infrastructure/schemaLoader.js`
  - `wedding-cep/cep/js/infrastructure/bridge.js`
  - `wedding-cep/cep/js/infrastructure/cepHost.js`

## Workspace / Form Entry

Use for the operator workspace, field rendering, field refs, form state, venue auto-fill wiring, and compact-form behavior.

- Primary entrypoints:
  - `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- Also touches:
  - `wedding-cep/cep/js/components/compact-form/FormComponents.js`
  - `wedding-cep/cep/js/components/compact-form/CompactFormBindings.js`
  - `wedding-cep/cep/js/components/compact-form/FormLogic.js`
  - `wedding-cep/cep/js/components/compact-form/CompactFormState.js`
  - `wedding-cep/cep/js/components/helpers/DomFactory.js`
  - `wedding-cep/cep/js/components/TabbedPanel.js`

Notes:

- Start from `CompactFormBuilder.js` for external work.
- Treat other files under `components/compact-form/` as internal unless you are already working inside that slice.

## Date Intelligence

Use for solar/lunar conversion, date-grid rendering, dependent date syncing, date-derived fields, and date-specific validation.

- Primary entrypoints:
  - `wedding-cep/cep/js/components/date-grid/DateGridController.js`
  - `wedding-cep/cep/js/components/date-grid/DateGridDOM.js`
  - `wedding-cep/cep/js/components/date-grid/DateGridWidget.js`
  - `wedding-cep/cep/js/logic/ux/InputEngine.js`
- Also touches:
  - `libs/wedding/domain/src/lib/date-logic.js`
  - `libs/wedding/domain/src/lib/calendar.js`
  - `libs/wedding/domain/src/lib/time.js`

## Input Assistance

Use for autocomplete, field-type routing, input normalization, name heuristics, and address heuristics.

- Primary entrypoints:
  - `wedding-cep/cep/js/logic/ux/InputEngine.js`
  - `wedding-cep/cep/js/logic/ux/input/FieldTypeResolver.js`
  - `wedding-cep/cep/js/logic/ux/AddressAutocomplete.js`
  - `wedding-cep/cep/js/logic/ux/search/FuseAddressIndex.js`
  - `wedding-cep/cep/js/logic/ux/validators/NameValidator.js`
  - `wedding-cep/cep/js/logic/ux/normalizers/EthnicNameNormalizer.js`
- Also touches:
  - `wedding-cep/cep/js/components/compact-form/AddressService.js`
  - `libs/wedding/domain/src/lib/name.js`
  - `libs/wedding/domain/src/lib/venue.js`

## Template Authoring

Use for schema-tab UI, auto inject, manual inject, bulk inject, date clone, template metadata inference, and schema-driven authoring.

- Primary entrypoints:
  - `wedding-cep/cep/js/components/schema-tab/SchemaTabComponents.js`
  - `wedding-cep/cep/js/components/schema-tab/schemaTabConfig.js`
  - `wedding-cep/cep/js/actions/InjectSchemaAction.js`
  - `wedding-cep/cep/js/actions/ManualInjectAction.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringService.js`
  - `wedding-cep/cep/js/logic/use-cases/injectSchemaDocument.js`
  - `wedding-cep/cep/js/logic/use-cases/manualInjection.js`
- Also touches:
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaService.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/injectSchemaDocumentService.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectService.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/manualInjectionPlanner.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/templateAuthoringIO.js`
  - `wedding-cep/cep/js/logic/schema/SchemaInjector.js`
  - `wedding-cep/cep/js/infrastructure/schemaLoader.js`
  - `wedding-cep/cep/jsx/illustrator.jsx`

Notes:

- Start from the action facades or compatibility use-cases first.
- Open `template-authoring/templateAuthoringService.js` first when the work crosses both auto and manual authoring paths.
- Treat other files under `logic/use-cases/template-authoring/` as internal unless the context root or compatibility entries route you there.
- Treat `SchemaInjector.js` as trigger-based core policy, not the default starting point.

## Document Sync

Use for scan, update, packet assembly, metadata encode/decode, reverse sync, strategy selection, and template-binding coverage.

- Primary entrypoints:
  - `wedding-cep/cep/js/actions/ScanAction.js`
  - `wedding-cep/cep/js/actions/UpdateAction.js`
  - `wedding-cep/cep/js/logic/use-cases/scanDocument.js`
  - `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- Also touches:
  - `wedding-cep/cep/js/logic/use-cases/applyStrategyUpdate.js`
  - `wedding-cep/cep/js/logic/strategies/StrategyOrchestrator.js`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.js`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js`
  - `wedding-cep/cep/js/logic/use-cases/support/strategyUpdateSupport.js`
  - `wedding-cep/cep/js/logic/pipeline/assembler.js`
  - `wedding-cep/cep/js/logic/use-cases/support/schemaMeta.js`
  - `wedding-cep/cep/jsx/illustrator.jsx`

## Platform / Illustrator Host

Use for CEP transport, host file access, selection-by-id, JSX eval, and Illustrator DOM operations.

- Primary entrypoints:
  - `wedding-cep/cep/js/infrastructure/hostFacade.js`
- Also touches:
  - `wedding-cep/cep/js/infrastructure/bridge.js`
  - `wedding-cep/cep/js/infrastructure/cepHost.js`
  - `wedding-cep/cep/jsx/illustrator.jsx`
  - `wedding-cep/cep/jsx/textFrameIds.jsx`
  - `wedding-cep/cep/jsx/hostValidation.jsx`
  - `wedding-cep/cep/js/infrastructure/schemaLoader.js`

Notes:

- In Slice 2 and later, start from `hostFacade.js` for host work unless the task is explicitly about raw adapter internals, `schemaLoader`, or JSX internals.

## Shared Domain

Use for wedding business rules that must stay UI-free and CEP-free.

- Primary entrypoints:
  - `libs/wedding/domain/src/index.ts`
  - `libs/wedding/domain/src/lib/date-logic.js`
  - `libs/wedding/domain/src/lib/calendar.js`
  - `libs/wedding/domain/src/lib/venue.js`
  - `libs/wedding/domain/src/lib/rules.js`
  - `libs/wedding/domain/src/lib/time.js`
  - `libs/wedding/domain/src/lib/name.js`

## Navigation Warnings

- Do not treat `cep/js/controllers/` as live runtime architecture.
- Do not add new code to `cep/js/components/modules/`.
- Do not start feature work from generic helpers if there is already a named slice entrypoint.
- If a task spans two feature areas, start from the user-facing workflow first, then follow imports downward.
