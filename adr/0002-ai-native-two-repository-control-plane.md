# ADR 0002: AI-native two-repository control plane

- Status: Accepted
- Date: 2026-07-16

## Context

The public CEP monorepo must remain lightweight and independently buildable, while workstation setup, private Codex configuration, deep workflow skills, backup/restore, and process archives have different access and lifecycle requirements.

## Decision

- Keep product source, tests, build configuration, CI, runtime assets, active specifications, minimal agent routing, and official Spec Kit integration in `adobe-illustrator-extensions`.
- Keep the developer/AI workstation control plane in private sibling repository `adobe-illustrator-devkit`.
- Pin the devkit by immutable release and full commit SHA in `devkit.lock.json`; never follow private `main` automatically.
- Use `AGENTS.md` for minimal product invariants, Agent Skills for progressive disclosure, Spec Kit v0.12.16 for specification workflow, and WinGet Configuration for Windows tooling.
- Require a local product clone before creating CEP live links. Do not use a submodule.
- Keep credentials, sessions, licensed fonts, Adobe binaries, and machine-local state out of both repositories.

## Consequences

- Public CI and read-only product use do not require private access.
- A blank Codex task needs one bootstrap prompt containing the public repository URL.
- Developer work first runs `npm run devkit:ensure -- --json` and refuses to overwrite a dirty private checkout.
- Workstation recovery may still pause for elevation, GitHub/Codex authentication, Adobe licensing, and licensed fonts.
- ADR 0001's repository-local `.agent` control plane is retired and retained only in private history/archive.
