# C2 Scope Lock: Ingestion Sanitizer

## Goal

Find every raw data ingestion point that should be protected by `IngestionSanitizer` without scattering the cleanup logic across many actions.

## Raw Input Paths Identified

1. `cep/js/actions/ScanAction.js`
2. `cep/js/actions/PostflightAction.js`
3. `cep/js/actions/ManualInjectAction.js`
4. `cep/js/actions/InjectSchemaAction.js`
5. `cep/js/controllers/helpers/WeddingProActionHandler.js`

## Recommended Injection Point

Do not patch all five call sites individually. The centralized choke point is `bridge.js`.

- Wrap `scanDocument()`
- Wrap `readSelectionObjects()`
- Wrap `collectFrames()`

Each of these should sanitize `res.data` before returning it to upper layers.

## Scope Lock

- Create `cep/js/logic/pipeline/IngestionSanitizer.js`
- Update `cep/js/bridge.js`
- Update related C1/C2 artifacts in `.task_steps` using the current naming convention
