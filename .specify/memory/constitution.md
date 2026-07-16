# Adobe Illustrator CEP Monorepo Constitution

## Core Principles

### I. Product repository remains independently reproducible

Source, tests, lockfile, build/lint configuration, CI, runtime assets, active product specifications, and the minimum agent contract MUST remain in this public repository. Public CI MUST NOT require private devkit access or secrets. Generated output, dependency folders, caches, backups, and machine state MUST NOT be tracked. A clean checkout MUST remain at or below the reviewed 10 MiB budget unless a product PR explicitly changes that budget.

### II. Runtime and bounded-context boundaries are non-negotiable

ExtendScript `.jsx` code MUST remain ES3 compatible. Panel-side JavaScript may use the repository-supported modern syntax. Wedding, Symbol, Toolkit, wedding-domain, and shared UI surfaces MUST respect their nearest `AGENTS.md`. Domain code MUST NOT depend on CEP/UI layers, and shared UI MUST NOT import app-specific implementations.

### III. Developer context is pinned and loaded on demand

Read/build/test tasks may operate from the product alone. Planning, implementation, fixes, diagnosis, review, migration, and workstation setup MUST first resolve `devkit.lock.json` through `npm run devkit:ensure -- --json`. The private sibling devkit MUST be at the exact released commit, MUST NOT be silently changed when dirty, and MUST never be consumed from a moving branch.

### IV. Specifications and evidence precede completion claims

D1-3 work MUST flow through specification, plan, tasks, implementation, review, and verification. Product requirements live in `specs/`; temporary gate receipts may live in `.task_steps/` during compatibility migration. Every completion claim MUST map to fresh command evidence or a clearly named manual checkpoint. A skipped check is a limit, not a pass.

### V. Credentials and licensed state are never portable source

Tokens, Codex auth, connector grants, project trust, `.env*`, sessions, SQLite databases, cache, Adobe credentials, font binaries, and archive passwords MUST NOT enter either repository. A new machine MUST re-authenticate identities and restore only licensed fonts/assets through approved channels. Browser login is not evidence of GitHub CLI authentication.

## Platform and tooling constraints

- Supported workstation: Windows 10 1809+ or Windows 11.
- Supported hosts: Illustrator 2025 and 2026.
- Supported toolchain: Node major 24 and npm major 11, with exact tested versions locked by the devkit release.
- Spec Kit integration is pinned by the devkit and generated into `.agents/skills` and `.specify`.
- CEP wrappers are local filesystem junctions created from a local clone; GitHub cannot be a live CEP filesystem target.

## Development workflow and gates

- Use the nearest `AGENTS.md`, this constitution, active specs, and relevant pinned devkit skills.
- Product runtime changes require relevant lint, build, unit tests, and smoke coverage.
- Shared or cross-app changes require broad validation and explicit consumer review.
- Public product CI runs without the devkit. Devkit CI may clone the public product for compatibility testing.
- Review Gate must reject unrelated files, generated artifacts, secrets, machine state, and unverified pin changes.
- Verification Gate must rerun impacted checks after every review fix.

## Governance

This constitution supersedes the retired `.agent` workflow. Amendments require an active specification, compatibility impact statement, review, verification, and a version update. Historical process receipts are retained in the private devkit archive and Git history, not loaded as current instructions.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
