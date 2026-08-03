# Wedding Input Assistance Refactor V1

## Goal

Keep Input Assistance behavior stable while removing mutable singleton
registries and making its dependency boundaries explicit.

## Scope

- `InputEngine` factory and stable runtime facade
- Input field-type dispatch and existing normalizer/validator policies
- `FormLogic` dependency injection seam
- `AddressAutocomplete` host facade contract
- Deprecated `NameNormalizer` helper cleanup
- Characterization and isolation tests

## Non-goals

- No changes to Document Sync, SchemaInjector, JSX, domain rules, or UI
  layout.
- No changes to result shapes, warning messages, date logic, address separator
  policy, name splitting, or ethnic-name behavior.
- No Illustrator 2025 smoke lane.

## Invariants

- `InputEngineLike` still exposes `process(...)` and `validateDateLogic(...)`.
- The default `InputEngine` exposes only those stable methods.
- `createInputEngine(deps)` creates an isolated engine with private registries.
- Schema type resolution still takes precedence over key heuristics.
- `AddressAutocomplete.init()` receives `hostFacade` as its only host contract.
- Autocomplete keeps its 15-result limit and failure-soft reset behavior.
