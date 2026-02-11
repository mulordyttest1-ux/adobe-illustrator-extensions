# Wedding CEP — Project Status

> **Scope:** CEP Extension cho thiết kế thiệp cưới trên Adobe Illustrator.
> **Governance:** Sử dụng rules từ root `/.agent/` (Monorepo Shared).

## Architecture
- **Layer:** Hexagonal Architecture (L0→L7)
- **Build:** `esbuild` → `bundle.js`
- **Lint:** ESLint 10 (shared config)

## Current State
- NameValidator: Fixed ethnic name phonetic bypass (2026-02-11)
- All lint errors resolved (25 warnings remaining — accepted complexity)
- E2E testing via CDP on port 8097

## Key Files
- Entry: `cep/js/app.js`
- Bundle: `cep/js/bundle.js`
- Types: `cep/js/types.d.ts`
- Schema: `cep/js/schemaLoader.js`
