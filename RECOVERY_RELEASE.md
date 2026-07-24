# Immutable Golden Recovery Release

This repository can publish a runtime-only, last-known-good Disaster Recovery/Business Continuity artifact for the three production CEP panels. It supplements—but does not replace—GitHub source history and encrypted machine-state backups.

## Artifact contract

- Tag: `recovery-v<semver>`.
- ZIP: `adobe-illustrator-cep-golden-recovery-v<semver>-<12-char-commit>.zip`.
- Maximum ZIP size: 15 MiB.
- Hosts: Adobe Illustrator 2025/2026 on Windows.
- Extensions: `com.dinhson.imposition`, `com.dinhson.weddingscripter`, and `com.dinhson.toolkit` only.
- Installer: unsigned per-user CEP copy with SHA-256 validation and one rollback.

The artifact deliberately excludes source maps, test/dev panels, tests, developer documentation, build scripts, caches, logs, secrets, Adobe binaries, and licensed fonts. The committed `presets.json` is included verbatim and its selected output paths are declared as a portability exception; an installed user's `presets.json` and `presets.usage.json` take precedence during upgrades.

## Local verification

Packaging intentionally refuses a dirty checkout, a commit not already on `origin/main`, or an existing release tag.

```powershell
npm ci
npm run verify
npm run package:recovery -- --version 1.0.0 --output .artifacts\recovery --json
npm run verify:recovery -- --archive .artifacts\recovery\adobe-illustrator-cep-golden-recovery-v1.0.0-<sha>.zip --json
npm run test:recovery:windows
```

There is no dirty-worktree bypass.

## First release prerequisite

Repository release immutability must be enabled before dispatching `.github/workflows/recovery-release.yml`. GitHub's immutable-releases API requires repository Administration permission, which the workflow's least-privilege `GITHUB_TOKEN` does not receive. An administrator must verify the real setting, then record that completed preflight in the repository Actions variable:

```powershell
$immutable = gh api repos/mulordyttest1-ux/adobe-illustrator-extensions/immutable-releases `
  -H "Accept: application/vnd.github+json" `
  -H "X-GitHub-Api-Version: 2026-03-10" | ConvertFrom-Json
if (-not $immutable.enabled) { throw 'Immutable Releases is not enabled.' }
gh variable set RECOVERY_IMMUTABLE_RELEASES_ENABLED `
  --repo mulordyttest1-ux/adobe-illustrator-extensions `
  --body true
```

The workflow refuses to publish unless this repository variable is exactly `true`. GitHub itself remains the enforcing control: published immutable tags/assets cannot be edited or replaced, and every change requires a new SemVer.

After publication, verify both levels:

```powershell
gh release verify recovery-v1.0.0 --repo mulordyttest1-ux/adobe-illustrator-extensions --format json
gh release verify-asset recovery-v1.0.0 <downloaded-zip> --repo mulordyttest1-ux/adobe-illustrator-extensions --format json
```

GitHub documents the setting and attestation behavior in [Preventing changes to your releases](https://docs.github.com/en/enterprise-cloud@latest/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes). The verification commands are documented in the [GitHub CLI release manual](https://cli.github.com/manual/gh_release_verify).

## Encrypted off-site mirror

After the immutable release verifies, use the pinned private devkit:

```powershell
.\mirror-recovery-release.ps1 -Version 1.0.0 -Destination <folder>
```

The devkit independently downloads and verifies the exact ZIP, checks the published SHA-256, creates a 7-Zip AES-256 archive with filename encryption, tests it, and writes a sidecar checksum. The destination is never hard-coded and the password belongs in a password manager.

## Manual acceptance before relying on the release

Close Illustrator, install the extracted production copy, open all three panels in Illustrator 2025 and 2026, run the smoke suite, and verify preset preservation across reinstall/uninstall/reinstall. Then run `npm run install:cep-live-links` to restore the development wrappers.
