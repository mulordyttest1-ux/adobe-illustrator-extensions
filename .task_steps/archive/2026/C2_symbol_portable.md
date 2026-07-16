# C2 Scope Lock: Portable Configuration Storage

## Impacted File

1. `symbol-cep/cep/js/features/imposition/data_store.js`

This module was the main target for replacing or wrapping `localStorage` with file-based storage via `window.cep.fs`.

## Consumers

- `ActionTab` reads presets through `dataStore.getPresets()`.
- `ConfigPersistence` writes presets through `dataStore.savePreset()`.
- Bridge paths may indirectly depend on the stored preset data.

## Risks

- File permissions can fail in restricted environments.
- Migration is required so existing `localStorage` data is not lost when the file store is introduced.

## Scope Lock

- Keep the change inside `DataStore`.
- Preserve the public API so UI consumers do not need a larger refactor.
