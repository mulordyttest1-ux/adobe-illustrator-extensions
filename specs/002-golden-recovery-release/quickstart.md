# Quickstart: Golden Recovery Release

## Build after merge

```powershell
git switch main
git pull --ff-only
npm ci
npm run verify
npm run package:recovery -- --version 1.0.0 --output .artifacts\recovery --json
npm run verify:recovery -- --archive .artifacts\recovery\adobe-illustrator-cep-golden-recovery-v1.0.0-<sha>.zip --json
```

The command must fail if the checkout is dirty, the commit is not on `origin/main`, or `recovery-v1.0.0` already exists.

## Test install without touching the live CEP root

Run the Windows integration suite, which redirects the installer to a temporary extension root. Then inspect the unpacked artifact and confirm that only the three production IDs exist.

## Publish

Enable GitHub Immutable Releases before the first release. Dispatch the Windows recovery release workflow with `version=1.0.0`. It runs repository verification, packages and verifies the ZIP, exercises the installer integration suite, creates the draft, uploads assets, and publishes `recovery-v1.0.0` only after all checks pass.

## Mirror

```powershell
Set-Location C:\Projects\adobe-illustrator-devkit
.\mirror-recovery-release.ps1 -Version 1.0.0 -Destination <encrypted-backup-folder>
```

Store the prompted password in a password manager. Keep the `.7z` and its SHA-256 sidecar together.

## Manual acceptance

1. Close Illustrator and run `install-silent.bat` from the extracted release.
2. Open all three production panels in Illustrator 2025, then 2026.
3. Run the repository smoke suite and verify the committed template/font prerequisites.
4. Reinstall and uninstall/reinstall; confirm user preset data survives upgrades.
5. Run `npm run install:cep-live-links` from the developer checkout to restore the six development wrappers.
