# Agent Operating Model

> Repo-native operating model for coding agents in this monorepo.
> This file defines team shape, ownership vocabulary, risk tiers, and rollout rules.
> Governance and workflow law remain in `AGENTS.md` and `.agent/workflows/*`.

## Purpose

- Keep agent work aligned with repo boundaries and validation gates.
- Make multi-agent usage explicit instead of ad-hoc.
- Optimize the codebase for agent routing before scaling agent concurrency.

## Repo Control Plane

- Workflow law lives in:
  - `AGENTS.md`
  - scoped `AGENTS.md`
  - `.agent/workflows/core_protocol.md`
  - `.agent/workflows/plan.md`
  - `.agent/workflows/build.md`
  - `.agent/workflows/fix.md`
- Repo facts live in:
  - app `ARCHITECTURE.md`
  - app `PROJECT_STATUS.md`
  - app `FEATURE_MAP.md`
  - shared package `README.md`
  - root `POSTFLIGHT_TAXONOMY.md`
  - `adr/`
- Skills are optional agent affordances only.
  - They must stay thin.
  - They must point back to repo SSOTs.
  - They must not replace workflow law.
  - Repo-local `.agent/memory` may hold only thin wrappers or active reference stores.
  - If a knowledge surface duplicates repo docs or external skills, delete the duplicate instead of keeping both.

## MVP Agent Team

Default roster for this repo:

1. `Orchestrator`
   - owns task framing, scope lock, and escalation.
2. `Explorer`
   - maps entrypoints, consumers, impact, and validation surfaces.
3. `Implementer`
   - writes code only inside the allowed write scope.
4. `Validator`
   - reruns the required validation lane and checks acceptance.

Optional roles after the MVP is stable:

- `Risk Reviewer`
- `Docs / ADR Steward`

## Single-Agent vs Multi-Agent

### Use single-agent when

- the change is local to one bounded context
- the task touches a hotspot file or a broad coordinator
- the request is still ambiguous
- the task is mostly bug isolation or one narrow fix

### Use multi-agent when

- the task has a clear scope lock
- the work can be split into read-only discovery plus one writing surface
- the write scope is disjoint from review/validation work
- the task benefits from independent audit, verification, or forward-testing

### Writer limit

- Default: `1 writer`
- Allowed: `2 writers` only when the write scopes are disjoint and the orchestrator has named the split in advance
- Disallowed:
  - shared libs
  - host-side `.jsx`
  - contract-shape changes
  - cross-app terminology or workflow changes

## Canonical Bounded Contexts

### `wedding-cep`

- Runtime / Boot
- Workspace / Form Entry
- Date Intelligence
- Input Assistance
- Template Authoring
- Document Sync
- Postflight
- Platform / Illustrator Host

Use `wedding-cep/FEATURE_MAP.md` as the routing map for these contexts.

### `symbol-cep`

- Runtime / Boot
- Preset / Config
- Preflight
- Engine / Execution
- Postflight / Hooks
- Platform / Illustrator Host
- Data / Persistence

Use `symbol-cep/FEATURE_MAP.md` as the routing map for these contexts.

### Shared routed surfaces

- Shared / Wedding Domain

Use `libs/wedding/domain/README.md` and `libs/wedding/domain/AGENTS.md` as the routing pair for this surface.

## Risk Tiers

### `T0`

- docs-only or local low-risk change
- one surface, no contract shape change
- default lane:
  - single-agent or single-writer
  - docs validation plus required repo checks

### `T1`

- single-app, single-context behavior change
- default lane:
  - Orchestrator + Explorer + Implementer + Validator
  - review gate required

### `T2`

- shared
- host-side `.jsx`
- cross-app
- contract-shape change
- boundary renaming or taxonomy changes

Default lane:

- single writer only
- mandatory review/risk pass
- broader validation and explicit approval before close-out

## Escalation Triggers

Escalate to `T2` immediately when the task touches:

- `libs/shared/*`
- `libs/wedding/domain/*`
- `cep/jsx/*`
- bridge payload shapes
- schema / packet / metadata contract shapes
- cross-app terminology or governance docs
- CI / CODEOWNERS / GitHub policy surfaces

## Required Artifacts Per Task

- `Task brief`
  - normalized request + chosen bounded context + risk tier
- `Scope lock`
  - allowed write scope + validation targets + impact note
- `Implementation note`
  - what changed and what intentionally did not
- `Validation receipt`
  - exact commands run and result
- `Postmortem`
  - required for `/fix`, lightweight for `/build`

These artifacts can live in `.task_steps/` and close-out notes.

## Ownership Model

- Ownership is by bounded context first, path second.
- `CODEOWNERS` must mirror bounded-context vocabulary.
- Shared and governance surfaces are always elevated-risk.

## Pilot Rollout

Run a `2-week` pilot with exactly:

- one `wedding-cep` UI/report task
- one `wedding-cep` document-sync or policy task
- one `symbol-cep` preflight/postflight hook task

Rules:

- no parallel writers
- every task must produce the full artifact set
- every task must be mapped to one bounded context first

## Pilot Evaluation

Track:

- time to first correct entrypoint
- validation pass rate
- review churn
- escaped regression count
- cost and latency per merged task

Pilot success means:

- agents route to the correct app/context without guessing
- agents open feature map + architecture docs before editing
- no shared or host-side work bypasses escalation
- review comments trend downward across the pilot tasks

## Pilot Learnings

Lessons captured from the first pilot loop:

- `wedding-cep` `Postflight` UI/report work stayed inside the presentation slice when the task was framed through `FEATURE_MAP.md` first.
- `wedding-cep` `Document Sync` policy work was safest when solved in the nearest action-layer seam before widening any use-case result contracts.
- `symbol-cep` `Postflight / Hooks` work stayed clean only when treated as hook orchestration/rule policy, not as a validation-report surface.
- If a pilot hits an unrelated failing validation lane, open a separate `/fix` receipt for that blocker and rerun the original pilot lane only after the baseline is clean.
- The pilot did not justify `2 writers`; keep the default at `1 writer + supporting readers`.

## Continuation Routing

When operating by repeated `tiáº¿p tá»¥c` commands, use this order:

1. active milestones
2. deferred milestones whose trigger criteria are now satisfied
3. blocked milestones only after the external blocker is resolved

Do not invent a new engineering milestone when:

- the current retrospective or backlog has no active item
- remaining items are explicitly deferred by trigger
- remaining items are blocked on information or approval not present in repo state

Continuation status meanings:

- `Active`
  - actionable now
  - has a bounded context, scope lock, and validation lane
- `Deferred`
  - do not start yet
  - reopen only when the stated trigger actually happens
- `Blocked`
  - do not guess missing inputs
  - reopen only when the external dependency is resolved
- `Completed`
  - ignore for future continuation routing

If no active engineering milestone remains, the correct behavior is:

- close the current milestone cleanly
- refresh backlog state if needed
- stop instead of creating speculative work
- wait for a new product/runtime trigger or an explicitly approved governance milestone

## Continuation V2 Guardrails

Use these rules after the repo has already completed one or more focused cleanup rounds and repeated `tiep tuc` commands could otherwise drift into low-value refactoring.

### Close open validation first

- If the newest receipt is still missing a required validation lane, close that lane before choosing any new work.
- If the only missing lane depends on host/runtime state, retry only when that external state is actually available again.
- Do not open a new milestone while a higher-priority receipt is still waiting for final validation closeout.

### Candidate scoring rubric

Score each continuation candidate before starting it:

- `+5` real bug, regression, or validation blocker
- `+4` duplicate logic, false positive/false negative, or confusing seam that can misroute behavior
- `+3` coordinator or public entry seam that still mixes multiple responsibilities
- `+2` repeated change pressure or test pain in the same local seam
- `0` file is merely large but behavior is already clear
- `-2` config-driven or already-local internal helper
- `-3` cosmetic split that does not reduce risk, duplication, or test pain
- `-4` likely cross-boundary or contract-shape change without a product/runtime reason

Only continue with candidates scoring `>= 4`.
If no candidate reaches `4`, stop instead of creating cleanup work to stay busy.

### Stop-line

Stop and do not open a new milestone when any of these are true:

- two consecutive rounds were support-extraction only and did not reduce bug risk, duplicate logic, or validation pain
- remaining candidates are mostly config files, localized helpers, or test utilities outside the runtime path
- the same bounded context already received two cleanup rounds without a new trigger
- the only blocker left is host-off or environment-off and there is no separate runtime-local task with a qualifying score

### Support extraction rule

Treat support extraction as valid only when all four conditions hold:

- the file is a public seam or near-entrypoint
- responsibilities are still visibly mixed
- there is no clear direct test seam yet, or that seam is currently weak
- it is not the third consecutive cleanup round in the same bounded context

If any one of these conditions is missing, do not choose support extraction as the next default continuation task.

## Architecture Upgrade Rules

Use these rules when moving from local cleanup to longer-term architecture work.

- Prefer bounded-context outcomes over file-level symmetry.
- A new round is valid only if it:
  - upgrades one bounded context into a clearer `v2 island`, or
  - fixes a real bug, policy issue, or validation gap
- Do not open a round only because a file is still large.
- Do not facade-ize every module.
- Do not create parallel app-v2 trees.
- Keep composition roots stable and migrate beneath existing app entrypoints.
- Update `FEATURE_MAP.md` only after a context boundary is stable enough to become the new routing truth.
