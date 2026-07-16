# C1: Wedding CEP Facade Decoupling Program

# Pass A - Direction Brief

## Context

- Task: define one master `/plan` for a phased-safe facade and decoupling program in `wedding-cep`, then use community-first calibration to stress-test the direction before any slice execution.
- App or module: `wedding-cep`
- Trigger: the current app still makes small changes feel expensive because workflow code often spans UI state, orchestration, bridge transport, and JSX host behavior in one mental path.

## Normalized Request Receipt

- Intent: architecture refactor program planning for `wedding-cep`, with the goal of lowering change cost without retiring proven features.
- Route: `/plan`
- Goal: give future sub-plans one stable target architecture so each refactor slice reduces real coupling instead of moving complexity around.
- Success Criteria:
  - one dedicated C1 exists for the full `wedding-cep` facade and decoupling program
  - the direction is calibrated against current community practice rather than only repo intuition
  - the program is sliced into safe, ordered seams that can be implemented one at a time
  - the plan explicitly protects stable CEP-only features from unnecessary churn
- Scope Guess:
  - `wedding-cep/ARCHITECTURE.md`
  - `wedding-cep/FEATURE_MAP.md`
  - `wedding-cep/cep/scripts/check_architecture.cjs`
  - `wedding-cep/cep/js/bootstrap/`
  - `wedding-cep/cep/js/actions/`
  - `wedding-cep/cep/js/infrastructure/bridge.js`
  - `wedding-cep/cep/jsx/illustrator.jsx`
  - `wedding-cep/cep/js/components/compact-form/`
  - `wedding-cep/cep/js/components/schema-tab/`
  - `wedding-cep/cep/js/components/postflight/`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/`
- Constraints:
  - phased-safe rollout only; no big-bang rewrite
  - do not retire features that already came from real operator demand
  - stable CEP-only helpers such as swap/normalize/validate should be isolated and frozen rather than reopened casually
  - `.jsx` must remain ES3-compatible
  - avoid pulling `libs/shared` or `libs/wedding/domain` into early slices unless a later sub-plan proves it is required
- Unknowns:
  - the exact file layout for facade entrypoints
  - how much the existing architecture checker can enforce without false positives
  - which slices will require temporary compatibility shims and which can cut over directly
- Approval Needed: none; the user explicitly approved the master direction and requested implementation of the `/plan` artifact.

## Problem Restatement

- `wedding-cep` already has architecture vocabulary for facades and bounded contexts, but many small changes still require tracing across runtime boot, UI wiring, action orchestration, bridge calls, and Illustrator host state.
- The real problem is not only lack of layering; it is the combination of partial facade adoption, weak enforcement of context boundaries, and direct coupling to host primitives in app-level code.
- The program therefore needs to reduce change cost by introducing stronger public seams and stronger guardrails, while preserving the current feature set and the current CEP/JSX runtime constraints.

## Options

### Option 1

- Summary: build a phased-safe modular monolith around five public facades and one host anti-corruption layer, then migrate contexts in order.
- Tradeoffs: slower than a rewrite, but preserves runtime stability and gives each slice measurable architectural progress.

### Option 2

- Summary: perform a large rewrite that tries to fully decouple all contexts in one broad pass.
- Tradeoffs: simpler to describe on paper, but too risky for a legacy CEP app that still depends on bridge and Illustrator selection behavior.

### Option 3

- Summary: keep current structure and add only local facade wrappers opportunistically when touching code.
- Tradeoffs: lowest immediate cost, but likely to preserve the same coupling patterns because there is no hard boundary enforcement or shared target architecture.

## Best Practices

- Model the app around bounded contexts and package together code that changes together rather than chasing total separation across all concepts.
- Give each bounded context one thin public entrypoint so external callers do not import internals accidentally.
- Keep UI/presentation separate from orchestration and policy; action code should translate UI state into commands rather than carry business logic inline.
- Treat `bridge + JSX + Illustrator` as an external boundary behind an anti-corruption layer instead of letting app code couple to host details directly.
- Use guardrails to make the architecture sticky; without import enforcement, a repo quickly drifts back to convenience imports.

## Anti-Patterns

- Starting with a big-bang rewrite before seams and architecture checks exist.
- Creating facades for every small helper module, which only adds ceremony and router layers.
- Passing `button`, DOM refs, builder internals, or raw bridge objects through public context seams.
- Promoting support capabilities like `DateIntelligence`, `InputAssistance`, or stable CEP-only helpers into top-level contexts when they are better kept as internal support surfaces.
- Moving orchestration or policy into `.jsx` just because that is where Illustrator state is available.

## Edge Cases

- `selection`, `session`, `schema`, and `report` are shared concepts that still need a small shared kernel; this program cannot make them unrelated in the absolute sense.
- `postflight`, `document sync`, and `template authoring` all cross the host boundary, so they will remain coupled to `HostFacade` even after they are decoupled from raw bridge calls.
- Stable CEP-only features should stop being architectural hot spots, but they still need to remain reachable through the new workspace seams.
- If any slice needs `libs/shared` or `libs/wedding/domain`, that work must split into its own sub-plan rather than piggyback on this program.

## Counterfactuals

- If the repo only adds more local wrappers without enforcement, coupling will return as soon as a future task needs a shortcut.
- If the program aims for 'decoupled completely', it will likely replace current pain with duplication, context confusion, and too many seams.
- If feature retirement is mixed into this program, regressions and architecture outcomes will become harder to attribute.
- If host coupling is postponed until late slices, app-layer facades will stay leaky and later slices will stall.

## Community-First Calibration

- Direction label: aligned
- Why:
  - the chosen direction matches bounded-context and facade guidance from Fowler and Microsoft
  - the chosen direction also matches the repo's own stated taxonomy in `wedding-cep/ARCHITECTURE.md`
  - the user explicitly prefers phased-safe rollout and feature preservation, which community guidance supports for legacy systems with external host boundaries
- Compliance Receipt:
  - `C1-RESEARCH: DEFINE=[wedding-cep needs a refactor program that reduces coupling between UI, app logic, bridge, and JSX while preserving the current feature set] | SEARCH=[5 queries] | BEST=[5] | ANTI=[5] | EDGE=[4] | COUNTER=[4] | ALIGN=[aligned]`

## Chosen Direction

- Use Option 1.
- The target architecture is a phased-safe modular monolith with five public facades:
  - `WorkspaceFacade`
  - `DocumentSyncFacade`
  - `TemplateAuthoringFacade`
  - `PostflightFacade`
  - `HostFacade`
- Shared concepts are reduced to a small app-local kernel:
  - `SelectionSnapshot`
  - `SelectionSession`
  - `HostCommandResult`
  - `FacadeStatus`
  - `ReportResult`
  - `SchemaRefCatalog`
- Stable CEP-only helpers remain in the app, but behind internal support seams and under freeze policy.

## Why Other Options Were Rejected

- Option 2 was rejected because a broad rewrite would combine architecture redesign with host-risk migration and likely stall validation.
- Option 3 was rejected because local facade additions without guardrails would not materially lower future change cost.

## Approval Checkpoint

- Status: approved by implementation request
- Blocking decisions: none

# Pass B - Implementation Plan

## Planned Files Or Modules

- `.task_steps/c1_wedding_facade_decoupling_program.md`
- `wedding-cep/ARCHITECTURE.md`
- `wedding-cep/FEATURE_MAP.md`
- `wedding-cep/cep/scripts/check_architecture.cjs`
- `wedding-cep/cep/js/bootstrap/`
- `wedding-cep/cep/js/actions/`
- `wedding-cep/cep/js/infrastructure/bridge.js`
- `wedding-cep/cep/jsx/illustrator.jsx`
- `wedding-cep/cep/js/components/compact-form/`
- `wedding-cep/cep/js/components/schema-tab/`
- `wedding-cep/cep/js/components/postflight/`
- `wedding-cep/cep/js/logic/use-cases/document-sync/`
- `wedding-cep/cep/js/logic/use-cases/template-authoring/`

## Consumers To Verify

- `wedding-cep/cep/js/app.js`
- `wedding-cep/cep/js/bootstrap/startup.js`
- `wedding-cep/cep/js/bootstrap/wireActions.js`
- `wedding-cep/cep/js/actions/ScanAction.js`
- `wedding-cep/cep/js/actions/UpdateAction.js`
- `wedding-cep/cep/js/actions/InjectSchemaAction.js`
- `wedding-cep/cep/js/actions/ManualInjectAction.js`
- `wedding-cep/cep/js/actions/PostflightAction.js`
- `wedding-cep/cep/js/actions/SwapAction.js`
- `wedding-cep/cep/js/components/compact-form/CompactFormBuilder.js`
- `wedding-cep/cep/js/components/compact-form/FormLogic.js`
- `wedding-cep/cep/js/components/postflight/ValidationReportWidget.js`
- `wedding-cep/cep/js/components/schema-tab/SchemaTabComponents.js`
- `wedding-cep/cep/debug_scripts/smoke_suites/core_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/document_sync_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/schema_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/postflight_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/autocomplete_smoke_tests.cjs`
- `wedding-cep/cep/debug_scripts/smoke_suites/name_smoke_tests.cjs`

## Execution Slices

### Slice 1 - Guardrails And Public Contracts

- Goal: define the allowed public seams and make architecture checks fail on direct bypasses.
- Files:
  - `wedding-cep/ARCHITECTURE.md`
  - `wedding-cep/FEATURE_MAP.md`
  - `wedding-cep/cep/scripts/check_architecture.cjs`
  - new facade entry files under the chosen context folders
- Validation:
  - architecture checker coverage for context boundaries
  - import sweep for known deep-import patterns
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`

### Slice 2 - Host Boundary / Anti-Corruption Layer

- Goal: turn `bridge + JSX` into `HostFacade` so app-facing contexts stop receiving raw bridge primitives.
- Files:
  - `wedding-cep/cep/js/infrastructure/bridge.js`
  - `wedding-cep/cep/jsx/illustrator.jsx`
  - new host facade entry/support files
  - impacted consumers in actions and use-cases
- Validation:
  - host contract tests for snapshot/session and command/result normalization
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

### Slice 3 - Workspace Boundary

- Goal: put `compact-form` behind `WorkspaceFacade` and freeze stable CEP-only helpers behind internal support APIs.
- Files:
  - `wedding-cep/cep/js/components/compact-form/`
  - `wedding-cep/cep/js/bootstrap/wireActions.js`
  - new workspace facade entry/support files
  - targeted support helpers for swap/normalize/validate
- Validation:
  - workspace unit tests
  - autocomplete/name support smoke where impacted
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`

### Slice 4 - Document Sync Migration

- Goal: route scan/update through `DocumentSyncFacade` and hide strategy/pipeline internals from callers.
- Files:
  - `wedding-cep/cep/js/actions/ScanAction.js`
  - `wedding-cep/cep/js/actions/UpdateAction.js`
  - `wedding-cep/cep/js/logic/use-cases/document-sync/`
  - `wedding-cep/cep/js/logic/use-cases/scanDocument.js`
  - `wedding-cep/cep/js/logic/use-cases/updateDocument.js`
- Validation:
  - scan/update unit tests
  - document-sync smoke parity
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`

### Slice 5 - Template Authoring Migration

- Goal: make `TemplateAuthoringFacade` the single command surface for auto and manual authoring while keeping `SchemaInjector` untouched unless a real trigger appears.
- Files:
  - `wedding-cep/cep/js/actions/InjectSchemaAction.js`
  - `wedding-cep/cep/js/actions/ManualInjectAction.js`
  - `wedding-cep/cep/js/logic/use-cases/template-authoring/`
  - `wedding-cep/cep/js/components/schema-tab/`
- Validation:
  - template authoring unit tests
  - schema smoke parity
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

### Slice 6 - Postflight Migration

- Goal: move postflight orchestration and locate/restore behavior fully behind `PostflightFacade + HostFacade`.
- Files:
  - `wedding-cep/cep/js/actions/PostflightAction.js`
  - `wedding-cep/cep/js/logic/validators/PostflightValidator.js`
  - `wedding-cep/cep/js/components/postflight/`
  - postflight-related host calls
- Validation:
  - postflight unit tests
  - locate/restore host contract tests
  - postflight smoke parity
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`

### Slice 7 - Freeze, Cleanup, And Documentation Lock

- Goal: retire temporary entrypoints, lock docs to facade-first navigation, and make boundary bypasses fail fast.
- Files:
  - `wedding-cep/ARCHITECTURE.md`
  - `wedding-cep/FEATURE_MAP.md`
  - `wedding-cep/PROJECT_STATUS.md`
  - `wedding-cep/cep/scripts/check_architecture.cjs`
  - any remaining compatibility shims created by earlier slices
- Validation:
  - full `wedding` lane
  - final smoke lane
  - import sweep for boundary regressions
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
  - `npm run test:smoke:wedding`

## Validation Plan

- This round is master-planning only, so no runtime code changes are executed here.
- Each future slice must open its own sub-plan and C2 before code changes begin.
- Minimum validation for every code slice:
  - `npm run lint:wedding`
  - `npm run build:wedding`
  - `npm run test:wedding`
- Additional mandatory validation:
  - Slice 2, Slice 5, and Slice 7 must run `npm run test:smoke:wedding`
  - Any slice that changes host session/selection behavior must add or update contract coverage for `read snapshot -> locate A -> locate B -> restore`
  - Any slice that changes architecture checks must prove the checker catches at least one banned import pattern

## Program Exit Conditions

- All external callers enter bounded contexts through one official public facade each.
- `Bridge` no longer acts as a general app-facing dependency outside composition root or facade implementations.
- Stable CEP-only features remain available but no longer drive architecture churn.
- The repo has architecture checks that fail when future work bypasses facade seams or reintroduces deep cross-context imports.
- Core operator workflows still pass:
  - startup
  - scan
  - update
  - schema inject/manual authoring
  - postflight locate/restore
  - swap
  - normalize
  - validate

## Open Risks

- The existing architecture checker may need a staged rollout to avoid false positives when the first facade files appear.
- Host contract normalization can expose hidden assumptions in selection-driven flows before their context slice is migrated.
- Compatibility shims can become sticky if a slice lands without a clear retire deadline.
- The current worktree is already dirty, so each future slice must keep scope tracking very tight to avoid conflating old diffs with new architecture work.
