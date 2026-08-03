# Repository Function Inventory

> Audit snapshot: 2026-07-25
>
> This document is the working map for a controlled architecture refresh. It
> describes product capabilities, ownership boundaries, current validation, and
> refactor candidates. It is not a replacement for the app-local architecture
> documents.

## Executive Summary

The repository is already split into four meaningful bounded contexts:

1. `symbol-cep`: imposition, presets, configuration, and Wedding Suite print.
2. `wedding-cep`: wedding data entry, authoring, and document synchronization.
3. `toolkit-cep`: a frozen launcher shell with independent host-action modules.
4. `libs/*`: small shared UI/domain packages with strict ownership.

The main risk is not missing separation. The main risk is accumulated
coordination code, compatibility adapters, large host workflows, and
developer-only scripts that make ownership harder to see. The refresh should
therefore be incremental and evidence-driven:

- keep each application as its own composition root;
- keep panel policy separate from CEP/Illustrator adapters;
- keep JSX ES3 and transport contracts stable;
- move one bounded-context island at a time;
- delete compatibility code only after characterization coverage proves it is no
  longer needed.

## Baseline

| Area | Files | Code files | Test/debug files | Approx. lines | Current health |
| --- | ---: | ---: | ---: | ---: | --- |
| `symbol-cep/cep/js` | 100 | 100 | 35 | 53,889 | Lint, build, unit, and 2026 smoke are green from the latest Symbol config pass |
| `symbol-cep/cep/jsx` | 18 | 18 | 0 | 7,083 | High-risk host boundary; keep stable |
| `wedding-cep/cep/js` | 204 | 204 | 84 | 31,198 | Facade-ready slices with architecture enforcement |
| `wedding-cep/cep/jsx` | 4 | 4 | 0 | 811 | High-risk host boundary; keep stable |
| `toolkit-cep/cep/js` | 26 | 26 | 11 | 5,385 | Frozen shell and host boundary |
| `toolkit-cep/cep/jsx` | 4 | 4 | 0 | 781 | Frozen ES3 bootstrap/runtime |
| `toolkit-cep/cep/modules` | 97 | 79 | 0 | 11,852 | Independent module islands; build-time discovery |
| `libs/wedding/domain/src` | 11 | 11 | 2 | 1,113 | Pure domain package; elevated cross-app risk |
| `libs/shared/cep-ui/src` | 2 | 2 | 0 | 154 | Small generic UI package; elevated cross-app risk |

Audit findings:

- tracked files: `689`;
- untracked files: `23`, including `22` source/config/test files retained by
  the current operator workflow;
- hygiene errors: `0`;
- exact duplicate source groups: only the vendor `CSInterface.js` copy used by
  two CEP apps;
- Knip remains advisory. Its unused-file list contains both real cleanup
  candidates and intentionally retained compatibility/debug seams.

## Capability Map

### Symbol / Imposition

| Capability | User-visible job | Composition entry | Policy / orchestration | IO boundary | Validation |
| --- | --- | --- | --- | --- | --- |
| Runtime boot | Start panel, register app surface, wire tabs | `symbol-cep/cep/js/app.js` | app assembly | `bridge.js`, `jsx/host.jsx` | Symbol unit + 2026 smoke |
| Config and presets | Create, edit, load, save, switch presets | `features/imposition/config_tab.js` | `config_engine.js`, `preset-config/`, `ConfigDraftStore` | `preset_repository.js`, local storage | 183 Symbol unit tests plus config smoke |
| Nine config sections | Artboard, sheet layout, finish size, resize, output/save, marks, margins, options, pasteboard | `config_section_registry.js` and `config_pane_renderer.js` | section adapters and schema state | Tweakpane DOM | config unit/smoke |
| Preflight | Check garbage, grouping, and operator confirmation before run | `preflight/PreflightOrchestrator.js` | preflight rules | bridge selection/document reads | action smoke |
| Run preset | Compile config, run imposition, normalize result | `action_tab.js` | `processing_options.js`, `bridge_codec.js` | `Bridge` to JSX | action smoke |
| Layout | Calculate positions and output geometry | `js/domain/layout_engine.js` | pure layout helpers | none | unit tests and smoke geometry |
| Postflight hooks | Pasteboard slug and other after-run side effects | `postflight/PostflightOrchestrator.js` | hook rules | bridge/JSX drawing | postflight smoke |
| Wedding Suite print | Render invitation/envelope/draft, stage PDF, open output | `features/wedding-suite-standard/WeddingSuiteTab.js` | `panelPolicy.js`, `panelView.js`, `panelActions.js`, `planner.js`, `recipeStore.js` | PDF scanner, JSX host composition root | Wedding Suite smoke |
| Host bridge | Evaluate JSX and normalize responses | `bridge.js` | codec and runtime adapter | CEP `CSInterface` | bridge/unit/smoke |

Current Symbol assessment:

- **Good:** one panel composition root, named feature slice, explicit
  `HostFacade`-style boundaries, pure layout area, and a recent canonical
  preset/config island.
- **Good:** `config_pane_renderer.js` is now a small coordinator. Standard
  controls live in `config_pane_control_adapter.js`; pasteboard and schema-edit
  rendering live in `config_pane_special_sections.js`.
- **Compatibility boundary:** Config writes are canonical-only. Legacy V4
  support remains isolated to read migration and the Action Tab/runtime facade.
- **Do not touch by symmetry:** `jsx/features/imposition_symbol.jsx`,
  `jsx/bridge.jsx`, and raw host codec code without a reproduced defect or
  characterization test.

### Wedding / Scripter

| Capability | User-visible job | Composition entry | Policy / orchestration | IO boundary | Validation |
| --- | --- | --- | --- | --- | --- |
| Runtime boot | Start panel, readiness, tabs, test API | `wedding-cep/cep/js/app.js` | `bootstrap/startup.js`, `tabBoot.js` | `HostFacade` | app unit + 2026 smoke |
| Compact wedding form | Render fields, state, bindings, and venue assistance | `components/compact-form/CompactFormBuilder.js` | form state/logic/support files | DOM and host facade | component/action tests |
| Date intelligence | Solar/lunar conversion and dependent date fields | `components/date-grid/DateGridController.js` | `@wedding/domain` calendar/date logic | DOM widgets | domain + component tests |
| Input assistance | Address search, name validation, normalization | `logic/ux/InputEngine.js` | validators, normalizers, field resolver | Fuse index and DOM | UX unit tests |
| Template authoring | Auto inject, manual inject, schema-driven authoring | `actions/InjectSchemaAction.js`, `ManualInjectAction.js` | `template-authoring/templateAuthoringService.js` | schema loader, JSX | authoring unit + smoke |
| Document sync | Scan, update, metadata assembly, strategy updates | `actions/ScanAction.js`, `UpdateAction.js` | document-sync services and strategy orchestrator | JSX selection/document bridge | action/unit + smoke |
| Platform host | CEP transport, Illustrator frames, schema file access | `infrastructure/hostFacade.js` | raw adapters remain internal | `bridge.js`, `cepHost.js`, JSX | architecture checks + smoke |
| Domain rules | Date, name, venue, string and time business rules | `libs/wedding/domain/src/index.ts` | pure domain modules | none | domain tests |

Current Wedding assessment:

- **Good:** the app has a single composition root, explicit actions/use-cases,
  a pure domain package, and an architecture checker that blocks obvious
  boundary drift.
- **Needs follow-up:** the app has the largest file count and the most support
  helpers. The next useful work is characterization and import cleanup inside
  one bounded context, not moving folders for appearance.
- **Deferred:** `SchemaInjector` and all JSX host work. They are central and
  high-risk; a real product bug must trigger their refactor.

### Toolkit

| Capability | User-visible job | Composition entry | Policy / orchestration | IO boundary | Validation |
| --- | --- | --- | --- | --- | --- |
| Runtime boot | Start launcher and readiness state | `toolkit-cep/cep/js/app.js` | `bootstrap/startup.js` | `ToolkitHostFacade` | unit + 2026 smoke |
| Shell | Dashboard, search, keyboard navigation, compact command labels | `features/shell/toolkitShell.js` | launcher state | DOM only | shell smoke |
| Catalog | Build-time module metadata, grouping, search, availability | `features/catalog/moduleCatalog.js` | catalog/search normalizers | generated artifacts | catalog unit/smoke |
| Run flow | Precheck and run one command | `features/run/commandRunner.js` | command preflight/result shaping | host facade | unit/smoke |
| Host runtime | Load registry, dispatch modules, quarantine bad modules | `jsx/bootstrap/toolkitHostBootstrap.jsx` | generated registry/dispatch | ExtendScript files and CEP bridge | 2026 debug gate `9099` |
| Module authoring | Add an independent one-click action | `modules/<id>/module.json`, `run.jsx` | module-local internal files | Illustrator DOM | focused module smoke |

Production module inventory:

| Category | Modules |
| --- | --- |
| `Cut Workflow` | `add_camera_marks`, `create_cut_lines`, `prepare_cut_package`, `save_cut_package`, `step_repeat`, `step_repeat_symbol` |
| `Daily Work` | `rasterize_bitmap_300_transparent`, `recolor_selection_k100`, `recolor_selection_red_c0_m100_y100_k0`, `swap_selection_position_only`, `swap_selection_size_and_position` |
| `Text` | `break_text_into_glyphs`, `break_text_into_lines`, `break_text_into_words` |

Current Toolkit assessment:

- **Good:** build-time discovery, generated registry, one module contract,
  quarantine isolation, compact shell, and a clear frozen zone.
- **Needs follow-up:** the three text-break modules intentionally duplicate a
  large ExtendScript algorithm so each module remains independently loadable.
  This is a maintenance trade-off, not an automatic deletion target.
- **Do not touch:** shell/runtime/JSX frozen files during a general cleanup.
  Module islands, debug scenarios, and docs are the safe zone.

### Shared Libraries

| Package | Current public surface | Correct ownership | Refactor stance |
| --- | --- | --- | --- |
| `@wedding/domain` | Calendar, date logic, names, rules, saint names, strings, time, venue | Pure wedding business rules | Keep pure; add exports only when a real cross-app rule exists |
| `@shared/cep-ui` | `UIFeedback.showToast`, `showLoading`, `hideLoading`, `showError` | Generic panel feedback | Keep small; do not absorb app-specific workflow or host behavior |

## Dependency Shape

The target dependency direction is:

```text
composition root
    -> feature facade / action
        -> policy, planner, validator, mapper
            -> adapter (storage, CEP, JSX, DOM)

shared domain <- wedding app
shared UI    <- wedding app, symbol app
```

Required invariants:

- `wedding-cep` and `symbol-cep` do not import each other's runtime code;
- `libs/wedding/domain` never imports CEP, UI, or Illustrator APIs;
- `libs/shared/cep-ui` stays app-agnostic;
- `toolkit-cep` modules do not import shell code;
- panel code owns policy and data shaping; JSX owns Illustrator DOM execution;
- generated bundles/catalogs are outputs, not source entrypoints.

## Refactor Candidate Matrix

| Priority | Candidate | Evidence | Expected gain | Risk | Gate |
| --- | --- | --- | --- | --- | --- |
| Complete | Finish Symbol Config migration | Config persistence now uses canonical drafts only; legacy reads remain isolated | Less raw-state looping and clearer persistence | Covered | Config unit, Symbol unit, 2026 smoke |
| Complete | Extract `ConfigPaneRenderer` adapters | Standard controls and special sections have dedicated adapters | Smaller renderer and isolated section behavior | Covered | adapter characterization, Symbol unit/smoke |
| Complete | Formalize per-app composition-root dependency checks | Symbol and Toolkit guards now cover composition roots and key layer boundaries; Wedding keeps its existing checker | Prevents future drift while refactoring | Low | `check:architecture`, unit fixtures |
| Complete | Wedding Document Sync internal cleanup | HostFacade-only actions, stateless assembler, and reduced strategy API | Less compatibility branching and clearer tests | Covered | wedding unit + 2026 smoke |
| Complete | Wedding Input Assistance cleanup | Factory-backed InputEngine, hostFacade-only autocomplete, and verified helper cleanup | Isolated state and less helper leakage | Covered | UX/unit + wedding smoke |
| Complete | Split Symbol Wedding Suite panel policy from render lifecycle | Panel policy/view/actions and host core/source/render/output are isolated behind existing facades | Better output lifecycle isolation and easier PDF testing | Covered | Symbol unit, host composition guard, 2026 smoke |
| Complete | Split Symbol smoke suites by bounded context | Runner support and scenario families are isolated while manifest order stays locked | Faster diagnosis and less scenario coupling | Covered | Symbol unit + 2026 lane |
| Defer | Toolkit text-break algorithm extraction | Three large near-duplicate module files; independent module loading is intentional and no common defect is reproduced | One algorithmic fix instead of three edits | Medium because modules must remain independently loadable | Reopen only with a reproduced defect or repeated change |
| Defer | Domain API export review | `@wedding/domain` has a small public index and clear callers; no unused API defect is blocking work | Clearer public API and less accidental surface | Medium cross-app risk | Reopen only with a real cross-app rule or API problem |
| Defer | Shared UI expansion | Package is tiny and correct | Little benefit; increases coupling | High relative to gain | only with cross-app requirement |
| Defer | JSX/bridge rewrite | Host surface is fragile and model boundary is strict | Possible long-term cleanup | High | defect/characterization trigger required |

## Historical Execution Order

The following island order records the work already completed and the original
reasoning. It is not an instruction to start another proactive refactor.

### Island 1: Finish Symbol Config, Then Remove Compatibility

The recent Config refactor is the correct first island. Do not start another
large refactor until the operator manually validates the current 2026 panel.
After that:

1. characterize all legacy V4 and canonical V5 preset paths;
2. remove only branches proven unreachable;
3. delete compatibility files and update architecture docs;
4. rerun Symbol unit and 2026 smoke.

### Island 2: Extract Symbol Config Section Adapters

Move section-specific DOM/control code out of
`config_pane_renderer.js` behind the existing registry. Keep one renderer
composition root and pass each section adapter an explicit context. No adapter
may access repositories, bridges, or runtime presets directly.

### Island 3: Wedding Document Sync (Complete)

`ScanAction` and `UpdateAction` remain public facades. Document Sync now uses a
single `HostFacade` path, a stateless assembler contract, and a focused strategy
orchestrator. `SchemaInjector` and JSX were not changed.

### Island 4: Wedding Input Assistance (Complete)

Input Assistance now uses a closure-backed `createInputEngine(deps)` factory.
Keep UX adapters and domain rules separate. Schema precedence, heuristic
fallback, and existing normalization policies remain unchanged.

### Island 5: Toolkit Module Family Maintenance

Only after the module smoke suite is stable, evaluate a private shared loader
for the text-break family. The loader must preserve independent module loading
and must not move code into the frozen shell/runtime.

### Island 6: Symbol Wedding Suite (Complete)

Wedding Suite Standard now uses a thin panel facade over isolated policy, view,
and action modules. The host JSX is split into ES3-compatible core, source,
render, and output lifecycle layers with the original public endpoint file as
the composition root. No geometry, save/open, dirty-guard, or debug artifact
behavior changed.

### Island 7: Symbol Smoke Harness (Complete)

The smoke runner now delegates to bounded Action, Config, Host, and Wedding
Suite scenario families. Shared cleanup/codec/expression helpers are isolated,
while the 46-scenario order and Illustrator 2026 CLI contract remain locked.

### Island 8: Final Architecture Guards (Complete)

Symbol and Toolkit now have focused developer-only architecture guards with
fixture tests. The root architecture command also runs the existing Wedding
dependency checker. These guards protect the current boundaries without
changing production runtime behavior or requiring Illustrator smoke.

### Island 9: GPT Agent Readiness (Complete)

The repository now exposes a short `AGENT_CONTEXT.md` map and a
`check:agent-ready` contract covering required context files, root commands,
spec triples, and clean-clone source visibility. The default gate reports
untracked source as a warning so it can run in the current operator worktree;
strict mode runs in clean-checkout CI. `LEGACY_MAP.md` records supported
compatibility seams and removal triggers, while abandoned spec directories use
an explicit `CANCELLED.md` marker.

## Explicit Non-Goals

- no big-bang rewrite of all three applications;
- no shared mega-library for app-specific policy;
- no moving JSX orchestration into panel code or panel policy into JSX;
- no mass migration of `presets.json`;
- no deletion based only on Knip output;
- no change to live-link installer topology;
- no Illustrator 2025 smoke work in this refresh unless a user explicitly
  reopens that lane.

## Decision

The codebase should be improved as one coherent system, but executed as
decoupled islands. Symbol Config, Wedding Document Sync, Wedding Input
Assistance, Symbol Wedding Suite, and Symbol Smoke Harness are now complete
bounded-context passes. The next candidate should come from a fresh audit, not
an automatic production runtime refactor.
Toolkit shell and host runtime remain stable infrastructure, while Toolkit
module improvements stay isolated under `modules/**`.

The final architecture guard pass found no new reproducible defect or
cross-context coupling with a better risk-adjusted return. Proactive refactoring
is therefore paused. Reopen work only for a real feature, a reproducible bug,
or coupling that causes the same change to be repeated in at least two bounded
contexts.

Agent-readiness work remains limited to repository control-plane quality. The
next high-value trigger is resolving required untracked source/context files so
`npm run check:agent-ready:strict` can pass from a clean clone; this must not be
implemented by automatic staging or deletion.

The current ownership audit reports `83` required untracked files:
`23` product source files, `31` test/smoke files, `25` specs, and `4`
agent-tooling files. The local `.specify/feature.json` pointer is excluded from
Git by policy. Use `npm run audit:agent-ready` for the exact machine-readable
list before any future staging operation.

The audited set was copied with the existing tracked tree into a temporary
clean-room repository on 2026-07-27. That candidate contained `767` tracked
files, no untracked files, and passed both
`node scripts/check_agent_ready.cjs --strict` and
`node scripts/check_encoding.cjs`. This validates completeness of the proposed
ownership set without staging or committing the operator worktree.
