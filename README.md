# Adobe Illustrator Extensions - Monorepo

Monorepo chua cac CEP extension chuyen dung cho Adobe Illustrator.

## Cau truc

```text
adobe-illustrator-extensions/
|- AGENTS.md              # Repo-wide instructions for coding agents
|- .agent/                # Workflows, skills, internal protocol, memory
|- shared/                # Shared tooling
|- libs/                  # Shared libraries
|- symbol-cep/            # Imposition Panel
|- toolkit-cep/           # Personal Toolkit launcher
`- wedding-cep/           # Wedding Scripter
```

## Quick start

### 1. Yeu cau

- Windows 10/11
- Node.js 24 LTS va npm 11
- Git for Windows
- Adobe Illustrator 2025 va 2026

### 2. Cai dat

```bash
npm ci
```

### 3. Dung may development

Một lệnh setup sẽ cài dependency cố định theo lockfile, cài Git hooks, chạy verification, bật `PlayerDebugMode` cho CSXS.11/12 và tạo sáu CEP wrapper live-link:

```powershell
npm run setup:dev
```

Chỉ kiểm tra kế hoạch mà không đổi máy:

```powershell
npm run setup:dev -- --dry-run
```

Xem hướng dẫn backup/restore, Codex, font và Adobe tại [MACHINE_SETUP.md](MACHINE_SETUP.md).

## Development commands

- `npm run lint:symbol`
- `npm run lint:wedding`
- `npm run lint:all`
- `npm run lint:toolkit`
- `npm run check:encoding`
- `npm run build:symbol`
- `npm run build:toolkit`
- `npm run build:wedding`
- `npm run build:all`
- `npm run setup:dev`
- `npm run doctor:dev`
- `npm run backup:machine -- --destination <folder>`
- `npm run restore:machine -- --archive <file> --target <empty-folder>`
- `npm run install:cep-live-links`
- `npm run test:smoke:symbol`
- `npm run test:toolkit`
- `npm run test:wedding`
- `npm run test:domain:wedding`
- `npm run test:smoke:wedding`
- `npm run test:smoke:toolkit`
- `npm run test:smoke:all`
- `npm run test:ci`
- `npm run test:all`
- `npm run test:e2e:symbol` (alias cua `test:smoke:symbol`)
- `npm run test:e2e:toolkit` (alias cua `test:smoke:toolkit`)
- `npm run test:e2e:wedding` (alias cua `test:smoke:wedding`)
- `npm run verify`
- `npm run verify:smoke`
- `npm run verify:full`

## Verification lanes

- `npm run verify`: gate CI-safe cho lint + build + test khong phu thuoc CEP host
- `npm run verify:smoke`: smoke tests can panel CEP dang mo va debug port san sang
- `npm run verify:full`: chay `verify` truoc, sau do chay them smoke lane local

## Debug ports

- Symbol CEP: `http://localhost:9198`
- Toolkit CEP: `http://localhost:9099` (Illustrator 2026 test lane)
- Wedding CEP: `http://localhost:9197`

## Governance

- Day-to-day coding instructions: `AGENTS.md`
- Agent operating model: `AGENT_OPERATING_MODEL.md`
- Scoped instructions: `symbol-cep/AGENTS.md`, `wedding-cep/AGENTS.md`, `libs/shared/AGENTS.md`, `libs/wedding/domain/AGENTS.md`
- Internal workflows va memory: `.agent/`
- Cross-app preflight/postflight taxonomy: `POSTFLIGHT_TAXONOMY.md`
- Architecture decisions: `adr/`

## Feature Navigation

- Wedding workflows: `wedding-cep/FEATURE_MAP.md`
- Symbol workflows: `symbol-cep/FEATURE_MAP.md`
- Toolkit workflows: `toolkit-cep/FEATURE_MAP.md`
- Shared UI surface: `libs/shared/README.md`
- Shared wedding domain: `libs/wedding/domain/README.md`

## Encoding policy

- `npm run check:encoding` scan tracked files va fail khi gap BOM, invalid UTF-8, hoac mojibake marker pho bien.
- `LF-only` hien duoc enforce cho root/shared/tooling surface; legacy app areas con baseline `CRLF` se duoc xu ly o phase rieng.
- Pha dau khong block vendor/minified/generated files, `.agent/`, `.task_steps/`, hay `.nx/`.

## Notes

- `wedding-cep` van con mot so module legacy.
- `symbol-cep` dang la panel co cau truc sach hon.
- `symbol-cep` hien co runtime smoke coverage la chinh; CI vong nay dua vao lint + build.
- `wedding-cep` uses `postflight/report`; `symbol-cep` uses `postflight/hooks`.
