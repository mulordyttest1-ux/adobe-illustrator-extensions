# Legacy Compatibility Map

> Active compatibility inventory for GPT coding agents. Legacy seams are
> supported boundaries, not examples for new implementation.

## Rules

- New code must start from the current facade listed below.
- Do not import a legacy adapter from a new bounded context.
- Do not delete a compatibility seam because it looks unused; verify production
  callers, migration state, and characterization coverage first.
- Removal requires a dedicated spec, explicit data/payload migration, and the
  validation gate named in this map.

## Active Compatibility Seams

| Context | Legacy input/seam | Current path | Allowed purpose | Removal trigger |
| --- | --- | --- | --- | --- |
| Symbol Preset / Config | V4 presets with embedded schema, `rawValues`, `processingOptions`, `options`, `geometry`, and `info_template` | `preset_migrator.js` -> canonical draft -> `runtime_preset_adapter.js` | Read existing presets while Config writes V5 through `getDraftById()` / `saveDraft()` | Every built-in and user preset is migrated, V4/V5 characterization remains green, and rollback data exists |
| Symbol Runtime | `legacy_preset_adapter.js` and `processing_options.js` mirrors | `hydratePreset()` facade | Preserve Action Tab and JSX payload/result contracts | Runtime contract is versioned and no production caller consumes legacy mirrors |
| Wedding Template Authoring | `logic/use-cases/manualInjection.js` and `injectSchemaDocument.js` | `template-authoring/templateAuthoringService.js`, `manualInjectService.js`, and `injectSchemaDocumentService.js` | Keep current action/use-case callers stable while internal planners stay context-private | Repo search proves no production callers, action tests use the current facade, and Wedding 2026 smoke passes |
| Wedding Schema/Host | `bridge` aliases passed beside `hostFacade` in Schema Tab and template-authoring calls | `infrastructure/hostFacade.js` | Preserve Schema Tab payload shape while Document Sync remains HostFacade-only | Schema Tab callers and tests use `hostFacade` exclusively and bridge payload compatibility is intentionally versioned |
| Toolkit Install Layout | Fallback from `<extension>/app/jsx` to legacy `<extension>/jsx` | `infrastructure/hostFacade.js::resolveJsxRootPath()` | Keep old/root-linked wrappers loadable without changing the normal app-junction path | Supported installers no longer create root-linked Toolkit wrappers and live-link upgrade validation passes |

## Retired Patterns

These patterns are already retired and must not be reintroduced:

- mutable `WeddingAssembler._deps` / `setDependencies()`;
- `StrategyOrchestrator.analyzeBatch()` and metadata encode/decode helpers;
- runtime module-folder scanning in Toolkit;
- Config writes through raw `savePreset()` or embedded schema mutation;
- wrapper-specific smart reload behavior inside Toolkit panel UI.

## Current Versus Legacy

| Concern | Current implementation for new work | Legacy behavior retained only for compatibility | Tradeoff |
| --- | --- | --- | --- |
| Ownership | Bounded contexts with explicit facade, policy/domain, adapter, and composition layers | Cross-layer calls and large coordinators | More files to navigate, but ownership is machine-checkable |
| Preset data | Canonical V5 draft plus runtime adapter | V4 embedded schema and duplicated mirrors | Migration code remains until old presets are retired |
| Dependencies | Constructor/factory injection and `hostFacade` | Mutable dependency state and raw bridge aliases | Slightly more wiring, substantially less hidden state |
| Host boundary | Panel-side modern JavaScript separated from ES3 JSX orchestration | Fallback paths for old wrapper/resource layouts | Two runtime constraints still require focused smoke coverage |
| Discovery | Feature maps, architecture docs, generated catalogs, and agent-readiness checks | Runtime discovery and implicit conventions | Documentation and guards must stay synchronized with source |
| Verification | Focused unit/contract tests, architecture guards, and 2026 smoke lanes | Manual verification and production diagnostic commands | Test/tooling code is larger, but failures are easier to localize |

As of the 2026-07-27 readiness audit, the repository has five active
compatibility seams and five explicitly retired patterns. New code must follow
the current column. The legacy column is not a shortcut: it may only be changed
or removed through the trigger and gate recorded above.

The operator worktree currently has 83 required untracked files: 23 product
source files, 31 test/smoke files, 25 specifications, and 4 agent-tooling files.
A temporary clean-room repository containing the tracked tree plus those 83
audited files passed strict agent readiness with 767 tracked files and zero
untracked files. This proves the ownership list is sufficient, but the real
repository is not clean-clone complete until those files are intentionally
published through the normal Git workflow.

## Verification

- Symbol compatibility: `npm run test:symbol`
- Wedding compatibility: `npm run test:wedding` and `npm run test:domain:wedding`
- Toolkit compatibility: `npm run test:toolkit`
- Cross-app contract changes: `npm run verify`
- Host/runtime removal: relevant Illustrator 2026 smoke lane
