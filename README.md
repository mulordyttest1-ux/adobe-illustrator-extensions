# Adobe Illustrator Extensions

Public, standalone monorepo for the Wedding, Symbol/Imposition, and Toolkit Adobe Illustrator CEP extensions.

## Repository contract

```text
C:\Projects\
|- adobe-illustrator-extensions\  # public product source, specs, tests, CI
`- adobe-illustrator-devkit\      # private developer/AI control plane
```

The product repository can be cloned, installed, built, tested, and used by public CI without private access. Planning, implementation, debugging, review, migration, and workstation setup load the private devkit pinned by `devkit.lock.json`.

GitHub content must always be cloned locally before CEP live links are created. GitHub cannot run an Illustrator panel directly.

## New machine

Save the contents of `NEW_MACHINE_PROMPT.txt` in Notepad and paste it into a blank Codex task. Codex will clone this repository, read `AGENTS.md`, bootstrap the exact devkit release, and run setup plus doctor. The only expected user checkpoints are Administrator elevation, GitHub/Codex sign-in, Adobe licensing, and licensed fonts.

Manual entrypoint after cloning:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-machine.ps1
```

See `MACHINE_SETUP.md` for the full recovery contract.

## Product commands

```powershell
npm ci
npm run devkit:ensure -- --json
npm run setup:repo
npm run doctor:repo -- --json
npm run install:cep-live-links
npm run verify
npm run verify:smoke
```

Compatibility proxies retained for one release:

```powershell
npm run setup:dev
npm run doctor:dev -- --json
npm run backup:machine -- --destination <folder>
npm run restore:machine -- --archive <file> --target <empty-folder>
```

These proxies delegate to the pinned private devkit and print a deprecation warning.

## Source map

- `wedding-cep/`: Wedding Scripter.
- `symbol-cep/`: Imposition Panel and Wedding Suite Print.
- `toolkit-cep/`: utility launcher.
- `libs/wedding/domain/`: UI-independent wedding rules.
- `libs/shared/cep-ui/`: shared CEP UI helpers.
- `shared/`: public repository tooling.
- `specs/`: product specifications and plans.
- `.agents/skills/`: official Spec Kit integration for Codex.
- `.specify/`: Spec Kit constitution, templates, and integration state.

Read root `AGENTS.md` and the nearest nested `AGENTS.md` before changing code.

## Verification lanes

- `npm run verify`: encoding, hygiene, lint, build, and CI-safe tests.
- `npm run verify:smoke`: host-dependent CEP smoke tests.
- `npm run verify:full`: both lanes.
- Symbol debug port: `9198`.
- Wedding debug port: `9197`.
- Toolkit Illustrator 2026 test port: `9099`.

## Security and size policy

- Clean tracked checkout budget: 10 MiB, excluding `.git` and installed dependencies.
- Never commit credentials, `.env*`, sessions, cache, SQLite, Adobe/font binaries, or machine-local Codex paths.
- Runtime assets must be explicitly reviewed and allowlisted.
- Machine backups are encrypted disaster recovery for uncommitted work, not routine source synchronization.
