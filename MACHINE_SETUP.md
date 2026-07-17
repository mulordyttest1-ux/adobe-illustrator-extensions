# Windows machine setup and recovery

## One-prompt setup

On a new Windows machine, install Codex, open a blank task, and paste `NEW_MACHINE_PROMPT.txt`. That prompt supplies the repository identity that a blank task cannot guess.

The automated flow is:

1. Detect Windows and WinGet; repair/register Microsoft App Installer when possible.
2. Install the declared toolchain.
3. Clone this public product into `C:\Projects\adobe-illustrator-extensions`.
4. Require real GitHub CLI authentication through `gh auth status`.
5. Read `devkit.lock.json`, clone the private sibling, and check out the exact release commit.
6. Let the devkit install portable Codex configuration, Spec Kit, dependencies, hooks, CSXS.11/12 debug settings, and six CEP live links.
7. Run the combined doctor and report `PASS`, `WARN`, or `FAIL`.

Browser GitHub login and a Codex GitHub connector do not replace GitHub CLI authentication.

## Two-repository ownership

- Product source, tests, lockfile, build config, CI, distributable runtime assets, specifications, ADRs, and minimal agent routing stay public here.
- Codex configuration, deep workflow skills, WinGet Configuration, workstation doctor, inventory, backup/restore, and historical process receipts live in private `mulordyttest1-ux/adobe-illustrator-devkit`.
- The product pins devkit `v1.0.1` and its full commit SHA. It never follows private `main` automatically.
- Neither repository stores tokens, authentication state, `.env`, sessions, SQLite, Adobe credentials, or licensed fonts.

## Useful commands

Product-only setup and diagnosis:

```powershell
npm run setup:repo
npm run setup:repo -- --dry-run
npm run doctor:repo -- --json
```

Developer workflow bootstrap:

```powershell
npm run devkit:ensure -- --json
```

The ensure command is idempotent. It clones a missing devkit, updates a clean checkout to the pinned commit, does nothing when already correct, and refuses to overwrite a dirty devkit.

Direct devkit entrypoints:

```powershell
C:\Projects\adobe-illustrator-devkit\bootstrap.ps1 -ProductPath C:\Projects\adobe-illustrator-extensions
C:\Projects\adobe-illustrator-devkit\doctor.ps1 -ProductPath C:\Projects\adobe-illustrator-extensions -Json
C:\Projects\adobe-illustrator-devkit\install-codex.ps1
C:\Projects\adobe-illustrator-devkit\backup-machine.ps1 -ProductPath C:\Projects\adobe-illustrator-extensions -Destination <folder>
C:\Projects\adobe-illustrator-devkit\restore-machine.ps1 -Archive <file> -Target <empty-folder>
```

## Backup and restore

Normal synchronization is intentional Git commits and GitHub pushes. Before migration or risky workstation work, the private backup tool additionally preserves refs/objects, staged and unstaged binary patches, allowed untracked files, and non-secret inventory in a tested AES-256 7-Zip archive with encrypted filenames and a SHA-256 sidecar.

The restore target must be new or empty. Restore never imports GitHub/Codex tokens, Adobe credentials, cache, logs, sessions, SQLite, or licensed font/application binaries.

## Manual checkpoints

Automation pauses only when human authority or licensing is required:

- Administrator elevation or App Installer repair.
- `gh auth login` and Codex sign-in.
- Adobe Creative Cloud installation/license for Illustrator 2025 or 2026.
- Restoration of fonts you are licensed to use.
- Trusting the cloned product in Codex and re-authorizing connectors.

After these checkpoints, rerun the devkit doctor. A closed debug port or a legacy `.panel.dev` wrapper is only a warning. Before production use, open all six work/test panels and run `npm run verify:smoke`.

## Troubleshooting

- Devkit is dirty: commit/stash/move those changes intentionally; ensure will not overwrite them.
- Private access denied: run `gh auth status`, then `gh auth login --web --scopes repo,workflow` if needed.
- Wrong Node/npm: run the devkit bootstrap so WinGet Configuration applies the locked toolchain.
- Wrong CEP target: close Illustrator and rerun `npm run install:cep-live-links`; do not copy `%APPDATA%` from the old machine.
- Missing template: restore `symbol-cep/wedding suite print template.ai` from Git.
- Doctor reports font differences: restore only licensed fonts, then rerun smoke tests.
