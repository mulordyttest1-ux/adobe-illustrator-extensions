# Symbol CEP Data Storage

This folder holds local persistence files for `symbol-cep`.

## Storage Contract

- `presets.json`
  - the authoritative preset source
  - may be managed externally via symlink
  - missing or broken content is treated as a storage configuration error, not a first-run bootstrap signal
- `presets.usage.json`
  - local sidecar for lightweight usage metadata
  - may be created locally by the panel
  - does not replace `presets.json` as the source of truth
- `wedding_suite_paper_stocks.json`
  - operator-editable paper stock catalog for the `Bộ thiệp` / Wedding Suite tab
  - change paper sizes here instead of editing planner/UI code
  - keep existing `id` values when possible so saved presets and recipes continue to resolve

## Runtime Owner

- Main runtime owner: `symbol-cep/cep/js/features/imposition/data_store.js`
- Wedding Suite paper stock owner: `symbol-cep/cep/js/features/wedding-suite-standard/paperStockConfig.js`
- Feature routing: `symbol-cep/FEATURE_MAP.md` under `Data / Persistence`

## Operational Notes

- `presets.json.bak` and `presets.usage.json.bak` are backup artifacts created by safe-write flows.
- If `presets.json` is missing, unreadable, or invalid JSON, treat that as a storage problem to fix rather than normal startup behavior.
- Usage metadata may fail independently of preset reads; that is a sidecar write/read issue, not loss of the main preset source.
- If `wedding_suite_paper_stocks.json` is missing or invalid, the panel falls back to its built-in safe catalog and logs a warning.

## Sharing

- To move presets across machines, carry `presets.json`.
- To move Wedding Suite paper stock settings across machines, carry `wedding_suite_paper_stocks.json`.
- `presets.usage.json` is optional and only preserves usage history.
