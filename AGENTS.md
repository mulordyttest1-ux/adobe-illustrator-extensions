# AGENTS.md

Public source of truth for the Adobe Illustrator CEP monorepo.

## Product surfaces

- `wedding-cep/`: Wedding Scripter.
- `symbol-cep/`: Imposition Panel and Wedding Suite Print.
- `toolkit-cep/`: one-click Illustrator utility launcher.
- `libs/wedding/domain/`: UI-independent wedding domain rules.
- `libs/shared/cep-ui/`: shared CEP UI helpers.
- `shared/`: repository lint/test tooling.

Read this file first, then the nearest nested `AGENTS.md` for the module being changed.

## When to load the private devkit

- Running, reading, building, testing, or public CI does not require the private devkit.
- Planning, implementing, fixing, diagnosing, reviewing, migrating, or setting up a machine does require it.
- Before developer work, run `npm run devkit:ensure -- --json` and read the returned devkit `AGENTS.md` plus only the relevant skills.
- If private access is unavailable, read-only inspection may continue, but do not modify product source without the pinned developer workflow.
- The product pins an immutable devkit release and commit in `devkit.lock.json`; never follow devkit `main` implicitly.

## Spec-driven workflow

- Product specifications and plans live under `specs/` and remain versioned with source.
- Use the installed Spec Kit skills in `.agents/skills`:
  - `$speckit-specify`
  - `$speckit-plan`
  - `$speckit-tasks`
  - `$speckit-implement`
- `.task_steps/` remains only for active gate receipts during the migration compatibility window.
- Historical receipts and the retired `.agent` control plane live in the private devkit archive and Git history.

## Invariants

- Every `.jsx`/ExtendScript file must remain ES3 compatible.
- `libs/wedding/domain` must not import from CEP or UI layers.
- Respect Wedding, Symbol, Toolkit, domain, and shared-library ownership boundaries.
- Changes in `libs/shared` are cross-app and require explicit planning plus broad validation.
- D1-2+, shared, or cross-app changes require Review Gate and Verification Gate evidence.
- Do not infer encoding corruption from terminal rendering; verify bytes and run `npm run check:encoding`.
- Never commit credentials, `.env*`, sessions, caches, SQLite files, Adobe binaries, licensed fonts, or machine-local Codex state.
- Do not use `git add -A` on a mixed worktree.

## Root commands

- `npm run devkit:ensure -- --json`
- `npm run setup:repo`
- `npm run doctor:repo -- --json`
- `npm run install:cep-live-links`
- `npm run lint:all`
- `npm run build:all`
- `npm run test:ci`
- `npm run test:smoke:all`
- `npm run verify`
- `npm run check:gates -- --file .task_steps/<c2-file>.md`

## Instruction precedence

1. Nearest nested `AGENTS.md`.
2. Root `AGENTS.md`.
3. Active product specification and constitution.
4. Pinned devkit workflow skill.
5. Git history for historical context only.
