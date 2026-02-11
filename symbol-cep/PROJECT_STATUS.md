# Symbol CEP — Project Status

> **Scope:** CEP Extension cho tạo symbol trang trí trên Adobe Illustrator.
> **Governance:** Sử dụng rules từ root `/.agent/` (Monorepo Shared).

## Architecture
- **Layer:** Hexagonal Architecture (Domain/Adapter/Infra)
- **Build:** Direct script loading (no bundler yet)
- **Lint:** ESLint (shared config — chưa áp dụng)

## Current State
- Imposition pipeline functional
- Domain separation standard defined
- Debug via CDP port 8097

## Key Files
- Entry: `cep/index.html`
- Domain: `cep/js/domain/`
- Adapters: `cep/js/adapters/`
