# Symbol Config Refactor V1

## Scope

Refactor the Symbol CEP Preset / Config bounded context into decoupled panel-side
islands. Preserve the operator workflow and the existing Action Tab runtime
facade. Do not change JSX, bridge payloads, imposition engine behavior, or
Wedding Suite.

## Requirements

- V4 and V5 preset entries can coexist in one storage container.
- Legacy entries migrate on read; only the preset being saved is serialized as
  canonical V5.
- Canonical drafts contain identity, schema id, dynamic margin extensions,
  values, and timestamps. Derived runtime mirrors are rebuilt by an adapter.
- Unknown schema extensions fail clearly and do not write data.
- Config draft dirty state is owned by `ConfigDraftStore`.
- The Config pane is routed through a nine-adapter registry in groups A, B, and
  C without repository or runtime mapping in renderer code.
- Keep `hydratePreset()` as the compatibility facade for Action Tab and runtime
  callers.
- Validate only against the Illustrator 2026 smoke lane.

## Non-Goals

- No migration rewrite of `symbol-cep/cep/data/presets.json`.
- No JSX, bridge, imposition engine, Wedding Suite, or installer changes.
- No removal of the legacy adapter until all external facade consumers have a
  replacement contract and characterization coverage.
