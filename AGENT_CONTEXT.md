# Agent Context

> Short operational map for GPT coding agents. `AGENTS.md` files remain the
> instruction source of truth; this file tells an agent where to look and how
> to prove a change.

## Mission

This repository is maintained primarily through GPT coding agents. Optimize
for discoverability, bounded changes, machine-checkable contracts, and
verifiable outcomes rather than clever or implicit code.

## Read Order

1. Read root `AGENTS.md`.
2. Read the nearest nested `AGENTS.md` for every file in scope.
3. Read the app `FEATURE_MAP.md` to find the owning bounded context.
4. Read the app `ARCHITECTURE.md` before changing dependencies or entrypoints.
5. Read `adr/0004-agent-optimal-architecture.md` before proposing a broad
   architecture refactor.
6. Read `LEGACY_MAP.md` when a task touches compatibility data, aliases, or
   fallback paths.
7. Read the active `specs/<id>/spec.md`, `plan.md`, and `tasks.md` for planned
   work. A directory containing `CANCELLED.md` is historical and must not be
   implemented.
8. Load the pinned private devkit before developer work.

Do not treat `.agent/`, archived `.task_steps/`, generated bundles, or Git
history as current instructions.

## Product Map

| Surface | User job | Panel entry | Host entry | Focused validation |
| --- | --- | --- | --- | --- |
| `wedding-cep` | Wedding data entry and document sync | `wedding-cep/cep/js/app.js` | `wedding-cep/cep/jsx/host.jsx` | `npm run test:wedding` |
| `symbol-cep` | Imposition and Wedding Suite print | `symbol-cep/cep/js/app.js` | `symbol-cep/cep/jsx/host.jsx` | `npm run test:symbol` |
| `toolkit-cep` | One-click Illustrator commands | `toolkit-cep/cep/js/app.js` | `toolkit-cep/cep/jsx/host.jsx` | `npm run test:toolkit` |
| `libs/wedding/domain` | Pure wedding rules | package exports | none | `npm run test:domain:wedding` |
| `libs/shared/cep-ui` | Generic CEP feedback helpers | package exports | none | `npm run lint:shared` |

## Change Protocol

1. State the user-visible problem and acceptance criteria.
2. Choose one primary bounded context and an explicit write scope.
3. Preserve public payload/result contracts unless the task explicitly changes
   them.
4. Keep panel JavaScript and ES3 ExtendScript responsibilities separate.
5. Add or update focused tests before relying on broad gates.
6. Run the smallest relevant validation, then the required broad gate.
7. Report commands, results, and remaining manual limits.

Prefer changes that fit in one bounded context. Shared, cross-app, host-side,
or compatibility-removal work requires explicit planning and broader review.

## Validation Matrix

| Change | Required commands |
| --- | --- |
| Documentation/tooling only | `npm run check:agent-ready`, `npm run check:encoding`, focused tooling tests |
| Wedding panel/domain | `npm run lint:wedding`, `npm run build:wedding`, `npm run test:wedding`, `npm run test:domain:wedding` |
| Symbol panel | `npm run lint:symbol`, `npm run build:symbol`, `npm run test:symbol` |
| Toolkit module | `npm run lint:toolkit`, `npm run build:toolkit`, `npm run test:toolkit`, focused module smoke |
| Cross-app or architecture | `npm run verify` |
| Illustrator runtime behavior | Relevant Illustrator 2026 smoke lane after non-live checks |

Never use Illustrator 2025 as the default smoke lane.

Use `npm run audit:agent-ready` to get a machine-readable ownership list for
untracked source/context/test files. Do not stage that list blindly; review
each category against the active task and Git policy.

## Legacy Policy

- Legacy support is a named adapter, not a design template for new code.
- New Config writes use canonical Symbol V5 drafts; V4 remains a read
  compatibility path.
- Do not remove compatibility behavior without characterization coverage and a
  migration plan.
- Do not copy legacy mirrors, raw bridge access, mutable singleton state, or
  runtime folder scanning into new code.

## Completion Evidence

A GPT task is complete only when:

- every acceptance criterion has direct evidence;
- relevant tests and checks pass after the final edit;
- generated/live behavior is verified at the same scope as the claim;
- unverified Illustrator behavior is stated explicitly;
- the final response identifies any warning, retained compatibility path, or
  manual follow-up.
