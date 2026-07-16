# Feature Specification: AI-native two-repository workstation

## Goal

A blank Codex task can bootstrap a Windows Adobe CEP development machine from one public repository URL while the product remains independently buildable and the private developer control plane is loaded only for developer work.

## User scenarios

1. A user pastes `NEW_MACHINE_PROMPT.txt` into a blank Codex task. Codex installs missing reviewed tools, clones the product, authenticates GitHub CLI when required, clones the exact private devkit release, configures the workstation, and reports doctor status.
2. Public CI clones only the product and successfully runs `npm ci` plus `npm run verify` without a private token.
3. A development task starts in the product. `AGENTS.md` routes the agent to `devkit:ensure`; the correct sibling is reused, corrected only when clean, or rejected when dirty.
4. A runtime/read-only task uses the product without cloning private developer context.

## Requirements

- Product and devkit are sibling repositories, not a submodule.
- Devkit is private and pinned by release plus full commit SHA.
- Product setup and doctor expose stable JSON/exit-code contracts.
- Credentials, licensed state, caches, and machine-local Codex state are excluded.
- Setup supports Illustrator 2025/2026 and installs six local CEP wrappers.
- Product clean-checkout size stays at or below 10 MiB.

## Out of scope

- Installing Adobe applications or licensed fonts.
- Copying Codex/GitHub/Adobe credentials.
- Running CEP directly from GitHub without a local clone.
